import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { adHeaderSectionDetailsContent } from "./constants/adHeaderContent";
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders");
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to fetch orders");
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
      fetchOrders();
      setOrdersFetched(true);
    }
  }, []);

  return (
    <div className="">
      {!hideLayout && <AdHeader shippingData={adHeaderSectionDetailsContent} />}
      {!hideLayout && <NavHeader />}

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
