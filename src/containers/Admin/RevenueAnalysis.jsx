import React, { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Sample data for different years
const yearlyData = {
  2023: [
    { month: "Jan", revenue: 1000 },
    { month: "Feb", revenue: 1200 },
    { month: "Mar", revenue: 1100 },
    { month: "Apr", revenue: 1300 },
    { month: "May", revenue: 1400 },
    { month: "Jun", revenue: 1600 },
    { month: "Jul", revenue: 1800 },
    { month: "Aug", revenue: 1700 },
    { month: "Sep", revenue: 1900 },
    { month: "Oct", revenue: 2000 },
    { month: "Nov", revenue: 2100 },
    { month: "Dec", revenue: 2200 },
  ],
  2024: [
    { month: "Jan", revenue: 1200 },
    { month: "Feb", revenue: 1400 },
    { month: "Mar", revenue: 1300 },
    { month: "Apr", revenue: 1500 },
    { month: "May", revenue: 1700 },
    { month: "Jun", revenue: 1900 },
    { month: "Jul", revenue: 2100 },
    { month: "Aug", revenue: 2000 },
    { month: "Sep", revenue: 2200 },
    { month: "Oct", revenue: 2300 },
    { month: "Nov", revenue: 2400 },
    { month: "Dec", revenue: 2500 },
  ],
  2025: [
    { month: "Jan", revenue: 1250 },
    { month: "Feb", revenue: 1500 },
    { month: "Mar", revenue: 1600 },
    { month: "Apr", revenue: 1850 },
    { month: "May", revenue: 2100 },
    { month: "Jun", revenue: 2400 },
    { month: "Jul", revenue: 0 },
    { month: "Aug", revenue: 0 },
    { month: "Sep", revenue: 0 },
    { month: "Oct", revenue: 0 },
    { month: "Nov", revenue: 0 },
    { month: "Dec", revenue: 0 },
  ],
};

// Yearly revenue data for year cards
const yearlyRevenue = {
  2023: { total: 18300, growth: "+15%" },
  2024: { total: 22000, growth: "+20%" },
  2025: { total: 10700, growth: "+35%" }, // Current year (partial)
};

const RevenueAnalysis = ({ onBackToDashboard }) => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const years = [2023, 2024, 2025];
  const currentData = yearlyData[selectedYear];
  const currentYearData = yearlyRevenue[selectedYear];

  // Show current year cards only when current year (2025) is selected
  const isCurrentYear = selectedYear === 2025;

  // Custom bar colors - purple for data, light gray for empty months
  const getBarColor = (value) => {
    return value > 0 ? "#8B5CF6" : "#E5E7EB";
  };

  // Custom Y-axis formatter
  const formatYAxis = (value) => {
    return `$${value.toLocaleString()}`;
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setIsDropdownOpen(false);
  };

  return (
    <div className=" lg:mt-6 bg-gray-50 min-h-screen font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mt-4 lg:mt-0">
          Revenue Analysis
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

        <div className="h-64 sm:h-72 md:h-80 lg:h-96">
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
                domain={[0, 2500]}
                ticks={[0, 500, 1000, 1500, 2000, 2500]}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={30}>
                {currentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.revenue)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
              ${currentYearData.total.toLocaleString()}
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
                $245.89
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
                $1,245.89
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
                $5,245.89
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Order Value */}

        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Total Transactions ({selectedYear})
          </h3>
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {selectedYear === 2023
              ? "1,247"
              : selectedYear === 2024
              ? "1,523"
              : "847"}
          </div>
        </div>
      </div>

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
