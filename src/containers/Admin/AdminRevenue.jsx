import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../supabaseClient";

export default function AdminRevenue() {
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState({
    pending: 0,
    completed: 0,
    failed: 0,
  });
  const [filter, setFilter] = useState("month"); // "day" | "month" | "year"

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("order_summary, delivery, payment, order_date");
    setOrders(data || []);
    calculateRevenue(data || []);
  }

  function calculateRevenue(data) {
    let pending = 0,
      completed = 0,
      failed = 0;
    data.forEach((o) => {
      const amt = o.order_summary?.grandTotal || 0;
      const paymentStatus = o.payment?.status;

      // Only count revenue for orders with "Paid" payment status
      if (paymentStatus === "Paid") {
        if (o.delivery?.status === "Completed") completed += amt;
        else if (o.delivery?.status === "Failed") failed += amt;
        else pending += amt;
      }
      // Orders with non-Paid status don't contribute to revenue
    });
    setRevenue({ pending, completed, failed });
  }

  // Group orders based on filter
  function getChartData() {
    const groups = {};
    orders.forEach((o) => {
      const paymentStatus = o.payment?.status;

      // Only include orders with "Paid" payment status in charts
      if (paymentStatus === "Paid") {
        const date = new Date(o.order_date);
        let key = "";
        if (filter === "day") key = date.toISOString().split("T")[0];
        else if (filter === "month")
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        else if (filter === "year") key = `${date.getFullYear()}`;

        if (!groups[key])
          groups[key] = { period: key, pending: 0, completed: 0, failed: 0 };
        const amt = o.order_summary?.grandTotal || 0;
        if (o.delivery?.status === "Completed") groups[key].completed += amt;
        else if (o.delivery?.status === "Failed") groups[key].failed += amt;
        else groups[key].pending += amt;
      }
    });

    return Object.values(groups).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Revenue Analytics</h2>

      {/* Total Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-yellow-100 rounded">
          Pending: ₹{revenue.pending}
        </div>
        <div className="p-4 bg-green-100 rounded">
          Completed: ₹{revenue.completed}
        </div>
        <div className="p-4 bg-red-100 rounded">Failed: ₹{revenue.failed}</div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <label className="mr-2">Filter by:</label>
        <select
          className="border p-2 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={getChartData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pending" fill="#facc15" />
          <Bar dataKey="completed" fill="#22c55e" />
          <Bar dataKey="failed" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
