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

async function requestTokenInfo(query: { tick: string }): Promise<any> {
  return requestGet(query, "/tokenInfo");
}

async function main(): Promise<void> {
  const tick = "bull";
  const tokenInfo = await requestTokenInfo({ tick });
  console.log(tokenInfo);
  // account
  const address = "0xf270C8C54fF2733f4126bc5ebCC527669a647dCA";
  const tokensBalance = await requestAllTokensBalance({ address });
  console.log(tokensBalance);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
