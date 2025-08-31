import React, { createContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";

// 1. Create Context
export const AppContext = createContext();

// 2. Create Provider Component
export const AppProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState([]);

  const [categoriesFetched, setCategoriesFetched] = useState(false);
  const [productsFetched, setProductsFetched] = useState(false);
  const [ordersFetched, setOrdersFetched] = useState(false);

  return (
    <AppContext.Provider
      value={{
        categories,
        setCategories,
        categoriesFetched,
        setCategoriesFetched,
        products,
        setProducts,
        productsFetched,
        setProductsFetched,
        orders,
        setOrders,
        ordersFetched,
        setOrdersFetched,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
