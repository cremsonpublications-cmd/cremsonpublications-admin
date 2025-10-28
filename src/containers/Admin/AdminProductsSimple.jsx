import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Package,
  Upload,
  Tag,
  DollarSign,
  ChevronDown,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import Loader from "./Loader";

export default function AdminProductsSimple() {
  // State management
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSide, setUploadingSide] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    delivery_info: "",
    returns_info: ""
  });

  // Cloudinary configuration
  const CLOUD_NAME = "dkxxa3xt0";
  const UPLOAD_PRESET = "unsigned_preset";

  // Form data - Simplified structure based on your requirements
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    sub_categories: [], // Array for selected sub-categories
    classes: [], // Array for selected classes
    main_image: "",
    side_images: [],
    author: "",
    isbn: "",
    edition: "",
    mrp: "",
    status: "In Stock",
    weight: "",
    dimension: "",
    short_description: "",
    description: "",
    delivery_information: "",
    returns_information: "",
    enable_bulk_pricing: false,
    bulk_pricing: [],
    has_own_discount: false,
    own_discount_percentage: "",
    use_category_discount: true,
    tags: [],
  });

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  // File input refs
  const mainImageRef = useRef(null);
  const sideImagesRef = useRef(null);

  // Drag and drop state
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingSide, setIsDraggingSide] = useState(false);

  // Dropdown state
  const [subCategoryDropdownOpen, setSubCategoryDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const subCategoryDropdownRef = useRef(null);
  const classDropdownRef = useRef(null);

  // Status options
  const statusOptions = [
    "In Stock",
    "Out of Stock",
    "On Sale",
    "Featured",
    "On Backorders",
  ];

  // Default sub-category options
  const subCategoryOptions = ["Sample Paper", "Textbook"];

  // Default class options
  const classOptions = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
  ];

  useEffect(() => {
    fetchAllData();
    fetchGlobalSettings();
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        subCategoryDropdownRef.current &&
        !subCategoryDropdownRef.current.contains(event.target)
      ) {
        setSubCategoryDropdownOpen(false);
      }
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(event.target)
      ) {
        setClassDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [categoriesResult, productsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, main_category_name")
          .eq("is_active", true)
          .order("main_category_name"),
        supabase
          .from("products_with_category")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (productsResult.error) throw productsResult.error;

      setCategories(categoriesResult.data || []);
      setProducts(productsResult.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGlobalSettings() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("global_delivery_info, global_returns_info")
        .eq("main_category_name", "SYSTEM_GLOBAL_SETTINGS")
        .single();

      if (error) {
        console.error("No global settings found:", error);
        return;
      }

      if (data) {
        const newGlobalSettings = {
          delivery_info: data.global_delivery_info || "",
          returns_info: data.global_returns_info || ""
        };
        setGlobalSettings(newGlobalSettings);

        // Update form data if we're creating a new product (not editing)
        if (!editId && showForm) {
          setFormData(prev => ({
            ...prev,
            delivery_information: newGlobalSettings.delivery_info,
            returns_information: newGlobalSettings.returns_info,
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching global settings:", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a product name!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : null,
        sub_categories:
          formData.sub_categories.length > 0 ? formData.sub_categories : null,
        classes: formData.classes.length > 0 ? formData.classes : null,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        status: formData.status,
        author: formData.author.trim() || null,
        isbn: formData.isbn.trim() || null,
        edition: formData.edition.trim() || null,
        short_description: formData.short_description.trim() || null,
        description: formData.description.trim() || null,
        delivery_information: formData.delivery_information.trim() || null,
        returns_information: formData.returns_information.trim() || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        main_image: formData.main_image || null,
        side_images:
          formData.side_images.length > 0 ? formData.side_images : null,
        weight: formData.weight.trim() || null,
        dimension: formData.dimension.trim() || null,
        has_own_discount: formData.has_own_discount,
        own_discount_percentage: formData.has_own_discount
          ? parseFloat(formData.own_discount_percentage) || 0
          : null,
        use_category_discount: formData.use_category_discount,
        bulk_pricing:
          formData.enable_bulk_pricing && formData.bulk_pricing.length > 0
            ? formData.bulk_pricing
            : null,
      };

      if (editId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
        toast.success("Product created successfully");
      }

      await fetchAllData();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(
        "Failed to save product: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(product) {
    try {
      setFormData({
        name: product.name || "",
        category_id: product.category_id?.toString() || "",
        sub_categories: product.sub_categories || [],
        classes: product.classes || [],
        main_image: product.main_image || "",
        side_images: product.side_images || [],
        author: product.author || "",
        isbn: product.isbn || "",
        edition: product.edition || "",
        mrp: product.mrp || "",
        status: product.status || "In Stock",
        weight: product.weight || "",
        dimension: product.dimension || "",
        short_description: product.short_description || "",
        description: product.description || "",
        delivery_information: product.delivery_information || "",
        returns_information: product.returns_information || "",
        enable_bulk_pricing: Boolean(
          product.bulk_pricing && product.bulk_pricing.length > 0
        ),
        bulk_pricing: product.bulk_pricing || [],
        has_own_discount: Boolean(product.has_own_discount),
        own_discount_percentage: product.own_discount_percentage || "",
        use_category_discount: Boolean(product.use_category_discount !== false),
        tags: product.tags || [],
      });
      setEditId(product.id);
      setShowForm(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load product for editing");
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
      await supabase.from("products").delete().eq("id", deletingId);
      await fetchAllData();
      toast.success("Product deleted successfully");
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

  // Clone product function
  const handleCloneProduct = async (product) => {
    setLoading(true);
    try {
      // Generate unique ISBN by adding timestamp
      const timestamp = Date.now();
      const uniqueISBN = product.isbn
        ? `${product.isbn.split("-CLONE")[0]}-CLONE-${timestamp}`
        : null;

      // Create a copy of the product with modified name and unique ISBN
      const clonedProduct = {
        name: `${product.name} (Clone)`,
        category_id: product.category_id,
        sub_categories: product.sub_categories || [],
        classes: product.classes || [],
        main_image: product.main_image,
        side_images: product.side_images || [],
        author: product.author,
        isbn: uniqueISBN, // Generate unique ISBN
        edition: product.edition,
        mrp: product.mrp,
        status: product.status,
        weight: product.weight,
        dimension: product.dimension,
        short_description: product.short_description,
        description: product.description,
        delivery_information: product.delivery_information,
        returns_information: product.returns_information,
        tags: product.tags || [],
        has_own_discount: product.has_own_discount,
        own_discount_percentage: product.own_discount_percentage,
        use_category_discount: product.use_category_discount,
        bulk_pricing: product.bulk_pricing || [],
        is_active: product.is_active,
      };

      const { error } = await supabase.from("products").insert([clonedProduct]);

      if (error) throw error;

      await fetchAllData();
      toast.success("Product cloned successfully!");
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        toast.error(
          "A product with this ISBN already exists! Please try again."
        );
      } else {
        toast.error(
          "Failed to clone product: " + (err.message || "Unknown error")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getFormDefaults = () => ({
    name: "",
    category_id: "",
    sub_categories: [],
    classes: [],
    main_image: "",
    side_images: [],
    author: "",
    isbn: "",
    edition: "",
    mrp: "",
    status: "In Stock",
    weight: "",
    dimension: "",
    short_description: "",
    description: "",
    delivery_information: globalSettings.delivery_info,
    returns_information: globalSettings.returns_info,
    enable_bulk_pricing: false,
    bulk_pricing: [],
    has_own_discount: false,
    own_discount_percentage: "",
    use_category_discount: true,
    tags: [],
  });

  const resetForm = () => {
    setFormData(getFormDefaults());
    setEditId(null);
    setShowForm(false);
  };

  // Handle image uploads
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadMainImage(file);
  };

  const handleSideImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // Max 3 images
    if (files.length === 0) return;
    await uploadSideImages(files);
  };

  // Upload main image to Cloudinary
  const uploadMainImage = async (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingMain(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setFormData((prev) => ({ ...prev, main_image: data.secure_url }));
      toast.success("Main image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingMain(false);
    }
  };

  // Upload side images to Cloudinary
  const uploadSideImages = async (files) => {
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length === 0) {
      toast.error("Please upload image files");
      return;
    }

    // Limit to remaining slots (max 3 total)
    const remainingSlots = 3 - formData.side_images.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast.error("Maximum 3 side images allowed");
      return;
    }

    setUploadingSide(true);
    const uploadedUrls = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        uploadedUrls.push(data.secure_url);
      }

      setFormData((prev) => ({
        ...prev,
        side_images: [...prev.side_images, ...uploadedUrls].slice(0, 3),
      }));
      toast.success(
        `${uploadedUrls.length} side image(s) uploaded successfully`
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploadingSide(false);
    }
  };

  // Drag and drop handlers for main image
  const handleMainDragOver = (e) => {
    e.preventDefault();
    setIsDraggingMain(true);
  };

  const handleMainDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingMain(false);
  };

  const handleMainDrop = async (e) => {
    e.preventDefault();
    setIsDraggingMain(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadMainImage(file);
    }
  };

  // Drag and drop handlers for side images
  const handleSideDragOver = (e) => {
    e.preventDefault();
    setIsDraggingSide(true);
  };

  const handleSideDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingSide(false);
  };

  const handleSideDrop = async (e) => {
    e.preventDefault();
    setIsDraggingSide(false);

    const files = Array.from(e.dataTransfer.files).slice(0, 3);
    if (files.length > 0) {
      await uploadSideImages(files);
    }
  };

  // Handle tags
  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle bulk pricing
  const addBulkPricing = () => {
    setFormData((prev) => ({
      ...prev,
      bulk_pricing: [...prev.bulk_pricing, { quantity: "", price: "" }],
    }));
  };

  const updateBulkPricing = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      bulk_pricing: prev.bulk_pricing.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeBulkPricing = (index) => {
    setFormData((prev) => ({
      ...prev,
      bulk_pricing: prev.bulk_pricing.filter((_, i) => i !== index),
    }));
  };

  // Handle sub-category selection
  const handleSubCategoryToggle = (subCategory) => {
    setFormData((prev) => ({
      ...prev,
      sub_categories: prev.sub_categories.includes(subCategory)
        ? prev.sub_categories.filter((cat) => cat !== subCategory)
        : [...prev.sub_categories, subCategory],
    }));
  };

  // Handle class selection
  const handleClassToggle = (className) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter((cls) => cls !== className)
        : [...prev.classes, className],
    }));
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {loading && <Loader message="Please wait..." />}

      <div className="max-w-7xl mx-auto">
        {/* Add Product Button */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setShowForm(true);
              // Apply global settings when opening new product form
              setTimeout(() => {
                if (!editId) {
                  setFormData(getFormDefaults());
                }
              }, 100);
            }}
            disabled={showForm}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              showForm
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Product Form */}
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
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.main_category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub Categories & Classes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sub Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Categories <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={subCategoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setSubCategoryDropdownOpen(!subCategoryDropdownOpen)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-left flex items-center justify-between"
                    >
                      <span className="text-gray-900">
                        {formData.sub_categories.length > 0
                          ? formData.sub_categories.join(", ")
                          : "Select sub categories"}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          subCategoryDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {subCategoryDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {subCategoryOptions.map((subCategory) => (
                          <label
                            key={subCategory}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.sub_categories.includes(
                                subCategory
                              )}
                              onChange={() =>
                                handleSubCategoryToggle(subCategory)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                            />
                            <span className="text-gray-900">{subCategory}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.sub_categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.sub_categories.map((subCat, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {subCat}
                          <button
                            type="button"
                            onClick={() => handleSubCategoryToggle(subCat)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Classes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classes <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={classDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-left flex items-center justify-between"
                    >
                      <span className="text-gray-900">
                        {formData.classes.length > 0
                          ? formData.classes.join(", ")
                          : "Select classes"}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          classDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {classDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {classOptions.map((className) => (
                          <label
                            key={className}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.classes.includes(className)}
                              onChange={() => handleClassToggle(className)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                            />
                            <span className="text-gray-900">{className}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.classes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.classes.map((className, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {className}
                          <button
                            type="button"
                            onClick={() => handleClassToggle(className)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Image (Optional)
                  </label>
                  <div className="space-y-3">
                    <div
                      onDragOver={handleMainDragOver}
                      onDragLeave={handleMainDragLeave}
                      onDrop={handleMainDrop}
                      onClick={() => mainImageRef.current?.click()}
                      className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                        isDraggingMain
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400 bg-white"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Upload
                          className={`w-8 h-8 mb-2 ${
                            isDraggingMain ? "text-blue-500" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isDraggingMain ? "text-blue-600" : "text-gray-600"
                          }`}
                        >
                          {isDraggingMain
                            ? "Drop image here"
                            : "Drag & drop or click to upload"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Main product image
                        </span>
                      </div>
                    </div>
                    <input
                      ref={mainImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      className="hidden"
                    />
                    {formData.main_image && (
                      <div className="relative">
                        <img
                          src={formData.main_image}
                          alt="Main"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, main_image: "" }))
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Side Images (up to 3)
                  </label>
                  <div className="space-y-3">
                    <div
                      onDragOver={handleSideDragOver}
                      onDragLeave={handleSideDragLeave}
                      onDrop={handleSideDrop}
                      onClick={() => sideImagesRef.current?.click()}
                      className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                        isDraggingSide
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 hover:border-gray-400 bg-white"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Upload
                          className={`w-8 h-8 mb-2 ${
                            isDraggingSide ? "text-green-500" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isDraggingSide ? "text-green-600" : "text-gray-600"
                          }`}
                        >
                          {isDraggingSide
                            ? "Drop images here"
                            : "Drag & drop or click to upload"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Up to 3 additional images
                        </span>
                      </div>
                    </div>
                    <input
                      ref={sideImagesRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSideImageUpload}
                      className="hidden"
                    />
                    {formData.side_images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.side_images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Side ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  side_images: prev.side_images.filter(
                                    (_, i) => i !== index
                                  ),
                                }))
                              }
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        author: e.target.value,
                      }))
                    }
                    placeholder="Enter author name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isbn: e.target.value }))
                    }
                    placeholder="Enter ISBN"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={formData.edition}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        edition: e.target.value,
                      }))
                    }
                    placeholder="Enter edition"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Price and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MRP (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, mrp: e.target.value }))
                    }
                    placeholder="Enter MRP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Physical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        weight: e.target.value,
                      }))
                    }
                    placeholder="e.g., 500g, 1.2kg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimension
                  </label>
                  <input
                    type="text"
                    value={formData.dimension}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dimension: e.target.value,
                      }))
                    }
                    placeholder="e.g., 25cm x 18cm x 2cm"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={formData.short_description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        short_description: e.target.value,
                      }))
                    }
                    placeholder="Brief product description (1-2 lines)"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Detailed product description"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Information
                  </label>
                  <textarea
                    value={formData.delivery_information}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        delivery_information: e.target.value,
                      }))
                    }
                    placeholder="Delivery terms, estimated time, etc."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Returns Information
                  </label>
                  <textarea
                    value={formData.returns_information}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        returns_information: e.target.value,
                      }))
                    }
                    placeholder="Return policy, conditions, etc."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Bulk Pricing */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="enable_bulk_pricing"
                    checked={formData.enable_bulk_pricing}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enable_bulk_pricing: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="enable_bulk_pricing"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enable Bulk Pricing
                  </label>
                </div>

                {formData.enable_bulk_pricing && (
                  <div className="space-y-3">
                    {formData.bulk_pricing.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) =>
                            updateBulkPricing(index, "quantity", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) =>
                            updateBulkPricing(index, "price", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeBulkPricing(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addBulkPricing}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Bulk Pricing Tier
                    </button>
                  </div>
                )}
              </div>

              {/* Discount Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Discount Settings
                </h3>
                <div className="space-y-3">
                  {/* Use Category Discount */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="use_category_discount"
                      checked={formData.use_category_discount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          use_category_discount: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="use_category_discount"
                      className="text-sm font-medium text-gray-700"
                    >
                      Use Category Discount (if available)
                    </label>
                  </div>

                  {/* Product Own Discount */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="has_own_discount"
                      checked={formData.has_own_discount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          has_own_discount: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="has_own_discount"
                      className="text-sm font-medium text-gray-700"
                    >
                      Product Has Own Discount
                    </label>
                  </div>

                  {formData.has_own_discount && (
                    <div className="ml-7 w-64">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.own_discount_percentage}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            own_discount_percentage: e.target.value,
                          }))
                        }
                        placeholder="Enter discount percentage"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Product discount will be applied in addition to category
                        discount (if both are enabled)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add a tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(e.target.value.trim());
                          e.target.value = "";
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    />
                    <Tag className="w-5 h-5 text-gray-400" />
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
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
                  disabled={
                    loading ||
                    !formData.name.trim()
                  }
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    formData.name.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
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

        {/* Products Table */}
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
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-80"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Sub-Category & Classes
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Price & Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {product.main_image ? (
                          <img
                            src={product.main_image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {product.name}
                          </h3>
                          {product.author && (
                            <p className="text-sm text-gray-500">
                              by {product.author}
                            </p>
                          )}
                          {product.isbn && (
                            <p className="text-xs text-gray-400">
                              ISBN: {product.isbn}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {product.main_category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {product.sub_categories &&
                          product.sub_categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.sub_categories.map((subCat, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {subCat}
                                </span>
                              ))}
                            </div>
                          )}
                        {product.classes && product.classes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {product.classes.map((className, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {className}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-gray-900">
                            ₹ {product.mrp}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === "In Stock"
                              ? "bg-green-100 text-green-800"
                              : product.status === "Out of Stock"
                              ? "bg-red-100 text-red-800"
                              : product.status === "On Sale"
                              ? "bg-orange-100 text-orange-800"
                              : product.status === "Featured"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {product.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 space-y-1">
                        {product.edition && (
                          <div>Edition: {product.edition}</div>
                        )}
                        {product.weight && <div>Weight: {product.weight}</div>}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {product.tags.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{product.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCloneProduct(product)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Clone product"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            openDeleteModal(product.id, product.name)
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No products found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first product"}
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
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Product
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
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
