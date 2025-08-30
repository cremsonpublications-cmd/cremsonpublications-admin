import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const CLOUD_NAME = "dkxxa3xt0"; // Cloudinary cloud name
  const UPLOAD_PRESET = "unsigned_preset"; // Cloudinary unsigned preset

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }

  async function handleSave() {
    if (!name) return alert("Category name is required!");

    const payload = { name, image: image || null };

    try {
      if (editingId) {
        await supabase.from("categories").update(payload).eq("id", editingId);
      } else {
        await supabase.from("categories").insert([payload]);
      }
      setName("");
      setImage("");
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Failed to save category");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
  }

  // Cloudinary image upload
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
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
      setImage(data.secure_url);
    } catch (err) {
      console.error(err);
      alert("Image upload failed, check console");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Manage Categories</h2>

      {/* Category Form */}
      <div className="flex gap-2 mb-4 items-center">
        <input
          className="border p-2 rounded flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
        />

        <input type="file" onChange={handleImageUpload} />
        {uploading && <span>Uploading...</span>}
        {image && (
          <img
            src={image}
            alt="preview"
            className="w-16 h-16 object-cover border"
          />
        )}

        <button
          className="bg-blue-500 text-white px-4 rounded"
          onClick={handleSave}
        >
          {editingId ? "Update" : "Add"}
        </button>
      </div>

      {/* Categories List */}
      <ul>
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex justify-between items-center p-2 border-b"
          >
            <div className="flex items-center gap-2">
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-12 h-12 object-cover border"
                />
              )}
              <span>{cat.name}</span>
            </div>

            <div className="flex gap-2">
              <button
                className="text-sm text-yellow-600"
                onClick={() => {
                  setName(cat.name);
                  setImage(cat.image || "");
                  setEditingId(cat.id);
                }}
              >
                Edit
              </button>
              <button
                className="text-sm text-red-600"
                onClick={() => handleDelete(cat.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
