import axios from "axios";

const url = `http://127.0.0.1:3000`;
async function requestGet(query: any, routePath: string): Promise<any> {
  const res = await axios.get(`${url}${routePath}`, { params: query });
  const quoteRes = res.data;
  return quoteRes;
}

async function requestAllTokensBalance(query: {
  address: string;
}): Promise<any> {
  return requestGet(query, "/allTokensBalance");
}

async function requestTokenBalance(query: {
  address: string;
  tick: string;
}): Promise<any> {
  return requestGet(query, "/tokenBalance");
}

async function requestTokenInfo(query: { tick: string }): Promise<any> {
  return requestGet(query, "/tokenInfo");
}

async function requestAllTokensInfo(): Promise<any> {
  return requestGet({}, "/allTokensInfo");
}

async function main(): Promise<void> {
  const allTokensInfo = await requestAllTokensInfo();
  console.log(allTokensInfo);
  const tick = "avas";
  const address = "0x0D1B983bb5839F36dee794f3572848b5542BfaCC";

  const tokenInfo = await requestTokenInfo({ tick });
  console.log(tokenInfo);
  // account
  const tokensBalance = await requestAllTokensBalance({ address });
  console.log(tokensBalance);

  const tokenBalance = await requestTokenBalance({ address, tick });
  console.log(tokenBalance);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
