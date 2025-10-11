import React, { useState, useEffect } from "react";
import { Save, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import Loader from "./Loader";

export default function GlobalSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    global_delivery_info: "",
    global_returns_info: "",
  });

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  // Fetch global settings from database
  const fetchGlobalSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("global_delivery_info, global_returns_info")
        .eq("main_category_name", "SYSTEM_GLOBAL_SETTINGS")
        .single();

      if (error) {
        console.error("Error fetching global settings:", error);
        toast.error("Failed to load global settings");
        return;
      }

      if (data) {
        setSettings({
          global_delivery_info: data.global_delivery_info || "",
          global_returns_info: data.global_returns_info || "",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load global settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!settings.global_delivery_info.trim() && !settings.global_returns_info.trim()) {
      toast.error("Please enter at least one of the settings");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          global_delivery_info: settings.global_delivery_info.trim() || null,
          global_returns_info: settings.global_returns_info.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("main_category_name", "SYSTEM_GLOBAL_SETTINGS");

      if (error) throw error;

      toast.success("Global settings updated successfully!");
    } catch (err) {
      console.error("Error updating global settings:", err);
      toast.error("Failed to update settings: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {loading && <Loader message="Loading global settings..." />}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
              <p className="text-gray-600">
                Manage delivery and returns information that applies across all products
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                How Global Settings Work
              </h3>
              <p className="text-sm text-amber-700">
                These settings will be used as default values when creating new products.
                Individual products can still override these with their own custom information.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Global Delivery Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <span>Global Delivery Information</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </label>
              <textarea
                value={settings.global_delivery_info}
                onChange={(e) => handleInputChange("global_delivery_info", e.target.value)}
                placeholder="Enter default delivery information for all products..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-2">
                This information will appear in the delivery section of all product pages (unless overridden)
              </p>
            </div>

            {/* Global Returns Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <span>Global Returns Information</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </label>
              <textarea
                value={settings.global_returns_info}
                onChange={(e) => handleInputChange("global_returns_info", e.target.value)}
                placeholder="Enter default returns policy for all products..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-2">
                This information will appear in the returns section of all product pages (unless overridden)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => fetchGlobalSettings()}
                disabled={saving}
                className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  saving || loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-100 rounded">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Next Steps
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• New products will automatically use these default values</li>
                <li>• Existing products remain unchanged</li>
                <li>• You can still customize delivery/returns info for individual products</li>
                <li>• Changes here will affect all future products created</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}