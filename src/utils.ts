import { TokenBalanceEntity, TokenEntity } from "./entities";
import { type TokenBalance, type Token } from "./types";
import { BigNumber } from "bignumber.js";

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
