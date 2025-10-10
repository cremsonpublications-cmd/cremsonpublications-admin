import React, { useContext, useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "sonner";

import {
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Eye,
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Truck,
  Calendar,
  IndianRupee,
  ShoppingBag,
  Save,
} from "lucide-react";
import Loader from "./Loader";
import { supabase } from "../../supabaseClient";
import { AppContext } from "../../context/AppContext";

const AdminOrders = () => {
  const { orders, setOrders, ordersFetched, setOrdersFetched } =
    useContext(AppContext);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState("");

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders");
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [setOrders]);

  useEffect(() => {
    if (!ordersFetched) {
      fetchOrders();
      setOrdersFetched(true); // mark as fetched to avoid repeated calls
    }
  }, [ordersFetched, setOrdersFetched, fetchOrders]);

  const getStatusColor = (status) => {
    const colors = {
      Processing: "bg-yellow-100 text-yellow-800",
      Shipped: "bg-blue-100 text-blue-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
      Pending: "bg-gray-100 text-gray-800",
      Paid: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setEditForm({
      // Items (quantities only)
      items:
        order.items?.map((item) => ({
          ...item,
          quantity: item.quantity,
        })) || [],

      // Order summary (delivery charge and discount)
      order_summary: {
        deliveryCharge: order.order_summary?.deliveryCharge || 0,
        discountTotal: order.order_summary?.discountTotal || 0,
      },

      // Payment details - Enhanced
      payment: {
        method: order.payment?.method || "UPI",
        status: order.payment?.status || "Pending",
        transactionId: order.payment?.transactionId || "",
      },

      // Delivery details
      delivery: {
        status: order.delivery?.status || "Processing",
        trackingId: order.delivery?.trackingId || "",
        expectedDate: order.delivery?.expectedDate || "",
        courier: order.delivery?.courier || "",
        trackingUrl: order.delivery?.trackingUrl || "",
      },

      // Address (modifiable)
      user_info: {
        address: {
          street: order.user_info?.address?.street || "",
          city: order.user_info?.address?.city || "",
          state: order.user_info?.address?.state || "",
          pincode: order.user_info?.address?.pincode || "",
        },
      },
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate new subtotal and grand total
      const subTotal = editForm.items.reduce((sum, item) => {
        return sum + item.currentPrice * item.quantity;
      }, 0);

      const grandTotal =
        subTotal +
        editForm.order_summary.deliveryCharge -
        editForm.order_summary.discountTotal;

      const updatePayload = {
        items: editForm.items.map((item) => ({
          ...item,
          totalPrice: item.currentPrice * item.quantity,
        })),
        order_summary: {
          ...editingOrder.order_summary,
          subTotal,
          grandTotal,
          deliveryCharge: editForm.order_summary.deliveryCharge,
          discountTotal: editForm.order_summary.discountTotal,
        },
        payment: {
          method: editForm.payment.method,
          status: editForm.payment.status,
          transactionId: editForm.payment.transactionId,
        },
        delivery: {
          ...editingOrder.delivery,
          status: editForm.delivery.status,
          trackingId: editForm.delivery.trackingId,
          expectedDate: editForm.delivery.expectedDate,
          courier: editForm.delivery.courier,
          trackingUrl: editForm.delivery.trackingUrl,
        },
        user_info: {
          ...editingOrder.user_info,
          address: editForm.user_info.address,
        },
        last_updated: new Date().toISOString(),
      };

      // Update the order in Supabase
      const { error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", editingOrder.id);

      if (error) {
        console.error("Error updating order:", error);
        toast.error("Failed to update order");
      } else {
        toast.success("Order updated successfully!");
        setEditingOrder(null);
        setEditForm({});
        fetchOrders(); // Refresh the orders list
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const openDeleteModal = (id, orderId) => {
    setDeletingId(id);
    setDeletingOrderId(orderId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", deletingId);

      if (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order");
      } else {
        toast.successe("Order deleted successfully!");
        fetchOrders();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete order");
    }

    setDeleteModalOpen(false);
    setDeletingId(null);
    setDeletingOrderId("");
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Order Details View
  if (showDetails && selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setShowDetails(false)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Orders</span>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Order Details
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">ORDER ID</p>
                  <p className="font-semibold text-sm md:text-base truncate">
                    {selectedOrder.order_id}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">CUSTOMER</p>
                  <p className="font-semibold text-sm md:text-base truncate">
                    {selectedOrder.user_info?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">DATE</p>
                  <p className="font-semibold text-sm md:text-base">
                    {selectedOrder.order_date}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <IndianRupee className="w-6 h-6 md:w-8 md:h-8 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">TOTAL</p>
                  <p className="font-semibold text-sm md:text-base">
                    ₹{selectedOrder.order_summary?.grandTotal}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Items
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm md:text-base">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-sm md:text-base">
                          ₹{item.totalPrice}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₹{item.currentPrice} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">
                        {selectedOrder.user_info?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        User ID: {selectedOrder.user_info?.userId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <p className="text-sm md:text-base break-all">
                      {selectedOrder.user_info?.email}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <p className="text-sm md:text-base">
                      {selectedOrder.user_info?.phone}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm md:text-base">
                        {selectedOrder.user_info?.address?.street}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.user_info?.address?.city},{" "}
                        {selectedOrder.user_info?.address?.state} -{" "}
                        {selectedOrder.user_info?.address?.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">Subtotal</span>
                    <span className="text-sm md:text-base">
                      ₹{selectedOrder.order_summary?.subTotal}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">
                      Delivery Charge
                    </span>
                    <span className="text-sm md:text-base">
                      ₹{selectedOrder.order_summary?.deliveryCharge}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">Discount</span>
                    <span className="text-sm md:text-base">
                      -₹{selectedOrder.order_summary?.discountTotal}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold text-base md:text-lg">
                    <span>Total</span>
                    <span>₹{selectedOrder.order_summary?.grandTotal}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">Method</span>
                    <span className="font-medium text-sm md:text-base">
                      {selectedOrder.payment?.method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedOrder.payment?.status
                      )}`}
                    >
                      {selectedOrder.payment?.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">Transaction ID</span>
                    <span className="font-mono text-xs md:text-sm break-all">
                      {selectedOrder.payment?.transactionId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedOrder.delivery?.status
                      )}`}
                    >
                      {selectedOrder.delivery?.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base">Expected Date</span>
                    <span className="text-sm md:text-base">
                      {selectedOrder.delivery?.expectedDate}
                    </span>
                  </div>
                  {selectedOrder.delivery?.trackingId && (
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base">Tracking ID</span>
                      <span className="font-mono text-xs md:text-sm break-all">
                        {selectedOrder.delivery?.trackingId}
                      </span>
                    </div>
                  )}
                  {selectedOrder.delivery?.courier && (
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base">Courier</span>
                      <span className="text-sm md:text-base">
                        {selectedOrder.delivery?.courier}
                      </span>
                    </div>
                  )}
                  {selectedOrder.delivery?.trackingUrl && (
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base">Track Package</span>
                      <a 
                        href={selectedOrder.delivery?.trackingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm md:text-base underline"
                      >
                        Track Now
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="  ">
      <div className="max-w-7xl mx-auto">
        {/* Edit Form */}
        {editingOrder && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 md:p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Edit Order #{editingOrder.order_id}
              </h2>
              <button
                onClick={() => {
                  setEditingOrder(null);
                  setEditForm({});
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6 md:space-y-8">
              {/* Customer Info (Read-only) */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-500">
                  Customer Information (Read-only)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <p className="text-gray-900 text-sm md:text-base">
                      {editingOrder.user_info?.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 text-sm md:text-base break-all">
                      {editingOrder.user_info?.email}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <p className="text-gray-900 text-sm md:text-base">
                      {editingOrder.user_info?.phone}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <p className="text-gray-900 text-sm md:text-base">
                      {editingOrder.user_info?.userId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address (Editable) */}
              <div className="border-t pt-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">
                  Delivery Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street
                    </label>
                    <input
                      type="text"
                      value={editForm.user_info?.address?.street || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          user_info: {
                            ...editForm.user_info,
                            address: {
                              ...editForm.user_info?.address,
                              street: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={editForm.user_info?.address?.city || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          user_info: {
                            ...editForm.user_info,
                            address: {
                              ...editForm.user_info?.address,
                              city: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={editForm.user_info?.address?.state || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          user_info: {
                            ...editForm.user_info,
                            address: {
                              ...editForm.user_info?.address,
                              state: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={editForm.user_info?.address?.pincode || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          user_info: {
                            ...editForm.user_info,
                            address: {
                              ...editForm.user_info?.address,
                              pincode: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Items (Quantity read-only) */}
              <div className="border-t pt-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">
                  Order Items
                </h3>
                <div className="space-y-4">
                  {editForm.items?.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-3 md:p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="bg-gray-100 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name
                        </label>
                        <p className="text-gray-900 text-sm">{item.name}</p>
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product ID
                        </label>
                        <p className="text-gray-900 text-sm">
                          {item.productId}
                        </p>
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <p className="text-gray-900 text-sm">
                          ₹{item.currentPrice}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        {/* Read-only quantity */}
                        <input
                          type="number"
                          value={item.quantity}
                          readOnly
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 outline-none cursor-not-allowed"
                          min="1"
                        />
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <p className="text-gray-900 text-sm">
                          ₹{(item.currentPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Delivery Status */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">
                      Payment Details
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={editForm.payment?.method || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            payment: {
                              ...editForm.payment,
                              method: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Wallet">Wallet</option>
                        <option value="Cash on Delivery">
                          Cash on Delivery
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Status
                      </label>
                      <select
                        value={editForm.payment?.status || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            payment: {
                              ...editForm.payment,
                              status: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        value={editForm.payment?.transactionId || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            payment: {
                              ...editForm.payment,
                              transactionId: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="Enter transaction ID"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">
                      Delivery Details
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Status
                      </label>
                      <select
                        value={editForm.delivery?.status || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            delivery: {
                              ...editForm.delivery,
                              status: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking ID
                      </label>
                      <input
                        type="text"
                        value={editForm.delivery?.trackingId || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            delivery: {
                              ...editForm.delivery,
                              trackingId: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="Enter tracking ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        value={editForm.delivery?.expectedDate || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            delivery: {
                              ...editForm.delivery,
                              expectedDate: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Courier Partner
                      </label>
                      <select
                        value={editForm.delivery?.courier || ""}
                        onChange={(e) => {
                          const courierUrls = {
                            "DTDC": "https://www.dtdc.com/track-your-shipment/",
                            "Shadowfax": "https://www.shadowfax.in/track",
                            "Delhivery": "https://www.delhivery.com/tracking",
                            "Other": ""
                          };
                          setEditForm({
                            ...editForm,
                            delivery: {
                              ...editForm.delivery,
                              courier: e.target.value,
                              trackingUrl: courierUrls[e.target.value] || "",
                            },
                          })
                        }}
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select Courier</option>
                        <option value="DTDC">DTDC</option>
                        <option value="Shadowfax">Shadowfax</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking URL
                      </label>
                      <input
                        type="url"
                        value={editForm.delivery?.trackingUrl || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            delivery: {
                              ...editForm.delivery,
                              trackingUrl: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="Tracking URL (auto-filled based on courier)"
                        readOnly={editForm.delivery?.courier && editForm.delivery?.courier !== "Other"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">
                  Order Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Charge
                    </label>
                    <input
                      type="number"
                      value={editForm.order_summary?.deliveryCharge || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          order_summary: {
                            ...editForm.order_summary,
                            deliveryCharge: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount
                    </label>
                    {/* Read-only discount */}
                    <input
                      type="number"
                      value={editForm.order_summary?.discountTotal || 0}
                      readOnly
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg bg-gray-100 outline-none cursor-not-allowed"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <div className="space-y-2">
                      {/* Subtotal, Delivery, Discount, Total remain unchanged */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOrder(null);
                    setEditForm({});
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 md:pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-80"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && <Loader />}

          {/* Mobile Cards View */}
          <div className="block md:hidden">
            {!loading &&
              filteredOrders.map((order) => (
                <div key={order.id} className="border-b border-gray-200 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          #{order.order_id}
                        </p>
                        <p className="text-xs text-gray-600">
                          {order.order_date}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{order.order_summary?.grandTotal}
                      </span>
                    </div>

                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {order.user_info?.name}
                      </p>
                      <p className="text-xs text-gray-600 break-all">
                        {order.user_info?.email}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.delivery?.status
                          )}`}
                        >
                          {order.delivery?.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.payment?.status
                          )}`}
                        >
                          {order.payment?.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleView(order)}
                          className="p-2 rounded-md text-purple-600 hover:bg-purple-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Order"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            openDeleteModal(order.id, order.order_id)
                          }
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 transition"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop Table View */}
          {!loading && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 uppercase tracking-wider text-xs">
                      ORDER ID
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 uppercase tracking-wider text-xs">
                      CUSTOMER
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 uppercase tracking-wider text-xs">
                      DATE
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 uppercase tracking-wider text-xs">
                      DELIVERY STATUS
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 uppercase tracking-wider text-xs">
                      PAYMENT STATUS
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 uppercase tracking-wider text-xs">
                      TOTAL
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 uppercase tracking-wider text-xs">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900 text-sm">
                          #{order.order_id}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {order.user_info?.name}
                          </div>
                          <div className="text-xs text-gray-600 break-all">
                            {order.user_info?.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900 text-sm">
                          {order.order_date}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.delivery?.status
                          )}`}
                        >
                          {order.delivery?.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.payment?.status
                          )}`}
                        >
                          {order.payment?.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 text-sm">
                          ₹{order.order_summary?.grandTotal}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(order)}
                            className="p-2 rounded-md text-purple-600 hover:bg-purple-50 transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(order)}
                            className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Order"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              openDeleteModal(order.id, order.order_id)
                            }
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <div className="text-gray-400 mb-4">
                <Package className="w-8 h-8 md:w-12 md:h-12 mx-auto" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "No orders available in the system"}
              </p>
            </div>
          )}
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl w-96 relative">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Order
              </h3>
              <p className="text-gray-600">
                Do you want to delete <b>#{deletingOrderId}</b>? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3 w-full mt-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
