import {
    ConsoleLogger,
} from "../../../../src/logger/ConsoleLogger";

import {
    ensureDatabase,
} from "../../../../src/db/initializeDatabase";

import {
    createDomainServices,
    type DomainServices,
} from "../../../../src/db/createDomainServices";


let domainServices:
    DomainServices | null = null;

export async function getDomainServices():
    Promise<DomainServices> {

    if (domainServices) {
        return domainServices;
    }

    const databaseProvider =
        await ensureDatabase();

    domainServices =
        createDomainServices(
            new ConsoleLogger(),
            databaseProvider
        );

    return domainServices;
}

export async function getChatRepository() {

    const databaseProvider =
        await ensureDatabase();

    return databaseProvider.repositories
        .chatRepository;
}
