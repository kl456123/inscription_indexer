import { type Token, type TokenBalance } from "./types";
import { type Connection } from "typeorm";
import { BigNumber } from "bignumber.js";
import { getDBConnectionAsync } from "./db_connection";
import {
  TokenEntity,
  TokenBalanceEntity,
  InscriptionEntity,
  TransactionEntity,
} from "../src/entities";
import { deserializeBalance, deserializeToken } from "../src/utils";

export class Database {
  public inscriptionNumber: number;
  public connection: Connection;

  constructor() {
    this.inscriptionNumber = 0;
  }

  async connect(): Promise<void> {
    this.connection = await getDBConnectionAsync();
  }

  async getTokenBalance(tick: string, address: string): Promise<TokenBalance> {
    const balanceEntity = await this.connection.manager.findOne(
      TokenBalanceEntity,
      {
        where: {
          tick,
          address,
        },
      },
    );
    const balance =
      balanceEntity !== null
        ? deserializeBalance(balanceEntity)
        : { tick, address, amount: new BigNumber(0) };
    return balance;
  }

  async getTokenInfo(tick: string): Promise<Token> {
    const tokenEntity = await this.connection.manager.findOne(TokenEntity, {
      where: { tick },
    });
    if (tokenEntity == null) {
      throw new Error("cannot find token");
    }
    const tokenInfo = deserializeToken(tokenEntity);
    return tokenInfo;
  }

  async checkInscriptionExistByTxHash(txHash: string): Promise<boolean> {
    return this.connection.manager.exists(InscriptionEntity, {
      where: { txHash },
    });
  }

  async checkTokenExistByTickName(tick: string): Promise<boolean> {
    return this.connection.manager.exists(TokenEntity, {
      where: { tick },
    });
  }

  async getTxCounts(): Promise<number> {
    return this.connection.manager.count(TransactionEntity);
  }

  async getTransactions(): Promise<TransactionEntity[]> {
    const txs = await this.connection.manager.find(TransactionEntity);
    return txs;
  }

  // async saveEntity() {}
}
