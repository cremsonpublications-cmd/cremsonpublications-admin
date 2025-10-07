import React, { useEffect, useState, useRef } from "react";
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, FolderOpen, BookOpen, GraduationCap, Percent, DollarSign, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import Loader from "./Loader";

export default function AdminCategories() {
  // State management
  const [subCategories, setSubCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef(null);

  // Form data - NEW STRUCTURE
  const [formData, setFormData] = useState({
    main_category_name: "",  // User can type any name
    sub_categories: [],      // Sample Paper, Textbook
    classes: [],            // 1st to 12th
    offer_type: "none",     // none, percentage, flat_amount
    offer_percentage: "",
    offer_amount: "",
    description: ""
  });

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target)) {
        setClassDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      // Fetch required data
      const [subCatResult, classesResult, categoriesResult] = await Promise.all([
        supabase.from("sub_categories").select("*").eq("is_active", true).order("name"),
        supabase.from("classes").select("*").eq("is_active", true).order("class_number"),
        supabase.from("category_details").select("*").order("created_at", { ascending: false })
      ]);

      if (subCatResult.error) throw subCatResult.error;
      if (classesResult.error) throw classesResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setSubCategories(subCatResult.data || []);
      setClasses(classesResult.data || []);
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
    if (formData.sub_categories.length === 0) {
      toast.error("Please select at least one sub-category!");
      return;
    }
    if (formData.classes.length === 0) {
      toast.error("Please select at least one class!");
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
      // Generate display name and slug
      const { data: nameData, error: nameError } = await supabase.rpc('generate_category_display_name_slug', {
        p_main_category_name: formData.main_category_name.trim(),
        p_sub_categories: formData.sub_categories.map(id => parseInt(id)),
        p_classes: formData.classes.map(id => parseInt(id))
      });

      if (nameError) throw nameError;
      const { display_name, display_slug } = nameData[0];

      const payload = {
        main_category_name: formData.main_category_name.trim(),
        sub_categories: formData.sub_categories.map(id => parseInt(id)),
        classes: formData.classes.map(id => parseInt(id)),
        name: display_name,
        slug: display_slug,
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
        sub_categories: data.sub_categories?.map(id => id.toString()) || [],
        classes: data.classes?.map(id => id.toString()) || [],
        offer_type: data.offer_type || "none",
        offer_percentage: data.offer_percentage || "",
        offer_amount: data.offer_amount || "",
        description: data.description || ""
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
      sub_categories: [],
      classes: [],
      offer_type: "none",
      offer_percentage: "",
      offer_amount: "",
      description: ""
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubCategoryChange = (subCatId) => {
    setFormData(prev => ({
      ...prev,
      sub_categories: prev.sub_categories.includes(subCatId)
        ? prev.sub_categories.filter(id => id !== subCatId)
        : [...prev.sub_categories, subCatId]
    }));
  };

  const handleClassChange = (classId) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.includes(classId)
        ? prev.classes.filter(id => id !== classId)
        : [...prev.classes, classId]
    }));
  };

  const filteredCategories = categories.filter((category) =>
    category.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

              {/* Sub Categories Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sub Categories <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Select one or both)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {subCategories.map((subCat) => (
                    <label key={subCat.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.sub_categories.includes(subCat.id.toString())}
                        onChange={() => handleSubCategoryChange(subCat.id.toString())}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">{subCat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Classes Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classes <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Multi-select)</span>
                </label>

                {/* Multi-select Dropdown */}
                <div className="relative" ref={classDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                    className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-900">
                      {formData.classes.length === 0
                        ? "Select classes..."
                        : `${formData.classes.length} class${formData.classes.length === 1 ? '' : 'es'} selected`
                      }
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${classDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {classDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">

                      {/* Options List */}
                      <div className="p-2">
                        {classes.map((cls) => (
                          <label
                            key={cls.id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.classes.includes(cls.id.toString())}
                              onChange={() => handleClassChange(cls.id.toString())}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <GraduationCap className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-900">{cls.display_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Classes Preview */}
                {formData.classes.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-600">
                      Selected Classes ({formData.classes.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {classes
                        .filter(cls => formData.classes.includes(cls.id.toString()))
                        .sort((a, b) => a.class_number - b.class_number)
                        .map((cls) => (
                          <span
                            key={cls.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {cls.display_name}
                            <button
                              type="button"
                              onClick={() => handleClassChange(cls.id.toString())}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

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

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{category.main_category_name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(category.id, category.main_category_name)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{category.category_name}</p>

                  <div className="space-y-3">
                    {/* Sub Categories */}
                    <div>
                      <span className="text-xs font-medium text-gray-500">Sub Categories:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {category.sub_category_names?.map((subCat, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {subCat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Classes */}
                    <div>
                      <span className="text-xs font-medium text-gray-500">Classes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {category.class_names?.slice(0, 3).map((className, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {className}
                          </span>
                        ))}
                        {category.class_names?.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{category.class_names.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Offer */}
                    <div className="flex items-center space-x-2">
                      {category.offer_type === 'none' ? (
                        <>
                          <span className="w-4 h-4 text-gray-400">🚫</span>
                          <span className="text-sm text-gray-600">No Offer</span>
                        </>
                      ) : category.offer_type === 'percentage' ? (
                        <>
                          <Percent className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-gray-600">{category.offer_percentage}% OFF</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">₹{category.offer_amount} OFF</span>
                        </>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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