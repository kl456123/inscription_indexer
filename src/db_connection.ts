import { type Connection, DataSource } from "typeorm";

/**
 *  * Creates the DB connnection to use in an app
 *   */
import "reflect-metadata";
import {
  TransactionEntity,
  TokenEntity,
  InscriptionEntity,
  TokenBalanceEntity,
} from "./entities";

// import * as config from './ormconfig';

let connection: Connection;

export async function getDBConnectionAsync(): Promise<Connection> {
  if (connection == null) {
    // connection = await createConnection(config as any as ConnectionOptions);

    connection = new DataSource({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "test",
      password: "test",
      database: "test",
      synchronize: true,
      logging: false,
      entities: [
        TransactionEntity,
        TokenEntity,
        InscriptionEntity,
        TokenBalanceEntity,
      ],
      migrations: [],
      subscribers: [],
    });
  }
  await connection.initialize();
  return connection;
}
