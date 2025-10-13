import { supabase } from '../supabaseClient';

/**
 * Fetch current shipping settings from database
 * @returns {Promise<Object>} Shipping configuration object
 */
export const getShippingSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('shipping_charge, free_delivery_threshold, shipping_enabled')
      .eq('main_category_name', 'SYSTEM_GLOBAL_SETTINGS')
      .single();

    if (error) {
      console.error('Error fetching shipping settings:', error);
      // Return default settings if fetch fails
      return {
        shipping_charge: 50,
        free_delivery_threshold: 500,
        shipping_enabled: true
      };
    }

    return {
      shipping_charge: data?.shipping_charge || 50,
      free_delivery_threshold: data?.free_delivery_threshold || 500,
      shipping_enabled: data?.shipping_enabled ?? true
    };
  } catch (err) {
    console.error('Error:', err);
    // Return default settings if error occurs
    return {
      shipping_charge: 50,
      free_delivery_threshold: 500,
      shipping_enabled: true
    };
  }
};

/**
 * Calculate shipping charge for a given order total
 * @param {number} orderTotal - Total order amount
 * @param {Object} shippingSettings - Shipping configuration (optional, will fetch if not provided)
 * @returns {Promise<number>} Shipping charge amount
 */
export const calculateShippingCharge = async (orderTotal, shippingSettings = null) => {
  try {
    // Fetch settings if not provided
    const settings = shippingSettings || await getShippingSettings();

    // If shipping is disabled globally, return 0
    if (!settings.shipping_enabled) {
      return 0;
    }

    // If order total meets free delivery threshold, return 0
    if (orderTotal >= settings.free_delivery_threshold) {
      return 0;
    }

    // Otherwise return the standard shipping charge
    return settings.shipping_charge;
  } catch (err) {
    console.error('Error calculating shipping charge:', err);
    return 0; // Return 0 if error occurs
  }
};

/**
 * Get shipping info text for display
 * @param {number} orderTotal - Current order total
 * @param {Object} shippingSettings - Shipping configuration (optional)
 * @returns {Promise<Object>} Object with shipping charge and info text
 */
export const getShippingInfo = async (orderTotal, shippingSettings = null) => {
  try {
    const settings = shippingSettings || await getShippingSettings();
    const shippingCharge = await calculateShippingCharge(orderTotal, settings);

    let infoText = '';

    if (!settings.shipping_enabled) {
      infoText = '🚚 Free delivery on all orders';
    } else if (shippingCharge === 0) {
      infoText = '🚚 Free delivery (order above ₹' + settings.free_delivery_threshold + ')';
    } else {
      const remaining = settings.free_delivery_threshold - orderTotal;
      infoText = `🚚 ₹${shippingCharge} shipping • Add ₹${remaining.toFixed(2)} more for free delivery`;
    }

    return {
      shippingCharge,
      infoText,
      isFreeDelivery: shippingCharge === 0,
      amountForFreeDelivery: settings.shipping_enabled ?
        Math.max(0, settings.free_delivery_threshold - orderTotal) : 0
    };
  } catch (err) {
    console.error('Error getting shipping info:', err);
    return {
      shippingCharge: 0,
      infoText: '🚚 Free delivery',
      isFreeDelivery: true,
      amountForFreeDelivery: 0
    };
  }
};