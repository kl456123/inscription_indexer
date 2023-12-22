export type Transaction = {
  from: string;
  to: string;
  blockNumber: number;
  txHash: string;
  data: string;
  timestamp: number;
};

export type Token = {
  tick: string;
  id: number;
  max: number;
  limit: number;
  minted: number;
  holders: number;
  numTxs: number;
  createdAt: number;
  completedAt: number;
};

export type Inscription = {
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
};

export type Transfer = {
  tick: string;
  amount: number;
};

export type Mint = {
  tick: string;
  amount: number;
};

export type Deploy = {
  tick: string;
  max: number;
  limit: number;
};

export type Operation = Mint | Deploy | Transfer;
