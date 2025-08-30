import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { adHeaderSectionDetailsContent } from "./constants/adHeaderContent";
import { supabase } from "./supabaseClient";
import Loader from "./containers/Admin/Loader";
import AdHeader from "./components/AdHeader/AdHeader";
import NavHeader from "./components/NavHeader/NavHeader";
import Home from "./containers/Home/Home";
import UserShop from "./containers/Admin/UserShop";
import LoginPage from "./containers/Admin/LoginPage";
import AdminDashboard from "./containers/Admin/AdminDashboard";
import Footer from "./components/Footer/Footer";
import { useEffect, useState } from "react";
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

  // Hide header/footer on admin and login pages
  const hideLayout =
    location.pathname.startsWith("/admin") || location.pathname === "/login";

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) {
        console.error(error);
      } else {
        console.log(data, "zzzzzzz");
      }
    };

    fetchCategories();
  }, []);
  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error(error);
      } else {
        console.log(data, "xxxxxx");
      }
    };

    fetchProduct();
  }, []);

  return (
    <div className="">
      {!hideLayout && <AdHeader shippingData={adHeaderSectionDetailsContent} />}
      {!hideLayout && <NavHeader />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<UserShop />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideLayout && <Footer />}
    </div>
  );
}
