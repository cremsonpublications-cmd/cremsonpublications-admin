import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Ticket,
  Calendar,
  DollarSign,
  Percent,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { supabase } from "../../supabaseClient";
import Loader from "./Loader";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage", // 'percentage' or 'fixed'
    discount_value: "",
    minimum_order_amount: "",
    maximum_discount_amount: "", // Only for percentage discounts
    show_in_ui: true, // Whether to show in user interface
    applicable_categories: [],
    // Delivery charge features
    free_delivery: false,
    delivery_discount_amount: "",
    valid_from: "",
    valid_until: "",
    usage_limit: "",
    description: "",
  });

  const [categories, setCategories] = useState([]);

  const [originalData, setOriginalData] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  useEffect(() => {
    fetchCoupons();
    fetchCategories();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select(`
          id,
          code,
          discount_type,
          discount_value,
          minimum_order_amount,
          maximum_discount_amount,
          show_in_ui,
          applicable_categories,
          free_delivery,
          delivery_discount_amount,
          valid_from,
          valid_until,
          usage_limit,
          is_active,
          description,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Add isExpired field to each coupon
      const couponsWithExpiredStatus = (data || []).map((coupon) => ({
        ...coupon,
        isExpired: coupon.valid_until
          ? new Date(coupon.valid_until) < new Date()
          : false,
      }));

      setCoupons(couponsWithExpiredStatus);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from("category_details")
        .select("id, main_category_name")
        .eq("is_active", true);
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch categories");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code?.trim()) {
      toast.error("Coupon code is required!");
      return;
    }

    // Check if at least one benefit is provided
    const hasDiscount = formData.discount_value && formData.discount_value > 0;
    const hasFreeDelivery = formData.free_delivery;
    const hasDeliveryDiscount =
      formData.delivery_discount_amount &&
      formData.delivery_discount_amount > 0;

    if (!hasDiscount && !hasFreeDelivery && !hasDeliveryDiscount) {
      toast.error(
        "Please provide at least one benefit: discount value, free delivery, or delivery discount!"
      );
      return;
    }

    // Validation for percentage discount
    if (hasDiscount && formData.discount_type === "percentage") {
      if (formData.discount_value > 100) {
        toast.error("Percentage discount cannot exceed 100%!");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value
          ? parseFloat(formData.discount_value)
          : 0,
        minimum_order_amount: formData.minimum_order_amount
          ? parseFloat(formData.minimum_order_amount)
          : null,
        maximum_discount_amount:
          formData.discount_type === "percentage" &&
          formData.maximum_discount_amount
            ? parseFloat(formData.maximum_discount_amount)
            : null,
        show_in_ui: formData.show_in_ui,
        applicable_categories:
          formData.applicable_categories.length > 0
            ? formData.applicable_categories.map((id) => parseInt(id))
            : null,
        // Delivery charge features
        free_delivery: formData.free_delivery,
        delivery_discount_amount: formData.delivery_discount_amount
          ? parseFloat(formData.delivery_discount_amount)
          : 0,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        description: formData.description || null,
      };

      if (editId) {
        const { error } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        toast.success("Coupon updated successfully");
      } else {
        const { error } = await supabase.from("coupons").insert([payload]);
        if (error) throw error;
        toast.success("Coupon added successfully");
      }

      await fetchCoupons();
      resetForm();
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        toast.error("Coupon code already exists!");
      } else {
        toast.error("Failed to save coupon");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_amount: coupon.minimum_order_amount || "",
      maximum_discount_amount: coupon.maximum_discount_amount || "",
      show_in_ui: coupon.show_in_ui !== undefined ? coupon.show_in_ui : true,
      applicable_categories: coupon.applicable_categories || [],
      // Delivery charge features
      free_delivery: coupon.free_delivery || false,
      delivery_discount_amount: coupon.delivery_discount_amount || "",
      valid_from: coupon.valid_from ? coupon.valid_from.split("T")[0] : "",
      valid_until: coupon.valid_until ? coupon.valid_until.split("T")[0] : "",
      usage_limit: coupon.usage_limit || "",
      description: coupon.description || "",
    });
    setOriginalData(coupon);
    setEditId(coupon.id);
    setShowForm(true);
  };

  const openDeleteModal = (id, code) => {
    setDeletingId(id);
    setDeletingName(code);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await supabase.from("coupons").delete().eq("id", deletingId);
      setCoupons(coupons.filter((c) => c.id !== deletingId));
      toast.success("Coupon deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete coupon");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeletingId(null);
      setDeletingName("");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      minimum_order_amount: "",
      maximum_discount_amount: "",
      show_in_ui: true,
      applicable_categories: [],
      // Delivery charge features
      free_delivery: false,
      delivery_discount_amount: "",
      valid_from: "",
      valid_until: "",
      usage_limit: "",
      description: "",
    });
    setOriginalData({});
    setEditId(null);
    setShowForm(false);
  };

  // Handle coupon code input with real-time validation
  const handleCouponCodeChange = (e) => {
    const value = e.target.value;
    
    // Keep only letters and numbers, remove spaces and special characters
    const filteredValue = value
      .replace(/[^A-Za-z0-9]/g, '') // Keep only alphanumeric characters
      .toUpperCase(); // Convert to uppercase
    
    setFormData({
      ...formData,
      code: filteredValue,
    });
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.description &&
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-gray-50">
      <Toaster position="top-right" richColors closeButton />
      {loading && <Loader message="Please wait..." />}

      <div className="max-w-7xl mx-auto">
        {/* Add Coupon Button */}
        <button
          onClick={() => setShowForm(true)}
          disabled={showForm}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium mb-6 transition-colors duration-200 ${
            showForm
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Coupon
        </button>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editId ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={handleCouponCodeChange}
                    placeholder="Enter coupon code (e.g., WELCOME10)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only letters and numbers allowed. Spaces and special characters are automatically removed.
                  </p>
                </div>

                {/* Discount Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value,
                        // Clear max discount amount when switching to fixed
                        maximum_discount_amount: e.target.value === "fixed" ? "" : formData.maximum_discount_amount,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.discount_type === "percentage" ? "Discount Percentage" : "Discount Amount"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                    placeholder={
                      formData.discount_type === "percentage"
                        ? "Enter percentage (e.g., 10)"
                        : "Enter amount (e.g., 50)"
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Minimum Order Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Order Amount
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_order_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimum_order_amount: e.target.value,
                      })
                    }
                    placeholder="Enter minimum amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Maximum Discount Amount - Only for percentage discounts */}
                {formData.discount_type === "percentage" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Discount Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.maximum_discount_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maximum_discount_amount: e.target.value,
                        })
                      }
                      placeholder="Enter maximum discount cap"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum amount that can be discounted (e.g., 10% of ₹1000 = ₹100, but cap at ₹50)
                    </p>
                  </div>
                )}

                {/* Show in UI Toggle */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.show_in_ui}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          show_in_ui: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Show in User Interface</span>
                      <p className="text-xs text-gray-500">
                        If unchecked, coupon will be hidden from users but can still be applied by typing the code
                      </p>
                    </div>
                  </label>
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Delivery Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Delivery Options (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Free Delivery */}
                  <div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="free_delivery"
                        checked={formData.free_delivery}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            free_delivery: e.target.checked,
                            // Clear delivery discount amount when free delivery is selected
                            delivery_discount_amount: e.target.checked
                              ? ""
                              : formData.delivery_discount_amount,
                          });
                        }}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor="free_delivery"
                        className="text-sm font-medium text-gray-700"
                      >
                        Free Delivery
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Customer gets free delivery (can combine with coupon
                      discount)
                    </p>
                  </div>

                  {/* Delivery Discount Amount */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        formData.free_delivery
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      Delivery Discount Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.delivery_discount_amount}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          delivery_discount_amount: e.target.value,
                          // Clear free delivery when discount amount is entered
                          free_delivery: e.target.value
                            ? false
                            : formData.free_delivery,
                        });
                      }}
                      placeholder="Enter delivery discount amount"
                      disabled={formData.free_delivery}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                        formData.free_delivery
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    />
                    <p
                      className={`text-xs mt-1 ${
                        formData.free_delivery
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.free_delivery
                        ? "Disabled when free delivery is selected"
                        : "Discount on delivery charges (can combine with coupon discount)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter coupon description"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.code?.trim() ||
                    (!formData.discount_value &&
                      !formData.free_delivery &&
                      !formData.delivery_discount_amount)
                  }
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    formData.code?.trim() &&
                    (formData.discount_value ||
                      formData.free_delivery ||
                      formData.delivery_discount_amount)
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  {loading
                    ? "Saving..."
                    : editId
                    ? "Update Coupon"
                    : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons Grid */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                All Coupons
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search coupons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-80"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">
                        {coupon.code}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {coupon.isExpired && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                          Expired
                        </span>
                      )}
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(coupon.id, coupon.code)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {coupon.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {coupon.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    {/* Coupon Benefits Section */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase">Benefits:</h4>
                      
                      {/* Discount Offer - Only show if discount value exists and is greater than 0 */}
                      {coupon.discount_value && coupon.discount_value > 0 && (
                        <div className="flex items-center space-x-2">
                         
                          <span className="text-sm font-medium text-gray-900">
                          { `₹${coupon.discount_value} off on order`}
                          </span>
                        </div>
                      )}

                      {/* Free Delivery */}
                      {coupon.free_delivery && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 text-lg">🚚</span>
                          <span className="text-sm font-medium text-gray-900">
                            Free Delivery
                          </span>
                        </div>
                      )}

                      {/* Delivery Discount */}
                      {coupon.delivery_discount_amount > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 text-lg">📦</span>
                          <span className="text-sm font-medium text-gray-900">
                            ₹{coupon.delivery_discount_amount} off on delivery
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Order Conditions */}
                    {(coupon.minimum_order_amount || (coupon.maximum_discount_amount && coupon.discount_type === "percentage")) && (
                      <div className="space-y-1">
                        {coupon.minimum_order_amount && (
                          <p className="text-xs text-gray-600">
                            📌 Min order: ₹{coupon.minimum_order_amount}
                          </p>
                        )}
                        {coupon.maximum_discount_amount && coupon.discount_type === "percentage" && (
                          <p className="text-xs text-gray-600">
                            🎯 Max discount: ₹{coupon.maximum_discount_amount}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Validity */}
                    {coupon.valid_until && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          Valid until: {new Date(coupon.valid_until).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredCoupons.length === 0 && (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No coupons found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Coupon
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the coupon "{deletingName}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
