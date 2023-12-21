import { Transaction, Token } from "./types";

export class Database {
  public txs: Transaction[];
  public balances: Record<string, Record<string, number>>;
  public tokens: Record<string, Token>;
  constructor() {
    this.balances = {};
    this.txs = [];
    this.tokens = {};
  }
}
