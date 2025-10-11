import { Link, Outlet } from "react-router-dom";

export default function AdminPanel() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <nav className="flex gap-4">
        <Link to="categories" className="text-blue-600">
          Categories
        </Link>
        <Link to="products" className="text-blue-600">
          Products
        </Link>
        <Link to="orders" className="text-blue-600">
          Orders
        </Link>
        <Link to="reviews" className="text-blue-600">
          Reviews
        </Link>
        <Link to="revenue" className="text-blue-600">
          Revenue
        </Link>
      </nav>

      {/* 👇 This is where the child route loads */}
      <Outlet />
    </div>
  );
}
