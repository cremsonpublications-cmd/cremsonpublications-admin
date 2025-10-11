import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Star,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../../supabaseClient";

// Real API connected to Supabase
const reviewsApi = {
  admin: {
    getAllReviews: async (page = 1, limit = 20, filters = {}) => {
      try {
        let query = supabase.from("reviews").select(
          `
            *,
            review_images (
              id,
              image_url,
              created_at
            )
          `,
          { count: "exact" }
        );

        // Apply filters
        if (filters.rating) {
          query = query.eq("rating", filters.rating);
        }
        if (
          filters.verified_purchase !== undefined &&
          filters.verified_purchase !== ""
        ) {
          query = query.eq(
            "verified_purchase",
            filters.verified_purchase === "true"
          );
        }
        if (filters.search) {
          query = query.or(
            `user_name.ilike.%${filters.search}%,comment.ilike.%${filters.search}%,title.ilike.%${filters.search}%`
          );
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // Order by created_at descending
        query = query.order("created_at", { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          reviews: data || [],
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          currentPage: page,
        };
      } catch (error) {
        console.error("Error fetching all reviews:", error);
        throw error;
      }
    },
    getAdminStats: async () => {
      try {
        const { data: allReviews, error } = await supabase
          .from("reviews")
          .select("rating, created_at, verified_purchase");

        if (error) throw error;

        const totalReviews = allReviews.length;
        const verifiedReviews = allReviews.filter(
          (r) => r.verified_purchase
        ).length;
        const averageRating =
          totalReviews > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        // Reviews in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentReviews = allReviews.filter(
          (r) => new Date(r.created_at) > thirtyDaysAgo
        ).length;

        // Rating distribution
        const ratingDistribution = {
          5: allReviews.filter((r) => r.rating === 5).length,
          4: allReviews.filter((r) => r.rating === 4).length,
          3: allReviews.filter((r) => r.rating === 3).length,
          2: allReviews.filter((r) => r.rating === 2).length,
          1: allReviews.filter((r) => r.rating === 1).length,
        };

        return {
          totalReviews,
          verifiedReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
          recentReviews,
          ratingDistribution,
        };
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
      }
    },
  },
  delete: async (reviewId) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  },
};

const AdminReviews = () => {
  const [allReviews, setAllReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    rating: "",
    verified_purchase: "",
  });

  const reviewsPerPage = 20;

  // Load all reviews and stats only once
  useEffect(() => {
    loadAllReviews();
    loadStats();
  }, []);

  const loadAllReviews = async () => {
    try {
      setLoading(true);
      // Load all reviews without pagination and filters
      const response = await reviewsApi.admin.getAllReviews(1, 1000, {});
      setAllReviews(response.reviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reviewsApi.admin.getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Client-side filtering and pagination
  const filteredReviews = allReviews.filter((review) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        review.user_name?.toLowerCase().includes(searchTerm) ||
        review.comment?.toLowerCase().includes(searchTerm) ||
        review.title?.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // Rating filter
    if (filters.rating && review.rating !== parseInt(filters.rating)) {
      return false;
    }

    // Verified purchase filter
    if (
      filters.verified_purchase !== "" &&
      filters.verified_purchase !== undefined
    ) {
      const isVerified = filters.verified_purchase === "true";
      if (review.verified_purchase !== isVerified) {
        return false;
      }
    }

    return true;
  });

  // Pagination for filtered results
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const reviews = filteredReviews.slice(startIndex, endIndex);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await reviewsApi.delete(reviewId);
      loadAllReviews(); // Refresh the list
      loadStats(); // Refresh stats
      alert("Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      rating: "",
      verified_purchase: "",
    });
    setCurrentPage(1);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reviews Management
          </h1>
          <p className="text-gray-600">View and manage customer reviews</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Reviews
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalReviews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averageRating}/5
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.recentReviews}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage =
                stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star
                      size={14}
                      className="text-yellow-400 fill-yellow-400"
                    />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {count} ({percentage.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange("rating", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Reviews</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Review Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {review.user_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {review.user_name}
                          </span>
                          {review.verified_purchase && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star
                                key={index}
                                size={14}
                                className={`${
                                  index < review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-2">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-gray-700 mb-3">{review.comment}</p>

                    {/* Review Images */}
                    {review.review_images &&
                      review.review_images.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {review.review_images
                            .slice(0, 4)
                            .map((image, index) => (
                              <div
                                key={image.id}
                                className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
                              >
                                <img
                                  src={image.image_url}
                                  alt={`Review ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          {review.review_images.length > 4 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                              +{review.review_images.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                    {/* Review Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>ID: {review.id}</span>
                      {review.user_email && (
                        <span>Email: {review.user_email}</span>
                      )}
                      <span>Helpful: {review.helpful_count || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reviews found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center text-sm text-gray-700">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredReviews.length)} of{" "}
            {filteredReviews.length} filtered reviews
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-4 py-2 text-sm font-medium">{currentPage}</span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
