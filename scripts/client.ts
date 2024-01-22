import axios from "axios";

const url = `http://127.0.0.1:3000`;
async function requestGet(query: any, routePath: string): Promise<any> {
  const res = await axios.get(`${url}${routePath}`, { params: query });
  const quoteRes = res.data;
  return quoteRes;
}

async function requestAllTokensBalance(query: {
  address: string;
  network: string;
}): Promise<any> {
  return requestGet(query, "/allTokensBalance");
}

async function requestSupportedNetworks(): Promise<any> {
  return requestGet({}, "/supportedNetworks");
}

async function requestTokenBalance(query: {
  network: string;
  address: string;
  tick: string;
}): Promise<any> {
  return requestGet(query, "/tokenBalance");
}

async function requestTokenInfo(query: {
  tick: string;
  network: string;
}): Promise<any> {
  return requestGet(query, "/tokenInfo");
}

async function requestAllTokensInfo(query: {
  network: string;
  page?: number;
  perPage?: number;
}): Promise<any> {
  return requestGet(query, "/allTokensInfo");
}

async function main(): Promise<void> {
  const { networks } = await requestSupportedNetworks();
  if (networks.length === 0) {
    throw new Error(`no any supported networks`);
  }
  // multiple network names
  const network = networks[0];
  const allTokensInfo = await requestAllTokensInfo({
    network,
    page: 1,
    perPage: 10,
  });
  console.log(allTokensInfo);

  const tick = "avas";
  const address = "0x0D1B983bb5839F36dee794f3572848b5542BfaCC";

  const tokenInfo = await requestTokenInfo({ tick, network });
  console.log(tokenInfo);
  // account
  const tokensBalance = await requestAllTokensBalance({ address, network });
  console.log(tokensBalance);

  const tokenBalance = await requestTokenBalance({ address, tick, network });
  console.log(tokenBalance);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
