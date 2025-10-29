import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { supabase } from "../../supabaseClient";


const RevenueAnalysis = ({ onBackToDashboard }) => {
  const [revenueOrders, setRevenueOrders] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch orders for revenue analysis
  useEffect(() => {
    const fetchRevenueOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("created_at, order_summary, payment, delivery");

        if (error) {
          console.error("Error fetching orders for revenue analysis:", error);
        } else {
          setRevenueOrders(data || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueOrders();
  }, []);

  // Calculate dynamic revenue data from orders
  const calculateRevenueData = () => {
    const monthlyRevenue = {};
    const yearlyTotals = {};

    // Initialize data for all years and months
    [2023, 2024, 2025].forEach(year => {
      monthlyRevenue[year] = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ].map(month => ({ month, revenue: 0 }));
      yearlyTotals[year] = 0;
    });

    // Process orders to calculate revenue - only count orders with payment status "Paid"
    revenueOrders.forEach(order => {
      const isPaid = order.payment?.status === "Paid";

      if (order.created_at && order.order_summary?.grandTotal && isPaid) {
        const orderDate = new Date(order.created_at);
        const year = orderDate.getFullYear();
        const month = orderDate.getMonth(); // 0-11
        const revenue = order.order_summary.grandTotal;

        // Revenue calculation

        if (monthlyRevenue[year] && monthlyRevenue[year][month]) {
          monthlyRevenue[year][month].revenue += revenue;
          yearlyTotals[year] += revenue;
        }
      }
    });

    return { monthlyRevenue, yearlyTotals };
  };

  const { monthlyRevenue: yearlyData, yearlyTotals } = calculateRevenueData();

  // Revenue data calculated

  // Create yearly revenue summary
  const yearlyRevenue = {};
  Object.keys(yearlyTotals).forEach(year => {
    yearlyRevenue[year] = {
      total: yearlyTotals[year],
      growth: "+0%" // You can calculate growth based on previous year if needed
    };
  });

  const years = [2023, 2024, 2025];
  const currentData = yearlyData[selectedYear];
  const currentYearData = yearlyRevenue[selectedYear];

  // Show current year cards only when current year (2025) is selected
  const isCurrentYear = selectedYear === 2025;

  // Calculate current period revenues
  const calculateCurrentPeriods = () => {
    const now = new Date();
    const today = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    console.log("Current date info:", {
      now: now,
      today: today,
      currentMonth: currentMonth,
      currentYear: currentYear
    });


    // Calculate week start (Monday)
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;

    console.log("Total orders to process:", revenueOrders.length);

    revenueOrders.forEach((order, index) => {
      // Only count revenue from orders with payment status "Paid"
      const isPaid = order.payment?.status === "Paid";

      console.log(`Order ${index + 1}:`, {
        id: order.id,
        created_at: order.created_at,
        grandTotal: order.order_summary?.grandTotal,
        paymentStatus: order.payment?.status,
        isPaid: isPaid
      });

      if (order.created_at && order.order_summary?.grandTotal && isPaid) {
        const orderDate = new Date(order.created_at);
        const revenue = order.order_summary.grandTotal;

        console.log(`Paid order ${index + 1} details:`, {
          orderDate: orderDate.toDateString(),
          revenue: revenue,
          year: orderDate.getFullYear(),
          month: orderDate.getMonth(),
          isToday: orderDate.toDateString() === today,
          isThisWeek: orderDate >= weekStart && orderDate <= now,
          isThisMonth: orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
        });

        // Today's revenue
        if (orderDate.toDateString() === today) {
          todayRevenue += revenue;
          console.log(`Added ₹${revenue} to today's revenue. Total now: ₹${todayRevenue}`);
        }

        // This week's revenue
        if (orderDate >= weekStart && orderDate <= now) {
          weekRevenue += revenue;
          console.log(`Added ₹${revenue} to week's revenue. Total now: ₹${weekRevenue}`);
        }

        // This month's revenue
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          monthRevenue += revenue;
          console.log(`Added ₹${revenue} to month's revenue. Total now: ₹${monthRevenue}`);
        }
      }
    });

    console.log("Final totals:", {
      todayRevenue,
      weekRevenue,
      monthRevenue
    });

    return { todayRevenue, weekRevenue, monthRevenue };
  };

  const { todayRevenue, weekRevenue, monthRevenue } = calculateCurrentPeriods();

  // Custom bar colors - purple for data, light gray for empty months
  const getBarColor = (value) => {
    return value > 0 ? "#8B5CF6" : "#F3F4F6";
  };

  // Custom Y-axis formatter
  const formatYAxis = (value) => {
    return `₹${value.toLocaleString()}`;
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label} ${selectedYear}`}</p>
          <p className="text-purple-600">
            <span className="font-medium">Revenue: </span>
            <span className="font-bold">₹{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate dynamic Y-axis domain
  const maxRevenue = currentData.length > 0 ? Math.max(...currentData.map(item => item.revenue)) : 0;
  const yAxisMax = maxRevenue > 0 ? Math.ceil(maxRevenue / 1000) * 1000 : 1000; // Round up to nearest 1000

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setIsDropdownOpen(false);
  };

  return (
    <div className=" lg:mt-6 bg-gray-50 min-h-screen font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mt-4 lg:mt-0">
          Revenue Analysis (Paid Orders Only)
        </h1>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6 mb-8">
        {/* Chart Header with Filter Dropdown */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-purple-600">
            Monthly Revenue ({selectedYear})
          </h2>

          {/* Year Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 transition-colors"
            >
              <span className="text-gray-700 font-medium">{selectedYear}</span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedYear === year
                        ? "bg-purple-50 text-purple-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-64 sm:h-72 md:h-80 lg:h-96 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading revenue data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentData}
                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                barCategoryGap="20%"
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickFormatter={formatYAxis}
                  domain={[0, yAxisMax]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                  minPointSize={2}
                >
                  {currentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.revenue)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Year Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {selectedYear} Total Revenue
            </h3>
            <div className="text-3xl font-bold mb-1">
              ₹{currentYearData.total.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-200 mb-1">Selected Year</div>
            <div className="text-2xl font-bold">{selectedYear}</div>
          </div>
        </div>
      </div>

      {/* Current Period Cards - Only show for current year (2025) */}
      {isCurrentYear && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today's Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-orange-600 mb-2">
                Today's Revenue
              </h3>
              <div className="text-3xl font-bold text-orange-700 mb-1">
                ₹{todayRevenue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                This Week
              </h3>
              <div className="text-3xl font-bold text-green-700 mb-1">
                ₹{weekRevenue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-purple-600 mb-2">
                This Month
              </h3>
              <div className="text-3xl font-bold text-purple-700 mb-1">
                ₹{monthRevenue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default RevenueAnalysis;
