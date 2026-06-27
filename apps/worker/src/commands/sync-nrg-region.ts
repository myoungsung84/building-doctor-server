import {
  REGION_ADDRESS_PREFIXES,
  REGION_LAWD_CODES,
  type SupportedRegion,
} from '../constants/region-lawd-codes';
import {
  parseCliArgs,
  resolveSyncDealYmdOptions,
  runSyncNrgTargets,
} from './sync-nrg.command-support';

async function bootstrap(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const rawRegion = args.region;

  if (!rawRegion) {
    throw new Error('region is required. Use --region=<supported-region>');
  }

  if (!isSupportedRegion(rawRegion)) {
    const supportedRegions = Object.keys(REGION_LAWD_CODES).join(', ');
    throw new Error(`Unsupported region "${rawRegion}". Supported regions: ${supportedRegions}`);
  }

  const region = rawRegion;
  const dealYmdOptions = resolveSyncDealYmdOptions(args);
  const targets = REGION_LAWD_CODES[region].map((entry) => ({
    addressPrefix: REGION_ADDRESS_PREFIXES[region],
    dealYmds: dealYmdOptions.dealYmds,
    lawdCd: entry.lawdCd,
    mode: dealYmdOptions.mode,
    name: entry.name,
  }));
  const result = await runSyncNrgTargets({
    commandContext: 'SyncNrgRegionCommand',
    continueOnError: true,
    onTargetFailure: ({ error, target }, progress) => {
      console.error(
        `[commercial:region] ${region} ${progress.current}/${progress.total} ${target.name ?? target.lawdCd}(${target.lawdCd}) failed: ${error.message}`,
      );
    },
    onTargetStart: (target, progress) => {
      console.log(
        `[commercial:region] ${region} ${progress.current}/${progress.total} ${target.name ?? target.lawdCd}(${target.lawdCd}) start`,
      );
    },
    onTargetSuccess: ({ target }, progress) => {
      console.log(
        `[commercial:region] ${region} ${progress.current}/${progress.total} ${target.name ?? target.lawdCd}(${target.lawdCd}) done`,
      );
    },
    targets,
  });

  if (result.skippedByLock) {
    return;
  }

  console.log(
    `[commercial:region] ${region} summary success=${result.successes.length} failed=${result.failures.length}`,
  );

  if (result.failures.length > 0) {
    const failedTargets = result.failures
      .map(
        ({ target, error }) =>
          `${target.name ?? target.lawdCd}(${target.lawdCd}): ${error.message}`,
      )
      .join(', ');

    console.error(`[commercial:region] ${region} failures ${failedTargets}`);
    process.exitCode = 1;
  }
}

function isSupportedRegion(region: string): region is SupportedRegion {
  return region in REGION_LAWD_CODES;
}

void bootstrap();
