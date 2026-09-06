import {
    useEffect,
    useState,
} from "react";

import {
    fetchOrders,
    type OrderWithDetails,
} from "../api/orders";

interface OrderHistoryPageProps {
    onRefreshOrders?: () => void;
}

export function OrderHistoryPage({
    onRefreshOrders,
}: OrderHistoryPageProps) {

    const [orders, setOrders] =
        useState<OrderWithDetails[]>([]);

    const [customerFilter, setCustomerFilter] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    async function loadOrders() {

        setIsLoading(true);
        setError(null);

        try {

            const filter =
                customerFilter.trim();

            const result =
                await fetchOrders(
                    filter || undefined
                );

            setOrders(result);

            onRefreshOrders?.();

        } catch (loadError) {

            const message =
                loadError instanceof Error
                    ? loadError.message
                    : "Failed to load orders.";

            setError(message);

        } finally {

            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadOrders();
    }, []);

    return (
        <div className="orders-layout">
            <header className="orders-header">
                <div>
                    <h1>Order history</h1>
                    <p>
                        Browse confirmed and
                        cancelled orders from
                        the database.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                        void loadOrders()
                    }
                    disabled={isLoading}
                >
                    {isLoading
                        ? "Loading..."
                        : "Refresh"}
                </button>
            </header>

            <div className="orders-filters">
                <input
                    type="text"
                    value={customerFilter}
                    onChange={event =>
                        setCustomerFilter(
                            event.target.value
                        )
                    }
                    placeholder="Filter by customer ID (e.g. ABC)"
                />

                <button
                    type="button"
                    className="btn btn-send"
                    onClick={() =>
                        void loadOrders()
                    }
                    disabled={isLoading}
                >
                    Apply filter
                </button>
            </div>

            {error && (
                <div className="orders-error">
                    {error}
                </div>
            )}

            {isLoading && orders.length === 0 && (
                <p className="orders-empty">
                    Loading orders...
                </p>
            )}

            {!isLoading &&
                orders.length === 0 &&
                !error && (
                    <p className="orders-empty">
                        No orders found.
                        Place one in the chat
                        assistant.
                    </p>
                )}

            {orders.length > 0 && (
                <div className="orders-table-wrap">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(
                                order => (
                                    <tr
                                        key={
                                            order.id
                                        }
                                    >
                                        <td>
                                            {
                                                order.id
                                            }
                                        </td>
                                        <td>
                                            {
                                                order.customerName
                                            }
                                            <span className="orders-meta">
                                                (
                                                {
                                                    order.customerId
                                                }
                                                )
                                            </span>
                                        </td>
                                        <td>
                                            {
                                                order.productName
                                            }
                                            <span className="orders-meta">
                                                (
                                                {
                                                    order.productId
                                                }
                                                )
                                            </span>
                                        </td>
                                        <td>
                                            {
                                                order.quantity
                                            }
                                        </td>
                                        <td>
                                            <span
                                                className={`status-badge status-${order.status}`}
                                            >
                                                {
                                                    order.status
                                                }
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleString()}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
