import axios from "axios";

const url = `http://127.0.0.1:3000`;
async function requestGet(query: any, routePath: string): Promise<any> {
  const res = await axios.get(`${url}${routePath}`, { params: query });
  const quoteRes = res.data;
  return quoteRes;
}

async function requestSupportedNetworks(): Promise<any> {
  return requestGet({}, "/supportedNetworks");
}

async function requestHoldersInfo(query: {
  network: string;
  address?: string;
  key?: string;
}): Promise<any> {
  return requestGet(query, "/holdersInfo");
}

async function requestTokensInfo(query: {
  network: string;
  page?: number;
  perPage?: number;
}): Promise<any> {
  return requestGet(query, "/tokensInfo");
}

async function main(): Promise<void> {
  const { networks } = await requestSupportedNetworks();
  if (networks.length === 0) {
    throw new Error(`no any supported networks`);
  }
  // multiple network names
  const network = networks[0];
  const tokensInfo = await requestTokensInfo({
    network,
    page: 1,
    perPage: 10,
  });
  console.log(tokensInfo);

  const tick = "avas";
  const address = "0x0D1B983bb5839F36dee794f3572848b5542BfaCC";

  // holders
  const tokensBalance = await requestHoldersInfo({
    address,
    network,
    key: tick,
  });
  console.log(tokensBalance);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
