import { TokenBalanceEntity, TokenEntity } from "./entities";
import { type TokenBalance, type Token } from "./types";
import { BigNumber } from "bignumber.js";
import { type Context } from "koa";
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from "./constants";
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
  return balanceEntity;
}

export function deserializeToken(token: TokenEntity): Token {
  return {
    ...token,
    max: new BigNumber(token.max),
    limit: new BigNumber(token.limit),
    minted: new BigNumber(token.minted),
  };
}

export function serializeToken(token: Token): TokenEntity {
  const tokenEntity = new TokenEntity();
  tokenEntity.max = token.max.toString();
  tokenEntity.limit = token.limit.toString();
  tokenEntity.minted = token.minted.toString();

  tokenEntity.id = token.id;
  tokenEntity.tick = token.tick;
  tokenEntity.holders = token.holders;
  tokenEntity.numTxs = token.numTxs;
  tokenEntity.createdAt = token.createdAt;
  tokenEntity.completedAt = token.completedAt;
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
      ctx.query.perPage === undefined
        ? DEFAULT_PER_PAGE
        : Number(ctx.query.perPage);
    if (perPage > MAX_PER_PAGE) {
      throw new Error(`perPage should be less or equal to ${MAX_PER_PAGE}`);
    }
    return { page, perPage };
  },
};
