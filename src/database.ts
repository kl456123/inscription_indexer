import { Transaction, Token, Inscription } from "./types";

export class Database {
  public txs: Transaction[];
  public inscriptions: Inscription[];
  public balances: Record<string, Record<string, number>>;
  public tokens: Record<string, Token>;
  public inscriptionNumber: number;
  constructor() {
    this.balances = {};
    this.txs = [];
    this.inscriptions = [];
    this.tokens = {};
    this.inscriptionNumber = 0;
  }
}
