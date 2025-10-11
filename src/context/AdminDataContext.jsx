import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const AdminDataContext = createContext();

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};

export const AdminDataProvider = ({ children }) => {
  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    products: false,
    categories: false,
    coupons: false,
    orders: false
  });

  // Data loaded flags
  const [dataLoaded, setDataLoaded] = useState({
    products: false,
    categories: false,
    coupons: false,
    orders: false
  });

  // Generic loading state handler
  const setLoading = useCallback((dataType, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [dataType]: isLoading
    }));
  }, []);

  // Generic data loaded handler
  const setDataLoadedFlag = useCallback((dataType, isLoaded) => {
    setDataLoaded(prev => ({
      ...prev,
      [dataType]: isLoaded
    }));
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async (force = false) => {
    if (!force && dataLoaded.products) return products;

    setLoading('products', true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
      setDataLoadedFlag('products', true);
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      return [];
    } finally {
      setLoading('products', false);
    }
  }, [dataLoaded.products, products, setLoading, setDataLoadedFlag]);

  // Fetch Categories
  const fetchCategories = useCallback(async (force = false) => {
    if (!force && dataLoaded.categories) return categories;

    setLoading('categories', true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCategories(data || []);
      setDataLoadedFlag('categories', true);
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
      return [];
    } finally {
      setLoading('categories', false);
    }
  }, [dataLoaded.categories, categories, setLoading, setDataLoadedFlag]);

  // Fetch Coupons
  const fetchCoupons = useCallback(async (force = false) => {
    if (!force && dataLoaded.coupons) return coupons;

    setLoading('coupons', true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCoupons(data || []);
      setDataLoadedFlag('coupons', true);
      return data || [];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
      return [];
    } finally {
      setLoading('coupons', false);
    }
  }, [dataLoaded.coupons, coupons, setLoading, setDataLoadedFlag]);

  // Fetch Orders
  const fetchOrders = useCallback(async (force = false) => {
    if (!force && dataLoaded.orders) return orders;

    setLoading('orders', true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      setDataLoadedFlag('orders', true);
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
      return [];
    } finally {
      setLoading('orders', false);
    }
  }, [dataLoaded.orders, orders, setLoading, setDataLoadedFlag]);

  // Add Product
  const addProduct = useCallback(async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      toast.success('Product added successfully');
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
      throw error;
    }
  }, []);

  // Update Product
  const updateProduct = useCallback(async (id, productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(product =>
        product.id === id ? data : product
      ));
      toast.success('Product updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  }, []);

  // Delete Product
  const deleteProduct = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== id));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    }
  }, []);

  // Add Category
  const addCategory = useCallback(async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [data, ...prev]);
      toast.success('Category added successfully');
      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
      throw error;
    }
  }, []);

  // Update Category
  const updateCategory = useCallback(async (id, categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(category =>
        category.id === id ? data : category
      ));
      toast.success('Category updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
      throw error;
    }
  }, []);

  // Delete Category
  const deleteCategory = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(category => category.id !== id));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
      throw error;
    }
  }, []);

  // Add Coupon
  const addCoupon = useCallback(async (couponData) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([couponData])
        .select()
        .single();

      if (error) throw error;

      setCoupons(prev => [data, ...prev]);
      toast.success('Coupon added successfully');
      return data;
    } catch (error) {
      console.error('Error adding coupon:', error);
      toast.error('Failed to add coupon');
      throw error;
    }
  }, []);

  // Update Coupon
  const updateCoupon = useCallback(async (id, couponData) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCoupons(prev => prev.map(coupon =>
        coupon.id === id ? data : coupon
      ));
      toast.success('Coupon updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error('Failed to update coupon');
      throw error;
    }
  }, []);

  // Delete Coupon
  const deleteCoupon = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCoupons(prev => prev.filter(coupon => coupon.id !== id));
      toast.success('Coupon deleted successfully');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
      throw error;
    }
  }, []);

  // Update Order Status
  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .single();

      if (error) throw error;

      setOrders(prev => prev.map(order =>
        order.id === id ? data : order
      ));
      toast.success('Order status updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      throw error;
    }
  }, []);

  // Clear specific data (useful for logout or refresh)
  const clearData = useCallback((dataType) => {
    if (dataType === 'products') {
      setProducts([]);
      setDataLoadedFlag('products', false);
    } else if (dataType === 'categories') {
      setCategories([]);
      setDataLoadedFlag('categories', false);
    } else if (dataType === 'coupons') {
      setCoupons([]);
      setDataLoadedFlag('coupons', false);
    } else if (dataType === 'orders') {
      setOrders([]);
      setDataLoadedFlag('orders', false);
    } else if (dataType === 'all') {
      setProducts([]);
      setCategories([]);
      setCoupons([]);
      setOrders([]);
      setDataLoaded({
        products: false,
        categories: false,
        coupons: false,
        orders: false
      });
    }
  }, [setDataLoadedFlag]);

  const value = {
    // Data
    products,
    categories,
    coupons,
    orders,

    // Loading states
    loadingStates,
    dataLoaded,

    // Fetch functions
    fetchProducts,
    fetchCategories,
    fetchCoupons,
    fetchOrders,

    // CRUD operations
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    updateOrderStatus,

    // Utility functions
    clearData
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

export default AdminDataContext;