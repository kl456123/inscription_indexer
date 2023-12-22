import axios from "axios";

const url = `http://127.0.0.1:3000`;
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
  const tick = "bull";
  const tokenInfo = await requestTokenInfo({ tick });
  console.log(tokenInfo);
  // account
  const address = "0x8b623714b6BA9538c1ab505B0209714Accff7990";
  const tokensBalance = await requestAllTokensBalance({ address });
  console.log(tokensBalance);
}

main();
