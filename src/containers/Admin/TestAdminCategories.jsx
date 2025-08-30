import React, { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { supabase } from "../../supabaseClient";
import noImage from "../../assets/noImage.jpg";
import Loader from "./Loader"; // 👈 loader component

const CLOUD_NAME = "dkxxa3xt0";
const UPLOAD_PRESET = "unsigned_preset";

const TestAdminCategories = () => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: "", image: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  const [originalData, setOriginalData] = useState({ name: "", image: "" });

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  // Duplicate modal
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

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

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json();
    return data.secure_url;
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview("");
    toast.info("Image removed (will save as empty)");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required!");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = imagePreview || null;

      if (formData.image instanceof File) {
        imageUrl = await uploadImage(formData.image);
      }

      const payload = { name: formData.name.trim(), image: imageUrl };

      if (editId) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editId);
        if (error) {
          if (error.code === "23505") {
            setDuplicateName(formData.name.trim());
            setDuplicateModalOpen(true);
          } else throw error;
        } else {
          toast.success("Category updated successfully");
        }
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) {
          if (error.code === "23505") {
            setDuplicateName(formData.name.trim());
            setDuplicateModalOpen(true);
          } else throw error;
        } else {
          toast.success("Category added successfully");
        }
      }

      await fetchCategories();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, image: null });
    setImagePreview(category.image || "");
    setOriginalData({ name: category.name, image: category.image || "" });

    setEditId(category.id);
    setShowForm(true);
  };

  const hasChanges = () => {
    const nameChanged = formData.name.trim() !== originalData.name.trim();
    const imageChanged =
      formData.image instanceof File || imagePreview !== originalData.image;
    return nameChanged || imageChanged;
  };

  const openDeleteModal = (id, name) => {
    setDeletingId(id);
    setDeletingName(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deletingId);
      if (error) throw error;

      setCategories(categories.filter((cat) => cat.id !== deletingId));
      toast.success("Category deleted");
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
    setFormData({ name: "", image: null });
    setImagePreview("");
    setEditId(null);
    setOriginalData({ name: "", image: "" });
    setShowForm(false);
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className=" bg-gray-50">
      <Toaster position="top-right" richColors closeButton />

      {loading && <Loader message="Please wait..." />}

      <div className="max-w-7xl mx-auto">
        {/* Add Category Button */}
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
          Add Category
        </button>

        {/* Form */}
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter category name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image (optional)
                </label>
                {!imagePreview ? (
                  <label className="inline-flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-5 h-5 mr-2" />
                    {editId ? "Add Image" : "Upload Image"}
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="mt-3 relative w-32">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                    !formData.name.trim() ||
                    (editId && !hasChanges())
                  }
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    formData.name.trim() && (!editId || hasChanges())
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  {loading
                    ? "Saving..."
                    : editId
                    ? "Update Category"
                    : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                All Categories
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-80"
                />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={category.image || noImage}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 font-medium text-sm">
                        {category.productCount || 0} Products
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            openDeleteModal(category.id, category.name)
                          }
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No categories found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Get started by creating your first category"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl w-96 relative">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Category
              </h3>
              <p className="text-gray-600">
                Do you want to delete <b>{deletingName}</b>?
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

      {/* Duplicate Modal */}
      {duplicateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl w-96 relative">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Duplicate Category
              </h3>
              <p className="text-gray-600">
                Category name <b>{duplicateName}</b> already exists.
              </p>
              <div className="flex justify-end gap-3 w-full mt-4">
                <button
                  onClick={() => setDuplicateModalOpen(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAdminCategories;
