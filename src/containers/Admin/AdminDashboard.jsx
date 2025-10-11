import React, { useContext, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  ShoppingCart,
  Settings,
  Ticket,
  Menu,
  X,
} from "lucide-react";
import RevenueAnalysis from "./RevenueAnalysis";
import AdminCategoriesConsistent from "./AdminCategoriesConsistent";
import AdminProductsSimple from "./AdminProductsSimple";
import AdminCoupons from "./AdminCoupons";
import AdminOrders from "./AdminOrders";
import LogoutButton from "./Logout";
import { AppContext } from "../../context/AppContext";
import cpLogo from "../../assets/CP-Logo.png";

// Sidebar Component
const Sidebar = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "categories", label: "Categories", icon: FolderOpen },
    { id: "products", label: "Products", icon: Package },
    { id: "coupons", label: "Coupons", icon: Ticket },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <img
                src={cpLogo}
                alt="Cremson Publications"
                className="h-10 w-auto"
              />
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

// Dashboard Content Component
const DashboardContent = () => {
  const { categories, products, orders } = useContext(AppContext);

  // Calculate total revenue from all orders
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.order_summary?.grandTotal || 0);
  }, 0);

  const stats = [
    {
      title: "Total Categories",
      value: categories.length,
      icon: "📁",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "Total Products",
      value: products.length,
      icon: "📦",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: "🛒",
      bgColor: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toFixed(2)}`,
      icon: "💰",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100",
      textColor: "text-red-600",
    },
  ];

  return (
    <div className=" lg:p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mt-[20px] lg:mt-0 mb-8">
        Dashboard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10)",
            }}
            className={`${stat.bgColor} rounded-xl p-6 border border-[#F3E8FF]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.iconBg} p-3 rounded-lg`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <RevenueAnalysis />
    </div>
  );
};

// Generic Content Components
const CategoriesContent = () => (
  <div className="lg:p-8 ">
    <AdminCategoriesConsistent />
  </div>
);

const ProductsContent = () => (
  <div className="lg:p-8 ">
    <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">
      Products
    </h2>

    <div className=" rounded-lg  ">
      <p className="text-gray-600">
        <AdminProductsSimple />
      </p>
    </div>
  </div>
);

const CouponsContent = () => (
  <div className="lg:p-8 ">
    <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">
      Coupons
    </h2>

    <div className=" rounded-lg  ">
      <p className="text-gray-600">
        <AdminCoupons />
      </p>
    </div>
  </div>
);

const OrdersContent = () => (
  <div className="lg:p-8 ">
    <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">
      Orders
    </h2>
    <div className="rounded-lg ">
      <p className="text-gray-600">
        <AdminOrders />
      </p>
    </div>
  </div>
);

const SettingsContent = () => (
  <div className="lg:p-8 ">
    <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">
      Settings
    </h2>
    <div className="rounded-lg ">
      <p className="text-gray-600">
        <LogoutButton />
      </p>
    </div>
  </div>
);

// Main App Component
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent />;
      case "categories":
        return <CategoriesContent />;
      case "products":
        return <ProductsContent />;
      case "coupons":
        return <CouponsContent />;
      case "orders":
        return <OrdersContent />;
      case "settings":
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          {/* Mobile Header */}
          {/* Mobile Header */}
          {!isMobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Menu size={24} />
                </button>
                <img
                  src={cpLogo}
                  alt="Cremson Publications"
                  className="h-8 w-auto"
                />
                <div className="w-6" /> {/* Spacer */}
              </div>
            </div>
          )}

          {/* Content Area */}
          <main className="flex-1 overflow-auto px-4 lg:px-0">
            {renderContent()}

            {/* Footer */}
            <footer className="mt-8 pt-6 pb-4 border-t border-gray-200 text-center text-sm text-gray-500">
              <p className="mb-2">
                Design and developed by{" "}
                <a
                  href="https://www.oratechsolution.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
                >
                  Oratech Solution
                </a>
              </p>
              <p>&copy; {new Date().getFullYear()} Cremson Publications. All rights reserved.</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
