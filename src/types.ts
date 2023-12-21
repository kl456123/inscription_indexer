export type Transaction = {
  from: string;
  to: string;
  blockNumber: number;
  content: string;
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
  tick: string;
  operation: string;
  amount: number;
  valid: boolean;
};
