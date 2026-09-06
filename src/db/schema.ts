export const SQLITE_SCHEMA = `
    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
        product_id TEXT PRIMARY KEY,
        quantity INTEGER NOT NULL
            CHECK (quantity >= 0),
        FOREIGN KEY (product_id)
            REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL
            CHECK (quantity > 0),
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
            DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id)
            REFERENCES customers(id),
        FOREIGN KEY (product_id)
            REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
            DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL
            DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
            DEFAULT (datetime('now')),
        FOREIGN KEY (session_id)
            REFERENCES chat_sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_session
        ON chat_messages(session_id, created_at);
`;

export const POSTGRES_SCHEMA = `
    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
        product_id TEXT PRIMARY KEY,
        quantity INTEGER NOT NULL
            CHECK (quantity >= 0),
        FOREIGN KEY (product_id)
            REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL
            CHECK (quantity > 0),
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),
        FOREIGN KEY (customer_id)
            REFERENCES customers(id),
        FOREIGN KEY (product_id)
            REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL
            REFERENCES chat_sessions(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_session
        ON chat_messages(session_id, created_at);
`;
