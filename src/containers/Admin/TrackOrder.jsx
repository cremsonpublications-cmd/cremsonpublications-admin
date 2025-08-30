// src/OrderTracking.jsx
import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  async function handleCheckStatus(e) {
    e.preventDefault();
    setError("");
    setOrder(null);

    if (!orderId) return setError("Please enter an Order ID.");

    // Fetch order using maybeSingle() to avoid PGRST116 error
    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (fetchError) {
      console.error(fetchError);
      setError("Error fetching order. Please try again.");
      return;
    }

    if (!data) {
      setError("Order not found. Please check the Order ID.");
      return;
    }

    setOrder(data);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Track Your Order</h1>

      <form onSubmit={handleCheckStatus} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter your Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Track
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {order && (
        <div className="border p-4 rounded bg-white shadow">
          <h2 className="text-xl font-semibold mb-2">
            Order ID: {order.order_id}
          </h2>
          <p className="mb-2">
            <strong>Status:</strong> {order.delivery?.status || "N/A"}
          </p>
          <p className="mb-2">
            <strong>Expected Delivery:</strong>{" "}
            {order.delivery?.expectedDate || "N/A"}
          </p>
          <p className="mb-2">
            <strong>Payment Status:</strong> {order.payment?.status || "N/A"}
          </p>

          <h3 className="font-semibold mt-4 mb-2">Items:</h3>
          <ul className="space-y-2">
            {order.items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <img
                  src={item.image || ""}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p>
                    Qty: {item.quantity} | Price: ₹{item.currentPrice} | Total:
                    ₹{item.totalPrice}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 font-semibold">
            Grand Total: ₹{order.order_summary?.grandTotal || 0}
          </p>
        </div>
      )}
    </div>
  );
}
