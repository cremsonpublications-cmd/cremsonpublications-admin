import React, { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, FolderOpen, BookOpen, GraduationCap, Percent, DollarSign } from "lucide-react";
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
  const [classFilter, setClassFilter] = useState("");

  // Form data - NEW STRUCTURE
  const [formData, setFormData] = useState({
    main_category_name: "",  // User can type any name
    sub_categories: [],      // Sample Paper, Textbook
    classes: [],            // 1st to 12th
    offer_type: "none",     // none, percentage, flat_amount
    offer_percentage: 0,
    offer_amount: 0
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
    if (formData.offer_type === 'percentage' && (!formData.offer_percentage || formData.offer_percentage <= 0)) {
      toast.error("Please enter a valid percentage (1-100)!");
      return;
    }
    if (formData.offer_type === 'flat_amount' && (!formData.offer_amount || formData.offer_amount <= 0)) {
      toast.error("Please enter a valid amount!");
      return;
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
        offer_percentage: data.offer_percentage || 0,
        offer_amount: data.offer_amount || 0
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
      offer_percentage: 0,
      offer_amount: 0
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

  // Helper: bulk select classes by range
  const setClassesByRange = (start, end) => {
    const ids = classes
      .filter(c => c.class_number >= start && c.class_number <= end)
      .map(c => c.id.toString());
    setFormData(prev => ({ ...prev, classes: ids }));
  };

  const selectAllClasses = () => {
    const ids = classes.map(c => c.id.toString());
    setFormData(prev => ({ ...prev, classes: ids }));
  };

  const clearAllClasses = () => {
    setFormData(prev => ({ ...prev, classes: [] }));
  };

  // Derived: filtered classes by text
  const filteredClassesList = classes.filter(cls =>
    cls.display_name.toLowerCase().includes(classFilter.toLowerCase())
  );

  // Derived: Preview summary (client-side)
  const selectedSubCatNames = subCategories
    .filter(sc => formData.sub_categories.includes(sc.id.toString()))
    .map(sc => sc.name);
  const selectedClassNames = classes
    .filter(c => formData.classes.includes(c.id.toString()))
    .sort((a, b) => a.class_number - b.class_number)
    .map(c => c.display_name);
  const previewName = [
    formData.main_category_name?.trim(),
    selectedSubCatNames.length ? selectedSubCatNames.join(", ") : null,
    selectedClassNames.length ? selectedClassNames.join(", ") : null,
  ].filter(Boolean).join(" - ");

  const filteredCategories = categories.filter((category) =>
    category.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.main_category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600 mt-2">Create flexible categories with custom names, sub-categories and discounts</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={showForm}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              showForm
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Category
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-8 mb-8">
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
              {/* Main Category Name Input - NEW */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Category Name <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(e.g., CBSE Board, State Board, ICSE, etc.)</span>
                </label>
                <input
                  type="text"
                  value={formData.main_category_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, main_category_name: e.target.value }))}
                  placeholder="Enter main category name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Sub Categories Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sub Categories <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Select one or both)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {subCategories.map((subCat) => (
                    <label key={subCat.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Classes <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Multi-select)</span>
                </label>
                {/* Classes toolbar: filter and quick select */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      placeholder="Filter classes (e.g., 10th)"
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <GraduationCap className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={selectAllClasses} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">All</button>
                    <button type="button" onClick={clearAllClasses} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">None</button>
                    <button type="button" onClick={() => setClassesByRange(1,5)} className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">Primary (1-5)</button>
                    <button type="button" onClick={() => setClassesByRange(6,8)} className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">Middle (6-8)</button>
                    <button type="button" onClick={() => setClassesByRange(9,10)} className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">Secondary (9-10)</button>
                    <button type="button" onClick={() => setClassesByRange(11,12)} className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">Senior (11-12)</button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  {filteredClassesList.map((cls) => (
                    <label key={cls.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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
                {/* Selected classes preview */}
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-500">Selected ({selectedClassNames.length}):</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedClassNames.map((name, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {name}
                      </span>
                    ))}
                    {selectedClassNames.length === 0 && (
                      <span className="text-xs text-gray-400">No classes selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Preview</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {previewName || "Start typing main category and select sub-categories/classes to see preview"}
                </div>
                <div className="text-xs text-gray-500 mt-1">This is a client-side preview of how the category name will look.</div>
              </div>

              {/* Offer Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category Offer
                </label>
                <div className="space-y-4">
                  {/* Offer Type */}
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Offer Type</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'none', label: 'No Offer', icon: '🚫' },
                        { value: 'percentage', label: 'Percentage Off', icon: '📊' },
                        { value: 'flat_amount', label: 'Flat Amount Off', icon: '💰' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="offer_type"
                            value={option.value}
                            checked={formData.offer_type === option.value}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              offer_type: e.target.value
                            }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-lg">{option.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Percentage Value */}
                  {formData.offer_type === 'percentage' && (
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">
                        Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.offer_percentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, offer_percentage: e.target.value }))}
                        placeholder="Enter percentage (e.g., 15)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  )}

                  {/* Flat Amount Value */}
                  {formData.offer_type === 'flat_amount' && (
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">
                        Flat Discount Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.offer_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, offer_amount: e.target.value }))}
                        placeholder="Enter amount (e.g., 50)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  )}
                </div>
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
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : editId ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Categories List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
          {/* Search Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="text-sm text-gray-500">
                {filteredCategories.length} categories found
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Category Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Sub Categories & Classes
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
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {category.main_category_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {category.category_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
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
                        <div>
                          <span className="text-xs font-medium text-gray-500">Classes:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {category.class_names?.map((className, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {className}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {category.offer_type === 'none' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No Offer
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            category.offer_type === 'percentage'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {category.offer_type === 'percentage'
                              ? `${category.offer_percentage}% OFF`
                              : `₹${category.offer_amount} OFF`
                            }
                          </span>
                        )}
                      </div>
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