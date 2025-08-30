import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function UserShop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  // User info state
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  async function fetchCategories() {
    let { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }

  async function fetchProducts() {
    let { data } = await supabase.from("products").select("*");
    setProducts(data || []);
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  async function placeOrder() {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!userInfo.name || !userInfo.phone || !userInfo.street) {
      return alert("Please fill in your details before placing the order.");
    }

    const items = cart.map((c) => ({
      ...c,
      quantity: c.qty,
      totalPrice: c.current_price * c.qty,
    }));

    const orderSummary = {
      subTotal: items.reduce((sum, p) => sum + p.totalPrice, 0),
      discountTotal: 0,
      deliveryCharge: 40,
    };
    orderSummary.grandTotal =
      orderSummary.subTotal -
      orderSummary.discountTotal +
      orderSummary.deliveryCharge;

    await supabase.from("orders").insert([
      {
        order_id: "ORD" + Date.now(),
        user_info: {
          userId: "USR" + Date.now(),
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          address: {
            street: userInfo.street,
            city: userInfo.city,
            state: userInfo.state,
            pincode: userInfo.pincode,
          },
        },
        items: items,
        order_summary: orderSummary,
        payment: { method: "COD", status: "Pending" },
        delivery: { status: "Pending" },
      },
    ]);

    setCart([]);
    setUserInfo({
      name: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    });

    alert("Order placed successfully!");
  }

  // Apply filters
  const filteredProducts = products.filter((p) => {
    const matchesCategory = filter ? p.category_id === Number(filter) : true;
    const matchesSearch = search
      ? p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.tags &&
          p.tags.some((tag) =>
            tag.toLowerCase().includes(search.toLowerCase())
          )) ||
        (p.type && p.type.toLowerCase().includes(search.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Shop</h1>

      {/* Categories as Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`cursor-pointer border rounded-lg shadow bg-white hover:shadow-lg transition p-2 text-center ${
              filter === c.id ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <img
              src={c.image}
              alt={c.name}
              className="w-full h-24 object-cover rounded"
            />
            <h3 className="mt-2 font-medium">{c.name}</h3>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        className="border p-2 rounded flex-1"
        placeholder="Search by name, type, or tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Products as E-commerce Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="p-4 border rounded-lg bg-white shadow hover:shadow-lg transition flex flex-col"
          >
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-32 object-cover rounded mb-2"
            />
            <h2 className="font-semibold text-sm">{p.name}</h2>
            <p className="text-xs text-gray-500 line-clamp-2">
              {p.description}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-red-600 font-bold">₹{p.current_price}</span>
              {p.old_price && (
                <span className="text-gray-400 text-sm line-through">
                  ₹{p.old_price}
                </span>
              )}
              {p.discount > 0 && (
                <span className="text-green-600 text-xs font-semibold">
                  {p.discount}% OFF
                </span>
              )}
            </div>
            <button
              className="mt-auto px-3 py-1 bg-blue-500 text-white rounded text-sm"
              onClick={() => addToCart(p)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Cart */}
      <div className="p-4 border rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Cart</h2>
        {cart.length === 0 ? (
          <p>No items</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((c) => (
              <li key={c.id}>
                {c.name} x {c.qty} = ₹{c.current_price * c.qty}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User Info Form */}
      <div className="p-4 border rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Your Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Full Name"
            className="border p-2 rounded"
            value={userInfo.name}
            onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={userInfo.email}
            onChange={(e) =>
              setUserInfo({ ...userInfo, email: e.target.value })
            }
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="border p-2 rounded"
            value={userInfo.phone}
            onChange={(e) =>
              setUserInfo({ ...userInfo, phone: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Street Address"
            className="border p-2 rounded"
            value={userInfo.street}
            onChange={(e) =>
              setUserInfo({ ...userInfo, street: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="City"
            className="border p-2 rounded"
            value={userInfo.city}
            onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
          />
          <input
            type="text"
            placeholder="State"
            className="border p-2 rounded"
            value={userInfo.state}
            onChange={(e) =>
              setUserInfo({ ...userInfo, state: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Pincode"
            className="border p-2 rounded"
            value={userInfo.pincode}
            onChange={(e) =>
              setUserInfo({ ...userInfo, pincode: e.target.value })
            }
          />
        </div>
      </div>

      {/* Place Order Button */}
      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        onClick={placeOrder}
      >
        Place Order
      </button>
    </div>
  );
}
