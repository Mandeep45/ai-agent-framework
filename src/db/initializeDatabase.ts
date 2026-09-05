import {
    config,
} from "../config";
import {
    DatabaseProvider,
} from "./DatabaseProvider";
import {
    createPostgresProvider,
} from "./postgresDatabaseProvider";
import {
    createSqliteProvider,
} from "./sqliteDatabaseProvider";


let databaseProvider:
    DatabaseProvider | null = null;


export async function ensureDatabase():
    Promise<DatabaseProvider> {

    if (databaseProvider) {
        return databaseProvider;
    }

    if (config.database.url) {

        databaseProvider =
            await createPostgresProvider(
                config.database.url
            );

        return databaseProvider;
    }

    databaseProvider =
        createSqliteProvider();

    return databaseProvider;
}


export async function closeDatabase():
    Promise<void> {

    if (!databaseProvider) {
        return;
    }

    await databaseProvider.close();
    databaseProvider = null;
}
