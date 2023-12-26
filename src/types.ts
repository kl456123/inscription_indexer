import { type BigNumber } from "bignumber.js";

export interface Transaction {
  from: string;
  to: string;
  blockNumber: number;
  txHash: string;
  data: string;
  timestamp: number;
}

export interface Token {
  tick: string;
  id: number;
  max: BigNumber;
  limit: BigNumber;
  minted: BigNumber;
  holders: number;
  numTxs: number;
  createdAt: number;
  completedAt: number;
}

export interface Inscription {
  id: number;
  txHash: string;
  protocol: string;
  from: string;
  to: string;
  // operationType: string;
  // operation: Operation;
  timestamp: number;
  content: string;
  contentType: string;
  valid: boolean;
}

export interface Transfer {
  tick: string;
  amount: BigNumber;
}

export interface Mint {
  tick: string;
  amount: BigNumber;
}

export interface Deploy {
  tick: string;
  max: BigNumber;
  limit: BigNumber;
}

export interface TokenBalance {
  address: string;
  tick: string;
  amount: BigNumber;
}

export interface GlobalState {
  proccessedBlockNumber: number;
  subscribedBlockNumber: number;
}

export type Operation = Mint | Deploy | Transfer;
