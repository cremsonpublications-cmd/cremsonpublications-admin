import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";

const LogoutButton = () => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Logged out successfully!");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to logout. Please try again.");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      {/* Logout Button */}
      <button
        onClick={() => setShowConfirmModal(true)}
        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl w-96 relative">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Logout
              </h3>
              <p className="text-gray-600">
                Are you sure you want to logout from the admin panel?
              </p>
              <div className="flex justify-end gap-3 w-full mt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
