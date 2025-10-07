import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSide, setUploadingSide] = useState(false);

  const CLOUD_NAME = "dkxxa3xt0"; // Cloudinary cloud name
  const UPLOAD_PRESET = "unsigned_preset"; // Cloudinary unsigned preset

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(main_category_name)");
    if (error) console.error(error);
    else setProducts(data);
  }

  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) console.error(error);
    else setCategories(data);
  }

  async function saveProduct(e) {
    e.preventDefault();
    if (!form.image) return alert("Please upload a main image first!");

    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      type: form.type,
      old_price: form.oldPrice,
      current_price: form.currentPrice,
      discount: form.discount,
      stock: form.stock,
      description: form.description,
      image: form.image, // main image
      side_images: form.sideImages || [], // side images
      video: form.video,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      safety: form.safety,
      how_to_use: form.howToUse
        ? form.howToUse.split(",").map((t) => t.trim())
        : [],
      rating: form.rating,
      weight: form.weight,
      package_contents: form.packageContents
        ? form.packageContents.split(",").map((t) => t.trim())
        : [],
      popular: form.popular || false,
      new_arrival: form.newArrival || false,
      year: form.year,
      cracker_type: form.crackerType,
    };

    try {
      if (editing) {
        await supabase.from("products").update(payload).eq("id", editing);
      } else {
        await supabase.from("products").insert([payload]);
      }
      setForm({});
      setEditing(null);
      fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save product. Check console.");
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  }

  // Upload handler for main or side images
  async function handleImageUpload(e, type = "main") {
    const files = type === "side" ? e.target.files : [e.target.files[0]];
    if (!files.length) return;

    type === "main" ? setUploadingMain(true) : setUploadingSide(true);

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        if (!res.ok) throw new Error("Upload failed: " + res.statusText);
        const data = await res.json();

        if (type === "main") {
          setForm((prev) => ({ ...prev, image: data.secure_url }));
        } else {
          // limit to 3 side images
          setForm((prev) => ({
            ...prev,
            sideImages: [
              ...(prev.sideImages || []).slice(0, 2),
              data.secure_url,
            ],
          }));
        }
      } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        alert("Image upload failed, check console for details");
      } finally {
        type === "main" ? setUploadingMain(false) : setUploadingSide(false);
      }
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Products</h1>

      {/* Product Form */}
      <form onSubmit={saveProduct} className="grid gap-2 mb-6">
        <input
          placeholder="Name"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
        />

        {/* Main Image */}
        <label>Main Image:</label>
        <input type="file" onChange={(e) => handleImageUpload(e, "main")} />
        {uploadingMain && <p>Uploading main image...</p>}
        {form.image && (
          <img
            src={form.image}
            alt="preview"
            className="w-20 h-20 object-cover mt-2"
          />
        )}

        {/* Side Images */}
        <label>Side Images (up to 3):</label>
        <input
          type="file"
          multiple
          onChange={(e) => handleImageUpload(e, "side")}
        />
        {uploadingSide && <p>Uploading side images...</p>}
        <div className="flex gap-2 mt-2">
          {(form.sideImages || []).map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`side-${i}`}
              className="w-16 h-16 object-cover border"
            />
          ))}
        </div>

        {/* Category */}
        <select
          value={form.category_id || ""}
          onChange={(e) =>
            setForm({ ...form, category_id: Number(e.target.value) })
          }
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select Category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Rest of your inputs */}
        <input
          placeholder="Type"
          value={form.type || ""}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Old Price"
          type="number"
          value={form.oldPrice || ""}
          onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Current Price"
          type="number"
          value={form.currentPrice || ""}
          onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Discount (%)"
          type="number"
          value={form.discount || ""}
          onChange={(e) => setForm({ ...form, discount: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Stock"
          type="number"
          value={form.stock || ""}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Video URL"
          value={form.video || ""}
          onChange={(e) => setForm({ ...form, video: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Tags (comma separated)"
          value={form.tags || ""}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="Safety Instructions"
          value={form.safety || ""}
          onChange={(e) => setForm({ ...form, safety: e.target.value })}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="How To Use (comma separated)"
          value={form.howToUse || ""}
          onChange={(e) => setForm({ ...form, howToUse: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Rating"
          type="number"
          step="0.1"
          value={form.rating || ""}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Weight"
          value={form.weight || ""}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Package Contents (comma separated)"
          value={form.packageContents || ""}
          onChange={(e) =>
            setForm({ ...form, packageContents: e.target.value })
          }
          className="border p-2 rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.popular || false}
            onChange={(e) => setForm({ ...form, popular: e.target.checked })}
          />
          Popular
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.newArrival || false}
            onChange={(e) => setForm({ ...form, newArrival: e.target.checked })}
          />
          New Arrival
        </label>

        <input
          placeholder="Year"
          type="number"
          value={form.year || ""}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Cracker Type (day/night)"
          value={form.crackerType || ""}
          onChange={(e) => setForm({ ...form, crackerType: e.target.value })}
          className="border p-2 rounded"
        />

        <button className="bg-green-500 text-white px-3 py-1 rounded">
          {editing ? "Update" : "Add"} Product
        </button>
      </form>

      {/* Product List */}
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Main</th>
            <th className="border p-2">Side Images</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border">
              <td className="border p-2">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  "No Image"
                )}
              </td>
              <td className="border p-2 flex gap-1">
                {(p.side_images || []).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`side-${i}`}
                    className="h-10 w-10 object-cover"
                  />
                ))}
              </td>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">
                {p.categories ? p.categories.main_category_name : p.category_id}
              </td>
              <td className="border p-2">₹{p.current_price}</td>
              <td className="border p-2">{p.stock}</td>
              <td className="border p-2">
                <button
                  onClick={() => {
                    setForm({
                      ...p,
                      oldPrice: p.old_price,
                      currentPrice: p.current_price,
                      packageContents: p.package_contents?.join(","),
                      tags: p.tags?.join(","),
                      howToUse: p.how_to_use?.join(","),
                      sideImages: p.side_images || [],
                    });
                    setEditing(p.id);
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
