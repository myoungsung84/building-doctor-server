import { URL } from 'node:url';

type MolitNrgTradeClientOptions = {
  baseUrl: string;
  serviceKey: string;
};

export type MolitNrgTradePageRequest = {
  dealYmd: string;
  lawdCd: string;
  numOfRows?: number;
  pageNo: number;
};

export class MolitNrgTradeClient {
  constructor(private readonly options: MolitNrgTradeClientOptions) {}

  async fetchPage(request: MolitNrgTradePageRequest): Promise<string> {
    const url = new URL(this.options.baseUrl);

    url.searchParams.set('serviceKey', this.options.serviceKey);
    url.searchParams.set('LAWD_CD', request.lawdCd);
    url.searchParams.set('DEAL_YMD', request.dealYmd);
    url.searchParams.set('pageNo', String(request.pageNo));
    url.searchParams.set('numOfRows', String(request.numOfRows ?? 100));

    const response = await fetch(url, {
      headers: {
        Accept: 'application/xml,text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`MOLIT API request failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }
}
