import {
    buildAuthHeaders,
    fetchWithColdStart,
    getApiBase,
} from "./http";

export interface OrderWithDetails {
    id: string;
    customerId: string;
    customerName: string;
    productId: string;
    productName: string;
    quantity: number;
    status: "confirmed" | "cancelled";
    createdAt: string;
}

export async function fetchOrders(
    customerId?: string
): Promise<OrderWithDetails[]> {

    const params =
        new URLSearchParams();

    if (customerId) {
        params.set(
            "customerId",
            customerId
        );
    }

    const query =
        params.toString();

    const url =
        `${getApiBase()}/orders` +
        (query ? `?${query}` : "");

    const response =
        await fetchWithColdStart(
            url,
            {
                headers:
                    buildAuthHeaders(),
            }
        );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ??
                "Failed to load orders."
        );
    }

    return data.orders as OrderWithDetails[];
}
