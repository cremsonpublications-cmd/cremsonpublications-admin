import React, { useContext, useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import { Toaster, toast } from "sonner";
import noImage from "../../assets/noImage.jpg";
import Loader from "./Loader";
import { supabase } from "../../supabaseClient";
import { AppContext } from "../../context/AppContext";

const CLOUD_NAME = "dkxxa3xt0";
const UPLOAD_PRESET = "unsigned_preset";

const TestProduct = () => {
  const {
    products,
    setProducts,
    categories,
    setCategories,
    productsFetched,
    setProductsFetched,
    categoriesFetched,
    setCategoriesFetched,
  } = useContext(AppContext);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [sidePreviews, setSidePreviews] = useState([]);

  const [originalData, setOriginalData] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  // Duplicate modal
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");

  // useEffect(() => {
  //   if (!products || products.length === 0) fetchProducts();
  //   if (!categories || categories.length === 0) fetchCategories();
  // }, [products, categories]);
  useEffect(() => {
    if (!productsFetched) {
      fetchProducts();
      setProductsFetched(true);
    }
    if (!categoriesFetched) {
      fetchCategories();
      setCategoriesFetched(true);
    }
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)");
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*");
    if (!error) setCategories(data || []);
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

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, image: file });
    }
  };

  const handleSideImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setSidePreviews(files.map((f) => URL.createObjectURL(f)));
    setFormData({ ...formData, sideImages: files });
  };

  const removeMainImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview("");
    toast.info("Main image removed");
  };

  const removeSideImage = (index) => {
    const newSidePreviews = sidePreviews.filter((_, i) => i !== index);
    const newSideImages =
      formData.sideImages?.filter((_, i) => i !== index) || [];
    setSidePreviews(newSidePreviews);
    setFormData({ ...formData, sideImages: newSideImages });
    toast.info("Side image removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Product name is required!");
      return;
    }
    if (!formData.currentPrice || formData.currentPrice <= 0) {
      toast.error("Current price is required!");
      return;
    }
    if (!formData.packageContents?.trim()) {
      toast.error("Package contents is required!");
      return;
    }

    setLoading(true);
    try {
      let mainUrl = imagePreview || noImage;
      if (formData.image instanceof File) {
        mainUrl = await uploadImage(formData.image);
      }

      let sideUrls = [];
      if (formData.sideImages && formData.sideImages.length > 0) {
        for (let f of formData.sideImages) {
          if (f instanceof File) {
            sideUrls.push(await uploadImage(f));
          } else {
            sideUrls.push(f);
          }
        }
      }

      const payload = {
        name: formData.name,
        category_id: formData.category_id || null,
        type: formData.type,
        old_price: formData.oldPrice,
        current_price: formData.currentPrice,
        discount: formData.discount,
        stock: formData.stock,
        description: formData.description,
        image: mainUrl,
        side_images: sideUrls,
        video: formData.video,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
        safety: formData.safety,
        how_to_use: formData.howToUse
          ? formData.howToUse.split(",").map((t) => t.trim())
          : [],
        rating: formData.rating,
        weight: formData.weight,
        package_contents: formData.packageContents
          ? formData.packageContents.split(",").map((t) => t.trim())
          : [],
        popular: formData.popular || false,
        new_arrival: formData.newArrival || false,
        year: formData.year,
        cracker_type: formData.crackerType,
      };

      if (editId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editId);
        if (error?.code === "23505") {
          setDuplicateName(formData.name.trim());
          setDuplicateModalOpen(true);
        } else if (error) {
          throw error;
        } else {
          toast.success("Product updated successfully");
        }
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error?.code === "23505") {
          setDuplicateName(formData.name.trim());
          setDuplicateModalOpen(true);
        } else if (error) {
          throw error;
        } else {
          toast.success("Product added successfully");
        }
      }

      await fetchProducts();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      ...product,
      oldPrice: product.old_price,
      currentPrice: product.current_price,
      packageContents: product.package_contents?.join(","),
      tags: product.tags?.join(","),
      howToUse: product.how_to_use?.join(","),
      sideImages: product.side_images || [],
      newArrival: product.new_arrival,
      crackerType: product.cracker_type,
      howToUse: product.how_to_use?.join(",") || "",
    });
    setImagePreview(product.image || "");
    setSidePreviews(product.side_images || []);
    setOriginalData(product);
    setEditId(product.id);
    setShowForm(true);
  };

  const hasChanges = () => {
    if (!editId) return true;

    const nameChanged = formData.name?.trim() !== originalData.name?.trim();
    const imageChanged =
      formData.image instanceof File ||
      imagePreview !== (originalData.image || "");
    const sideImagesChanged =
      JSON.stringify(sidePreviews) !==
      JSON.stringify(originalData.side_images || []);

    return (
      nameChanged ||
      imageChanged ||
      sideImagesChanged ||
      formData.category_id !== originalData.category_id ||
      formData.type !== originalData.type ||
      formData.oldPrice !== originalData.old_price ||
      formData.currentPrice !== originalData.current_price ||
      formData.discount !== originalData.discount ||
      formData.stock !== originalData.stock ||
      formData.description !== originalData.description ||
      formData.video !== originalData.video ||
      formData.tags !== (originalData.tags?.join(",") || "") ||
      formData.safety !== originalData.safety ||
      formData.howToUse !== (originalData.how_to_use?.join(",") || "") ||
      formData.rating !== originalData.rating ||
      formData.weight !== originalData.weight ||
      formData.packageContents !==
        (originalData.package_contents?.join(",") || "") ||
      formData.popular !== originalData.popular ||
      formData.newArrival !== originalData.new_arrival ||
      formData.year !== originalData.year ||
      formData.crackerType !== originalData.cracker_type
    );
  };

  const openDeleteModal = (id, name) => {
    setDeletingId(id);
    setDeletingName(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await supabase.from("products").delete().eq("id", deletingId);
      setProducts(products.filter((p) => p.id !== deletingId));
      toast.success("Product deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeletingId(null);
      setDeletingName("");
    }
  };

  const resetForm = () => {
    setFormData({});
    setImagePreview("");
    setSidePreviews([]);
    setOriginalData({});
    setEditId(null);
    setShowForm(false);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50">
      <Toaster position="top-right" richColors closeButton />
      {loading && <Loader message="Please wait..." />}

      <div className="max-w-7xl mx-auto">
        {/* Add Product Button */}
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
          Add Product
        </button>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editId ? "Edit Product" : "Create New Product"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter product name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Contents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Contents <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.packageContents || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packageContents: e.target.value,
                    })
                  }
                  placeholder="Enter package contents (comma separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Image (Optional)
                </label>
                {!imagePreview ? (
                  <label className="inline-flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-5 h-5 mr-2" />
                    Upload Main Image
                    <input
                      type="file"
                      onChange={handleMainImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="mt-3 relative w-32">
                    <img
                      src={imagePreview}
                      alt="Main Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeMainImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Side Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Side Images (up to 3)
                </label>
                <label className="inline-flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg cursor-pointer transition-colors">
                  <Plus className="w-5 h-5 mr-2" />
                  Upload Side Images
                  <input
                    type="file"
                    multiple
                    onChange={handleSideImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
                {sidePreviews.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {sidePreviews.map((img, i) => (
                      <div key={i} className="relative">
                        <img
                          src={img}
                          alt={`Side ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeSideImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Two column layout for form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <input
                    type="text"
                    value={formData.type || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    placeholder="Enter product type"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Old Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Old Price
                  </label>
                  <input
                    type="number"
                    value={formData.oldPrice || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, oldPrice: e.target.value })
                    }
                    placeholder="Enter old price"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Current Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.currentPrice || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPrice: e.target.value })
                    }
                    placeholder="Enter current price"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    placeholder="Enter discount percentage"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="Enter stock quantity"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, rating: e.target.value })
                    }
                    placeholder="Enter rating (0-5)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    placeholder="Enter weight (e.g., 200g)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    placeholder="Enter year"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Cracker Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cracker Type
                  </label>
                  <select
                    value={formData.crackerType || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, crackerType: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  >
                    <option value="">-- Select Cracker Type --</option>
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.video || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, video: e.target.value })
                    }
                    placeholder="Enter video URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Full width fields */}
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter product description"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="Enter tags (comma separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Safety */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Safety Instructions
                </label>
                <textarea
                  rows={3}
                  value={formData.safety || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, safety: e.target.value })
                  }
                  placeholder="Enter safety instructions"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* How To Use */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How To Use
                </label>
                <textarea
                  rows={3}
                  value={formData.howToUse || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, howToUse: e.target.value })
                  }
                  placeholder="Enter instructions (comma separated for multiple steps)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-8">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.popular || false}
                    onChange={(e) =>
                      setFormData({ ...formData, popular: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Popular
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.newArrival || false}
                    onChange={(e) =>
                      setFormData({ ...formData, newArrival: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    New Arrival
                  </span>
                </label>
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
                    !formData.name?.trim() ||
                    !formData.currentPrice ||
                    formData.currentPrice <= 0 ||
                    !formData.packageContents?.trim() ||
                    (editId && !hasChanges())
                  }
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    formData.name?.trim() &&
                    formData.currentPrice &&
                    formData.currentPrice > 0 &&
                    formData.packageContents?.trim() &&
                    (!editId || hasChanges())
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  {loading
                    ? "Saving..."
                    : editId
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Grid */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                All Products
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
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
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={product.image || noImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.popular && (
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      {product.new_arrival && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.categories?.name || "No Category"}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {product.old_price && (
                          <span className="text-gray-500 line-through text-sm">
                            ₹{product.old_price}
                          </span>
                        )}
                        <span className="text-purple-600 font-semibold">
                          ₹{product.current_price}
                        </span>
                      </div>
                      {product.discount && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600 text-sm">
                        Stock: {product.stock || 0}
                      </span>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm text-gray-600">
                            {product.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 font-medium text-sm">
                        {product.type || "No Type"}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            openDeleteModal(product.id, product.name)
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Get started by creating your first product"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl w-96 relative">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Product
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
                Duplicate Product
              </h3>
              <p className="text-gray-600">
                Product name <b>{duplicateName}</b> already exists.
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

export default TestProduct;
