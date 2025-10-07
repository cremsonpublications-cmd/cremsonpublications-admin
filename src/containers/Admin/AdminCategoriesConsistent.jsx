import React, { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, FolderOpen, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import Loader from "./Loader";

export default function AdminCategories() {
  // State management
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Form data - SIMPLIFIED STRUCTURE
  const [formData, setFormData] = useState({
    main_category_name: "",  // User can type any name
    offer_type: "none",     // none, percentage, flat_amount
    offer_percentage: "",
    offer_amount: ""
  });

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);


  async function fetchAllData() {
    setLoading(true);
    try {
      // Fetch categories only
      const categoriesResult = await supabase
        .from("category_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (categoriesResult.error) throw categoriesResult.error;

      setCategories(categoriesResult.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!formData.main_category_name.trim()) {
      toast.error("Please enter a main category name!");
      return;
    }

    // Validate offer values
    if (formData.offer_type === 'percentage') {
      if (!formData.offer_percentage || formData.offer_percentage <= 0 || formData.offer_percentage > 100) {
        toast.error("Please enter a valid percentage between 1-100!");
        return;
      }
    }
    if (formData.offer_type === 'flat_amount') {
      if (!formData.offer_amount || formData.offer_amount <= 0) {
        toast.error("Please enter a valid amount!");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        main_category_name: formData.main_category_name.trim(),
        offer_type: formData.offer_type,
        offer_percentage: formData.offer_type === 'percentage' ? parseFloat(formData.offer_percentage) : 0,
        offer_amount: formData.offer_type === 'flat_amount' ? parseFloat(formData.offer_amount) : 0
      };

      if (editId) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        toast.success("Category created successfully");
      }

      await fetchAllData();
      resetForm();
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        toast.error("Category with this combination already exists!");
      } else {
        toast.error("Failed to save category: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(category) {
    try {
      // Get the detailed category data
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", category.id)
        .single();

      if (error) throw error;

      setFormData({
        main_category_name: data.main_category_name || "",
        offer_type: data.offer_type || "none",
        offer_percentage: data.offer_percentage || "",
        offer_amount: data.offer_amount || ""
      });
      setEditId(category.id);
      setShowForm(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load category for editing");
    }
  }

  const openDeleteModal = (id, name) => {
    setDeletingId(id);
    setDeletingName(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await supabase.from("categories").delete().eq("id", deletingId);
      await fetchAllData();
      toast.success("Category deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeletingId(null);
      setDeletingName("");
    }
  };

  const resetForm = () => {
    setFormData({
      main_category_name: "",
      offer_type: "none",
      offer_percentage: "",
      offer_amount: ""
    });
    setEditId(null);
    setShowForm(false);
  };


  const filteredCategories = categories.filter((category) =>
    category.main_category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {loading && <Loader message="Please wait..." />}

      <div className="max-w-7xl mx-auto">
        {/* Add Category Button - Consistent with AdminCoupons */}
        <button
          onClick={() => setShowForm(true)}
          disabled={showForm}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium mb-6 transition-colors duration-200 ${
            showForm
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>

        {/* Form - Consistent design */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editId ? "Edit Category" : "Create New Category"}
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
                {/* Main Category Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.main_category_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, main_category_name: e.target.value }))}
                    placeholder="Enter main category name (e.g., CBSE Board)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Offer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Type
                  </label>
                  <select
                    value={formData.offer_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, offer_type: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  >
                    <option value="none">No Offer</option>
                    <option value="percentage">Percentage Off</option>
                    <option value="flat_amount">Flat Amount Off</option>
                  </select>
                </div>
              </div>

              {/* Offer Value */}
              {formData.offer_type !== 'none' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.offer_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.offer_type === 'percentage' ? "100" : undefined}
                      step={formData.offer_type === 'percentage' ? "0.1" : "1"}
                      value={formData.offer_type === 'percentage' ? formData.offer_percentage : formData.offer_amount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [formData.offer_type === 'percentage' ? 'offer_percentage' : 'offer_amount']: e.target.value
                      }))}
                      placeholder={formData.offer_type === 'percentage' ? "Enter percentage (e.g., 15)" : "Enter amount (e.g., 50)"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    />
                  </div>
                </div>
              )}


              {/* Actions - Consistent with AdminCoupons */}
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
                  disabled={loading || !formData.main_category_name.trim()}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    formData.main_category_name.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  {loading ? "Saving..." : editId ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid - Consistent with AdminCoupons */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">All Categories</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-80"
                />
              </div>
            </div>
          </div>

          {/* Table Format */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Offer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-medium text-gray-900">{category.main_category_name}</h3>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {category.offer_type === 'none' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <span className="w-3 h-3 mr-1">🚫</span>
                          No Offer
                        </span>
                      ) : category.offer_type === 'percentage' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Percent className="w-3 h-3 mr-1" />
                          {category.offer_percentage}% OFF
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ₹{category.offer_amount} OFF
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(category.id, category.main_category_name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first category"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deletingName}</strong>"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}