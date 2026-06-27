import {
  parseCliArgs,
  resolveSyncDealYmdOptions,
  runSyncNrgTargets,
} from './sync-nrg.command-support';

function resolveSyncOptions(argv: string[]) {
  const args = parseCliArgs(argv);
  const lawdCd = args.lawdCd;

  if (!lawdCd || !/^\d+$/.test(lawdCd)) {
    throw new Error('lawdCd is required and must be numeric');
  }

  return {
    lawdCd,
    ...resolveSyncDealYmdOptions(args),
  };
}

async function bootstrap(): Promise<void> {
  const options = resolveSyncOptions(process.argv.slice(2));
  const result = await runSyncNrgTargets({
    commandContext: 'SyncNrgCommand',
    continueOnError: false,
    targets: [options],
  });

  if (result.skippedByLock) {
    return;
  }

  const summary = result.successes[0]?.summary;

  if (!summary) {
    throw result.failures[0]?.error ?? new Error('sync summary is missing');
  }

  console.log(
    `[commercial:range] summary fetched=${summary.fetchedItems} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped}`,
  );
}

void bootstrap();
