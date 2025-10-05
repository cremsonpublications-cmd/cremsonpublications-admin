import React, { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, Ticket, Calendar, DollarSign } from "lucide-react";
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
    discount_value: "",
    minimum_order_amount: "",
    valid_until: "",
    description: ""
  });

  const [originalData, setOriginalData] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Add isExpired field to each coupon
      const couponsWithExpiredStatus = (data || []).map(coupon => ({
        ...coupon,
        isExpired: coupon.valid_until ? new Date(coupon.valid_until) < new Date() : false
      }));

      setCoupons(couponsWithExpiredStatus);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code?.trim()) {
      toast.error("Coupon code is required!");
      return;
    }
    if (!formData.discount_value || formData.discount_value <= 0) {
      toast.error("Discount value is required!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        minimum_order_amount: formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : null,
        valid_until: formData.valid_until || null,
        description: formData.description || null
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
      discount_value: coupon.discount_value,
      minimum_order_amount: coupon.minimum_order_amount || "",
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : "",
      description: coupon.description || ""
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
      discount_value: "",
      minimum_order_amount: "",
      valid_until: "",
      description: ""
    });
    setOriginalData({});
    setEditId(null);
    setShowForm(false);
  };

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="Enter coupon code (e.g., WELCOME10)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>


                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    placeholder={formData.discount_type === 'percentage' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 50)'}
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
                      setFormData({ ...formData, minimum_order_amount: e.target.value })
                    }
                    placeholder="Enter minimum amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
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
                  disabled={loading || !formData.code?.trim() || !formData.discount_value}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    formData.code?.trim() && formData.discount_value
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  {loading ? "Saving..." : editId ? "Update Coupon" : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons Grid */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">All Coupons</h2>
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
                      <h3 className="font-semibold text-gray-900">{coupon.code}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {coupon.isExpired && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">Expired</span>
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
                    <p className="text-gray-600 text-sm mb-3">{coupon.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        ₹{coupon.discount_value} off
                      </span>
                    </div>

                    {coupon.minimum_order_amount && (
                      <p className="text-xs text-gray-500">
                        Min order: ₹{coupon.minimum_order_amount}
                      </p>
                    )}


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
              <h3 className="text-lg font-semibold text-gray-900">Delete Coupon</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the coupon "{deletingName}"? This action cannot be undone.
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