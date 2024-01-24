import { expect } from "chai";
import { TxProcessor } from "../src/tx_processor";
import { Database } from "../src/database";
import txs from "../data/txs.json";

describe("tx_processor", () => {
  let txProcessor: TxProcessor;
  let database: Database;
  const dbOption = {
    dbHost: "localhost",
    dbName: "avax",
    dbUsername: "test",
    dbPasswd: "test",
  };
  beforeEach(async () => {
    database = new Database();
    await database.connect(dbOption);
    txProcessor = new TxProcessor(database, 1);
  });

  it("basic usage", async () => {
    await txProcessor.processTx(txs.slice(0, 3));
    const tick = "bull";
    expect(await database.checkTokenExistByTickName(tick)).to.be.true;
    const holdersInfo = await database.getHoldersInfo(1, 10, {
      tick,
      address: "0x32CD96D68aBAD6c4d2A4E45155feE7D233969Ce0",
    });
    expect(holdersInfo.length).gt(0);
    expect(holdersInfo[0].amount.gt(0)).to.be.true;

    // lili
    expect(await database.checkTokenExistByTickName("lili")).to.be.true;
  });
});
