import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Loader from "./containers/Admin/Loader";

import LoginPage from "./containers/Admin/LoginPage";
import AdminDashboard from "./containers/Admin/AdminDashboard";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "./context/AppContext";
import { toast } from "sonner";
// import OrderTracking from "./containers/Admin/TrackOrder"; // if you need later

// --- Route Guards ---
function AdminRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loader message="Checking authentication..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LoginRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loader message="Checking authentication..." />;
  if (user) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const {
    categoriesFetched,
    setCategoriesFetched,
    productsFetched,
    setProductsFetched,
    ordersFetched,
    setOrdersFetched,
    setCategories,
    setProducts,
    setOrders,
    setLoading,
  } = useContext(AppContext);

  // Hide header/footer on admin and login pages
  const hideLayout =
    location.pathname.startsWith("/admin") || location.pathname === "/login";

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) {
        console.error(error);
        toast.error("Failed to fetch categories");
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching categories");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(main_category_name)");
    if (error) console.error(error);
    else setProducts(data);
  }

  // Fetch dashboard stats (count and revenue) without loading all orders
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Get total count of orders
      const { count, error: countError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      // Get orders with payment and delivery info for revenue calculation (minimal data)
      const { data, error } = await supabase
        .from("orders")
        .select("order_summary, payment, delivery");

      if (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Failed to fetch dashboard statistics");
      } else {
        // Calculate total revenue from orders with delivery status "Shipped" or "Delivered"
        const totalRevenue = (data || []).reduce((sum, order) => {
          const isShippedOrDelivered =
            order.delivery?.status === "Shipped" ||
            order.delivery?.status === "Delivered";

          if (isShippedOrDelivered) {
            return sum + (order.order_summary?.grandTotal || 0);
          }
          return sum;
        }, 0);

        // Count orders that contribute to revenue (Shipped/Delivered)
        const revenueOrdersCount = (data || []).filter(order => {
          const isShippedOrDelivered =
            order.delivery?.status === "Shipped" ||
            order.delivery?.status === "Delivered";
          return isShippedOrDelivered;
        }).length;

        // Set minimal dashboard data (not full orders array)
        setOrders({
          count: count || 0,
          totalRevenue: totalRevenue || 0,
          revenueOrdersCount: revenueOrdersCount || 0
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!categoriesFetched) {
      fetchCategories();
      setCategoriesFetched(true);
    }

    if (!productsFetched) {
      fetchProducts();
      setProductsFetched(true);
    }

    if (!ordersFetched) {
      fetchDashboardStats();
      setOrdersFetched(true);
    }
  }, []);

  return (
    <div className="">
      <Routes>
        {/* <Route path="/track" element={<OrderTracking />} /> */}

        <Route
          path="/login"
          element={
            <LoginRoute>
              <LoginPage />
            </LoginRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
