import "dotenv/config";

import {
    ensureDatabase,
    closeDatabase,
} from "../src/db/initializeDatabase";
import {
    resetSqliteData,
} from "../src/db/sqliteDatabaseProvider";
import {
    resetPostgresData,
} from "../src/db/postgresDatabaseProvider";
import {
    config,
} from "../src/config";


async function main() {

    if (config.database.url) {

        console.log(
            "Resetting PostgreSQL database..."
        );

        await resetPostgresData(
            config.database.url
        );

        console.log(
            "PostgreSQL reset complete. Fresh seed data loaded."
        );

        return;
    }

    resetSqliteData();

    await ensureDatabase();
    await closeDatabase();

    console.log(
        "SQLite reset complete. Fresh seed data loaded."
    );
}


main().catch(error => {
    console.error(error);
    process.exit(1);
});
