import Koa from "koa";
import dotenv from "dotenv";
import { getAllRouters } from "./router";
import { ethers } from "ethers";
import { TxSubscriber } from "./tx_subscriber";
import { TxProcessor } from "./tx_processor";
import { Database } from "./database";

dotenv.config();

async function getApp() {
  const app = new Koa();
  const options = {
    serverPort: process.env.SERVER_PORT || "3000",
    serverIP: process.env.SERVER_IP || "127.0.0.1",
    url: process.env.MAINNET_URL,
    fastSyncBatch: 20, // blocks size
    txSizes: 10, // txs size
    filterTokens: [],
  };
  const provider = new ethers.JsonRpcProvider(options.url);
  // const currentBlockNumber = await provider.getBlockNumber();
  const fromBlock = 38529642;
  const db = new Database();
  const router = getAllRouters(db);
  app.use(router.routes());
  app.listen(parseInt(options.serverPort), options.serverIP);

  // fetch txs and save to db
  const txSubscriber = new TxSubscriber(
    provider,
    db,
    fromBlock,
    options.fastSyncBatch,
  );
  txSubscriber.start();

  // process all saved txs in db
  const txProcessor = new TxProcessor(db, options.txSizes);
  txProcessor.start();
}

getApp();
