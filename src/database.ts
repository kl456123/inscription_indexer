import {
  type Token,
  type TokenBalance,
  type GlobalState,
  type DBOption,
  type Transaction,
  Progress,
} from "./types";
import {
  type Connection,
  Not,
  ILike,
  Equal,
  In,
  MoreThanOrEqual,
  type FindOptionsOrder,
} from "typeorm";
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
  public connection: Connection;

  // constructor() {}

  async connect(dbOption: DBOption): Promise<void> {
    this.connection = await getDBConnectionAsync(dbOption);
  }

  async getHoldersInfo(
    page: number,
    perPage: number,
    order?: FindOptionsOrder<TokenBalanceEntity>,
    additionalFilter?: { tick: string; address: string; chainIds: number[] },
  ): Promise<{ holdersInfo: TokenBalance[]; total: number; page: number }> {
    const filter: any = {};
    if (additionalFilter !== undefined) {
      filter.tick = additionalFilter.tick;
      filter.address = additionalFilter.address;
      filter.chainId = In(additionalFilter.chainIds);
    }
    const holdersEntites = await this.connection.manager.find(
      TokenBalanceEntity,
      {
        where: filter,
        ...paginationUtils.paginateDBFilters(page, perPage),
        order,
      },
    );
    const holdersInfo = holdersEntites.map(deserializeBalance);
    const totalCount = await this.getHoldersCounts(filter);
    const total = Math.ceil(totalCount / perPage);
    return { holdersInfo, total, page };
  }

  async getHolderInfo(
    chainId: number,
    filter: {
      tick: string;
      address: string;
    },
  ): Promise<TokenBalance> {
    const { holdersInfo, total } = await this.getHoldersInfo(
      1,
      1,
      {},
      { ...filter, chainIds: [chainId] },
    );
    if (total === 0) {
      holdersInfo.push({ chainId, ...filter, amount: new BigNumber(0) });
    }
    return holdersInfo[0];
  }

  async getTokensInfo(
    page: number,
    perPage: number,
    order?: FindOptionsOrder<TokenBalanceEntity>,
    additionalFilter?: {
      keyword?: string;
      progress: Progress;
      chainIds: number[];
    },
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
      filter.chainId = In(additionalFilter.chainIds);
    }

    const tokenEntities = await this.connection.manager.find(TokenEntity, {
      where: filter,
      ...paginationUtils.paginateDBFilters(page, perPage),
      order,
    });
    const tokenInfos = tokenEntities.map(deserializeToken);

    const totalCount = await this.getTokenCounts(filter);
    const total = Math.ceil(totalCount / perPage);
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

  async getHoldersCounts(filter): Promise<number> {
    return this.connection.manager.count(TokenBalanceEntity, { where: filter });
  }

  async getTransactions(
    page: number,
    perPage: number,
    fromTxId: number,
    chainId: number,
  ): Promise<TransactionEntity[]> {
    const txs = await this.connection.manager.find(TransactionEntity, {
      where: { txId: MoreThanOrEqual(fromTxId), chainId },
      ...paginationUtils.paginateDBFilters(page, perPage),
      order: {
        txId: "ASC",
      },
    });
    return txs;
  }

  async getGlobalState(chainId: number): Promise<GlobalState> {
    const globalStateEntity = await this.connection.manager.find(
      GlobalStateEntity,
      { where: { chainId } },
    );
    if (globalStateEntity.length === 0) {
      return await this.connection.manager.save(
        new GlobalStateEntity({
          chainId,
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

  async removeTransaction(tx: Transaction): Promise<void> {
    await this.connection.manager.remove(new TransactionEntity(tx));
  }
}
