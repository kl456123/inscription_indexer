import {
  type Token,
  type TokenBalance,
  type GlobalState,
  type DBOption,
  type Transaction,
} from "./types";
import { type Connection } from "typeorm";
import { BigNumber } from "bignumber.js";
import { getDBConnectionAsync } from "./db_connection";
import {
  TokenEntity,
  TokenBalanceEntity,
  InscriptionEntity,
  TransactionEntity,
  GlobalStateEntity,
} from "../src/entities";
import { deserializeBalance, deserializeToken } from "../src/utils";

export class Database {
  public inscriptionNumber: number;
  public connection: Connection;

  constructor() {
    this.inscriptionNumber = 0;
  }

  async connect(dbOption: DBOption): Promise<void> {
    this.connection = await getDBConnectionAsync(dbOption);
    const { inscriptionNumber } = await this.getGlobalState();
    this.inscriptionNumber = inscriptionNumber;
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

  async getAllTokensInfo(): Promise<Token[]> {
    const tokenEntities = await this.connection.manager.find(TokenEntity);
    const tokenInfos = tokenEntities.map(deserializeToken);
    return tokenInfos;
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

  async getGlobalState(): Promise<GlobalState> {
    const globalStateEntity =
      await this.connection.manager.find(GlobalStateEntity);
    if (globalStateEntity.length === 0) {
      return await this.connection.manager.save(
        new GlobalStateEntity({
          proccessedBlockNumber: 0,
          subscribedBlockNumber: 0,
          inscriptionNumber: 0,
        }),
      );
    }
    if (globalStateEntity.length > 1) {
      throw new Error(`no global state exists`);
    }
    return globalStateEntity[0];
  }

  async updateProcessedBlockNumber(blockNumber: number): Promise<void> {
    await this.connection.manager.save({
      id: 0,
      proccessedBlockNumber: blockNumber,
    });
  }

  async updateSubscribedBlockNumber(blockNumber: number): Promise<void> {
    await this.connection.manager.save({
      id: 0,
      subscribedBlockNumber: blockNumber,
    });
  }

  async removeTransaction(tx: Transaction): Promise<void> {
    await this.connection.manager.remove(new TransactionEntity(tx));
  }
}
