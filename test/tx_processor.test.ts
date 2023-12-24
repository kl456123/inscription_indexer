import { expect } from "chai";
import { TxProcessor } from "../src/tx_processor";
import { Database } from "../src/database";
import txs from "../data/txs.json";

describe("tx_processor", () => {
  let txProcessor: TxProcessor;
  let database: Database;
  beforeEach(async () => {
    database = new Database();
    await database.connect();
    txProcessor = new TxProcessor(database, 1);
  });

  it("basic usage", async () => {
    await txProcessor.processTx(txs.slice(0, 2));
    const tick = "bull";
    expect(await database.checkTokenExistByTickName(tick)).to.be.true;
    const balance = await database.getTokenBalance(
      tick,
      "0x32CD96D68aBAD6c4d2A4E45155feE7D233969Ce0",
    );
    expect(balance.amount.toNumber()).gt(0);
  });
});
