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

  const [shippingSettings, setShippingSettings] = useState({
    shipping_charge: 0,
    free_delivery_threshold: 0,
    shipping_enabled: true,
  });

  useEffect(() => {
    fetchGlobalSettings();
    fetchShippingSettings();
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

  // Fetch shipping settings from separate table
  const fetchShippingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching shipping settings:", error);
        // Use default settings if fetch fails
      } else if (data) {
        setShippingSettings({
          shipping_charge: data.shipping_charge || 0,
          free_delivery_threshold: data.free_delivery_threshold || 0,
          shipping_enabled: data.shipping_enabled ?? true,
        });
      }
    } catch (err) {
      console.error("Error fetching shipping settings:", err);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate shipping settings if enabled
    if (shippingSettings.shipping_enabled) {
      if (shippingSettings.shipping_charge < 0) {
        toast.error("Shipping charge cannot be negative");
        return;
      }
      if (shippingSettings.free_delivery_threshold < 0) {
        toast.error("Free delivery threshold cannot be negative");
        return;
      }
    }

    setSaving(true);
    try {
      // Update categories table (delivery/returns info)
      const { error: categoriesError } = await supabase
        .from("categories")
        .update({
          global_delivery_info: settings.global_delivery_info.trim() || null,
          global_returns_info: settings.global_returns_info.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("main_category_name", "SYSTEM_GLOBAL_SETTINGS");

      if (categoriesError) throw categoriesError;

      // Update shipping_settings table (target the first/only row)
      const { error: shippingError } = await supabase
        .from("shipping_settings")
        .update({
          shipping_charge: shippingSettings.shipping_charge,
          free_delivery_threshold: shippingSettings.free_delivery_threshold,
          shipping_enabled: shippingSettings.shipping_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      if (shippingError) throw shippingError;

      toast.success("Global settings updated successfully!");
    } catch (err) {
      console.error("Error updating global settings:", err);
      toast.error("Failed to update settings: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes for global settings
  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle input changes for shipping settings
  const handleShippingChange = (field, value) => {
    setShippingSettings(prev => ({
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

            {/* Shipping Configuration Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Shipping & Delivery Configuration
              </h3>

              {/* Enable Shipping Toggle */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Enable Shipping Charges</h4>
                  <p className="text-sm text-gray-500">Toggle to enable/disable shipping charges sitewide</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingSettings.shipping_enabled}
                    onChange={(e) => handleShippingChange("shipping_enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {shippingSettings.shipping_enabled && (
                <>
                  {/* Shipping Charge */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Standard Shipping Charge (₹)
                      </label>
                      <input
                        type="number"
                        value={shippingSettings.shipping_charge}
                        onChange={(e) => handleShippingChange("shipping_charge", parseFloat(e.target.value) || 0)}
                        placeholder="Enter shipping charge"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Amount charged for standard delivery
                      </p>
                    </div>

                    {/* Free Delivery Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Delivery Threshold (₹)
                      </label>
                      <input
                        type="number"
                        value={shippingSettings.free_delivery_threshold}
                        onChange={(e) => handleShippingChange("free_delivery_threshold", parseFloat(e.target.value) || 0)}
                        placeholder="Enter minimum order value"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Orders above this amount get free delivery
                      </p>
                    </div>
                  </div>

                  {/* Shipping Logic Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Shipping Logic Preview</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• Orders below ₹{shippingSettings.free_delivery_threshold}: <strong>₹{shippingSettings.shipping_charge} shipping charge</strong></p>
                      <p>• Orders ₹{shippingSettings.free_delivery_threshold} and above: <strong>FREE delivery</strong></p>
                      {shippingSettings.free_delivery_threshold === 0 && (
                        <p className="text-amber-700">⚠️ With threshold at ₹0, all orders will have free delivery</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {!shippingSettings.shipping_enabled && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    🚫 Shipping charges are disabled. All orders will have free delivery.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  fetchGlobalSettings();
                  fetchShippingSettings();
                }}
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