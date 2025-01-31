import { TokenBalanceEntity, TokenEntity } from "./entities";
import { type TokenBalance, type Token, Progress, Order } from "./types";
import { BigNumber } from "bignumber.js";
import { type Context } from "koa";
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from "./constants";
import { type FindOptionsOrder } from "typeorm";
import { MAX_PER_PAGE } from "./config";

export function deserializeBalance(
  tokenBalance: TokenBalanceEntity,
): TokenBalance {
  return { ...tokenBalance, amount: new BigNumber(tokenBalance.amount) };
}

export function serializeBalance(
  tokenBalance: TokenBalance,
): TokenBalanceEntity {
  const balanceEntity = new TokenBalanceEntity();
  balanceEntity.amount = tokenBalance.amount.toString();
  balanceEntity.address = tokenBalance.address;
  balanceEntity.tick = tokenBalance.tick;
  balanceEntity.chainId = tokenBalance.chainId;
  return balanceEntity;
}

export function deserializeToken(token: TokenEntity): Token {
  return {
    ...token,
    progress: new BigNumber(token.progress),
    max: new BigNumber(token.max),
    limit: new BigNumber(token.limit),
    minted: new BigNumber(token.minted),
  };
}

export function serializeToken(token: Token): TokenEntity {
  const tokenEntity = new TokenEntity();
  // TODO(prevent scientific notation)
  tokenEntity.max = token.max.toString();
  tokenEntity.limit = token.limit.toString();
  tokenEntity.minted = token.minted.toString();
  tokenEntity.progress = token.progress.toFixed(8);

  tokenEntity.id = token.id;
  tokenEntity.protocol = token.protocol;
  tokenEntity.tick = token.tick;
  tokenEntity.holders = token.holders;
  tokenEntity.numTxs = token.numTxs;
  tokenEntity.createdAt = token.createdAt;
  tokenEntity.completedAt = token.completedAt;
  tokenEntity.chainId = token.chainId;
  return tokenEntity;
}

export const paginationUtils = {
  /**
   *  Paginates locally in memory from a larger collection
   * @param records The records to paginate
   * @param page The current page for these records
   * @param perPage The total number of records to return per page
   */
  paginate: <T>(records: T[], page: number, perPage: number) => {
    return paginationUtils.paginateSerialize(
      records.slice((page - 1) * perPage, page * perPage),
      records.length,
      page,
      perPage,
    );
  },
  paginateDBFilters: (page: number, perPage: number) => {
    return {
      skip: (page - 1) * perPage,
      take: perPage,
    };
  },
  paginateSerialize: <T>(
    collection: T[],
    total: number,
    page: number,
    perPage: number,
  ) => {
    const paginated = {
      total,
      page,
      perPage,
      records: collection,
    };
    return paginated;
  },

  parsePaginationConfig: (ctx: Context): { page: number; perPage: number } => {
    const page =
      ctx.query.page === undefined ? DEFAULT_PAGE : Number(ctx.query.page);
    const perPage =
      ctx.query.pageSize === undefined
        ? DEFAULT_PER_PAGE
        : Number(ctx.query.pageSize);
    requireCond(
      perPage <= MAX_PER_PAGE,
      `perPage should be less or equal to ${MAX_PER_PAGE}`,
      ValidationErrors.InvalidFields,
    );
    return { page, perPage };
  },
};

export class APIError extends Error {
  constructor(
    msg: string,
    readonly code?: number,
    readonly data: any = undefined,
  ) {
    super(msg);
  }
}

export function requireCond(
  cond: boolean,
  msg: string,
  code?: number,
  data: any = undefined,
): void {
  if (!cond) {
    throw new APIError(msg, code, data);
  }
}

export enum ValidationErrors {
  InvalidFields = -32602,
}

export function parseProgressInfo(ctx: Context): Progress {
  const progress = parseInt(ctx.query.progress as string);
  requireCond(
    Object.values(Progress).includes(progress),
    `invalid orderBy params: ${progress}`,
  );
  return progress as Progress;
}

export function parseOrderInfo(
  ctx: Context,
  availableNames: string[],
): FindOptionsOrder<TokenBalanceEntity> {
  const order: FindOptionsOrder<TokenBalanceEntity> = {};
  const orderBy = ctx.query.orderBy as string | undefined;
  if (orderBy !== undefined) {
    requireCond(
      availableNames.includes(orderBy),
      `invalid orderBy params: ${orderBy}`,
      ValidationErrors.InvalidFields,
    );
    requireCond(
      ctx.query.order !== undefined,
      `invalid orderType`,
      ValidationErrors.InvalidFields,
    );
    const orderType = parseInt(ctx.query.order as string);
    requireCond(
      Object.values(Order).includes(orderType),
      `invalid order params: ${orderType}`,
      ValidationErrors.InvalidFields,
    );
    order[orderBy] = orderType;
  }
  const keyNames = Object.keys(order);
  if (keyNames.length > 1) {
    throw new Error(`invalid order info`);
  }
  return order;
}
