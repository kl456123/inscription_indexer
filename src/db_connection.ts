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
  GlobalStateEntity,
} from "./entities";
import { type DBOption } from "./types";

// import * as config from './ormconfig';

let connection: Connection;

export async function getDBConnectionAsync(
  dbOption: DBOption,
): Promise<Connection> {
  if (connection == null) {
    // connection = await createConnection(config as any as ConnectionOptions);

    connection = new DataSource({
      type: "postgres",
      host: dbOption.dbHost,
      port: 5432,
      username: dbOption.dbUsername,
      password: dbOption.dbPasswd,
      database: dbOption.dbName,
      synchronize: true,
      logging: false,
      entities: [
        TransactionEntity,
        TokenEntity,
        InscriptionEntity,
        TokenBalanceEntity,
        GlobalStateEntity,
      ],
      migrations: [],
      subscribers: [],
    });
  }
  await connection.initialize();
  return connection;
}
