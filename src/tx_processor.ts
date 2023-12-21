import { Database } from "./database";

export class TxProcessor {
  constructor(protected db: Database) {}

  async processTx() {
    while (this.db.txs.length > 0) {
      const tx = this.db.txs.pop()!;
      tx.content.trimStart();
      if (tx.content[0] == "{") {
        const jsonData = JSON.parse(tx.content);
        // protocol type
        const protocol = jsonData["p"];
        if (protocol == "asc-20") {
        }
      }
    }
  }

  processDeployOperation() {}
  processMintOperation() {}
  processTransferOperation() {}

  async start() {}
}
