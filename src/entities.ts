import { Entity, PrimaryColumn, Column } from "typeorm";
import { Transaction, Inscription } from "./types";

@Entity({ name: "transaction" })
class TransactionEntity {
  @PrimaryColumn({ name: "txHash" })
  public txHash: string;

  @Column({ name: "from" })
  public from: string;

  @Column({ name: "to" })
  public to: string;

  @Column({ name: "blockNumber" })
  public blockNumber: number;

  @Column({ name: "data" })
  public data: string;

  @Column({ name: "timestamp" })
  public timestamp: number;

  constructor(transaction: Transaction) {
    Object.assign(this, transaction);
  }
}

@Entity({ name: "token" })
class TokenEntity {
  @PrimaryColumn({ name: "id" })
  public id: number;

  @Column({ name: "tick" })
  public tick: string;

  @Column({ name: "max" })
  public max: string;

  @Column({ name: "limit" })
  public limit: string;

  @Column({ name: "minted" })
  public minted: string;

  @Column({ name: "holders" })
  public holders: number;

  @Column({ name: "numTxs" })
  public numTxs: number;

  @Column({ name: "createdAt" })
  public createdAt: number;

  @Column({ name: "completedAt" })
  public completedAt: number;
}

@Entity({ name: "inscription" })
class InscriptionEntity {
  @PrimaryColumn({ name: "id" })
  id: number;

  @PrimaryColumn({ name: "txHash" })
  txHash: string;

  @Column({ name: "protocol" })
  protocol: string;

  @Column({ name: "from" })
  from: string;

  @Column({ name: "to" })
  to: string;

  @Column({ name: "timestamp" })
  timestamp: number;

  @Column({ name: "content" })
  content: string;

  @Column({ name: "contentType" })
  contentType: string;

  @Column({ name: "valid" })
  valid: boolean;

  constructor(inscription: Inscription) {
    Object.assign(this, inscription);
  }
}

@Entity({ name: "balance" })
class TokenBalanceEntity {
  @PrimaryColumn({ name: "address" })
  address: string;

  @PrimaryColumn({ name: "tick" })
  tick: string;

  @Column({ name: "amount" })
  amount: string;
}

@Entity({ name: "global_state" })
class GlobalStateEntity {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column({ name: "processed_block_number" })
  proccessedBlockNumber: number;

  @Column({ name: "subscribed_block_number" })
  subscribedBlockNumber: number;

  constructor(globalState: {
    proccessedBlockNumber?: number;
    subscribedBlockNumber?: number;
  }) {
    this.id = 0;
    Object.assign(this, globalState);
  }
}

export {
  InscriptionEntity,
  TokenEntity,
  TransactionEntity,
  TokenBalanceEntity,
  GlobalStateEntity,
};
