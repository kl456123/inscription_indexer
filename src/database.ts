import {
  type Token,
  type TokenBalance,
  type GlobalState,
  type DBOption,
  type Transaction,
  type OrderInfo,
  Progress,
} from "./types";
import { type Connection, Not, ILike, Equal, MoreThanOrEqual } from "typeorm";
import { getDBConnectionAsync } from "./db_connection";
import {
  TokenEntity,
  TokenBalanceEntity,
  InscriptionEntity,
  TransactionEntity,
  GlobalStateEntity,
} from "../src/entities";
import { BigNumber } from "bignumber.js";
import { deserializeBalance, deserializeToken } from "../src/utils";
import { paginationUtils } from "./utils";

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

  async getHoldersInfo(
    page: number,
    perPage: number,
    filter?: Partial<{ tick: string; address: string }>,
  ): Promise<TokenBalance[]> {
    const holdersEntites = await this.connection.manager.find(
      TokenBalanceEntity,
      {
        where: filter,
        ...paginationUtils.paginateDBFilters(page, perPage),
      },
    );
    const holdersInfo = holdersEntites.map(deserializeBalance);
    return holdersInfo;
  }

  async getHolderInfo(filter: {
    tick: string;
    address: string;
  }): Promise<TokenBalance> {
    const holdersInfo = await this.getHoldersInfo(1, 1, filter);
    if (holdersInfo.length === 0) {
      holdersInfo.push({ ...filter, amount: new BigNumber(0) });
    }
    return holdersInfo[0];
  }

  async getTokensInfo(
    page: number,
    perPage: number,
    order: OrderInfo,
    additionalFilter?: { keyword?: string; progress: Progress },
  ): Promise<{ tokenInfos: Token[]; total: number; page: number }> {
    // TODO(fix filter type)
    const filter: any = {};

    if (additionalFilter !== undefined) {
      if (additionalFilter.keyword !== undefined) {
        filter.tick = ILike(`%${additionalFilter.keyword}%`);
      }
      if (additionalFilter.progress === Progress.Completed) {
        filter.completedAt = Not(Equal(0));
      } else if (additionalFilter.progress === Progress.Ongoing) {
        filter.completedAt = Equal(0);
      }
    }

    const tokenEntities = await this.connection.manager.find(TokenEntity, {
      where: filter,
      ...paginationUtils.paginateDBFilters(page, perPage),
      order,
    });
    const tokenInfos = tokenEntities.map(deserializeToken);

    const total = await this.getTokenCounts(filter);
    return { tokenInfos, total, page };
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

  async getTxCounts(fromTxId: number): Promise<number> {
    return this.connection.manager.count(TransactionEntity, {
      where: { txId: MoreThanOrEqual(fromTxId) },
    });
  }

  async getTokenCounts(filter): Promise<number> {
    return this.connection.manager.count(TokenEntity, { where: filter });
  }

  async getTransactions(
    page: number,
    perPage: number,
    fromTxId: number,
  ): Promise<TransactionEntity[]> {
    const txs = await this.connection.manager.find(TransactionEntity, {
      where: { txId: MoreThanOrEqual(fromTxId) },
      ...paginationUtils.paginateDBFilters(page, perPage),
      order: {
        txId: "ASC",
      },
    });
    return txs;
  }

  async getGlobalState(): Promise<GlobalState> {
    const globalStateEntity =
      await this.connection.manager.find(GlobalStateEntity);
    if (globalStateEntity.length === 0) {
      return await this.connection.manager.save(
        new GlobalStateEntity({
          processedTxId: 0,
          subscribedBlockNumber: 0,
          inscriptionNumber: 0,
        }),
      );
    }
    if (globalStateEntity.length > 1) {
      throw new Error(`multiple global states exist`);
    }
    return globalStateEntity[0];
  }

  async updateProcessedTxId(txId: number): Promise<void> {
    await this.connection.manager.save({
      id: 0,
      proccssedTxId: txId,
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
