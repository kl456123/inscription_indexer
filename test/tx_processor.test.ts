import { expect } from "chai";
import { TxProcessor } from "../src/tx_processor";
import { Database } from "../src/database";
import { Transaction } from "../src/types";
import txs from "../data/txs.json";

describe("tx_processor", () => {
  let txProcessor: TxProcessor;
  let database: Database;
  beforeEach(() => {
    database = new Database();
    txProcessor = new TxProcessor(database, 1);
  });

  it("basic usage", () => {
    txProcessor.processTx(txs.slice(0, 2));
    expect(database.tokens.hasOwnProperty("bull")).to.be.true;
    expect(
      database.balances["0x32CD96D68aBAD6c4d2A4E45155feE7D233969Ce0"]["bull"],
    ).gt(0);
  });
});
