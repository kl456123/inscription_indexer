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

const connectionPools: Record<string, Connection> = {};

export async function getDBConnectionAsync(
  dbOption: DBOption,
): Promise<Connection> {
  if (connectionPools[dbOption.dbName] == null) {
    connectionPools[dbOption.dbName] = new DataSource({
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
  const connection = connectionPools[dbOption.dbName];
  if (!connection.isInitialized) {
    await connection.initialize();
  }
  return connection;
}
