import axios from "axios";

const url = `http://localhost:3000`;
async function requestGet(query: any, routePath: string) {
  const res = await axios.get(`${url}${routePath}`, { params: query });
  const quoteRes = res.data;
  return quoteRes;
}

async function requestAllTokensBalance(query: { address: string }) {
  return requestGet(query, "/allTokensBalance");
}

async function requestTokenInfo(query: { tick: string }) {
  return requestGet(query, "/tokenInfo");
}

async function main() {
  const tick = "avax";
  await requestTokenInfo({ tick });
  // account
  const address = "";
  await requestAllTokensBalance({ address });
}

main();
