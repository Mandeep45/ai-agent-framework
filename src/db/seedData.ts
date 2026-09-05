export const SEED_CUSTOMERS = [
    {
        id: "ABC",
        name: "John Doe",
        email: "john@example.com",
    },
    {
        id: "DEF",
        name: "Jane Doe",
        email: "jane@example.com",
    },
] as const;

export const SEED_PRODUCTS = [
    {
        id: "XYZ",
        name: "Widget XYZ",
    },
    {
        id: "ABC",
        name: "Legacy Part ABC",
    },
] as const;

export const SEED_INVENTORY = [
    {
        productId: "XYZ",
        quantity: 25,
    },
    {
        productId: "ABC",
        quantity: 0,
    },
] as const;
