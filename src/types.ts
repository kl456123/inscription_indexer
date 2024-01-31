import { type BigNumber } from "bignumber.js";

export interface Transaction {
  // only used internal
  txId?: number;
  from: string;
  to: string;
  blockNumber: number;
  txHash: string;
  data: string;
  timestamp: number;
  chainId: number;
}

export interface Token {
  tick: string;
  protocol: string;
  id: number;
  max: BigNumber;
  limit: BigNumber;
  minted: BigNumber;
  progress: BigNumber;
  holders: number;
  numTxs: number;
  createdAt: number;
  completedAt: number;
  chainId: number;
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
  chainId: number;
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
  chainId: number;
}

export interface GlobalState {
  processedTxId: number;
  subscribedBlockNumber: number;
  inscriptionNumber: number;
  chainId: number;
}

export type Operation = Mint | Deploy | Transfer;

export interface DBOption {
  dbHost: string;
  dbName: string;
  dbUsername: string;
  dbPasswd: string;
}

export enum Progress {
  Completed,
  Ongoing,
  All,
}

export enum Order {
  ASC = 1,
  DESC = -1,
}
