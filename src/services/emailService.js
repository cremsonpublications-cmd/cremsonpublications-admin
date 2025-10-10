// Order Update Email Service for Admin Panel
export const sendOrderUpdateEmail = async (orderData) => {
  try {
    // Brevo API key from environment variables
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
    
    // Email configuration - direct values
    const SENDER_EMAIL = "cremsonpublications@gmail.com";
    const SENDER_NAME = 'Cremson Publications';
    const ADMIN_EMAIL = "Info@cremsonpublications.com";
    
    // Check if API key is configured
    if (!BREVO_API_KEY) {
      throw new Error('VITE_BREVO_API_KEY is not configured in environment variables');
    }
    
    // Create HTML email template for order update
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #667eea; }
          .address { background: #e8f2ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .status-update { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          .logo { font-size: 24px; font-weight: bold; }
          .tracking { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 CREMSON PUBLICATIONS</div>
            <h1>Order Update</h1>
            <p>Your order has been updated, ${orderData.customerName}!</p>
          </div>
          
          <div class="content">
            <div class="status-update">
              <h3 style="color: #155724; margin: 0;">Order Status Update</h3>
              <p style="margin: 10px 0 0 0; color: #155724;">
                <strong>Order ID:</strong> ${orderData.orderId}<br>
                <strong>New Status:</strong> ${orderData.deliveryStatus}<br>
                <strong>Updated on:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>

            ${orderData.trackingId ? `
            <div class="tracking">
              <h3 style="color: #856404; margin: 0;">📦 Tracking Information</h3>
              <p style="margin: 10px 0 0 0; color: #856404;">
                <strong>Tracking ID:</strong> ${orderData.trackingId}<br>
                ${orderData.courier ? `<strong>Courier:</strong> ${orderData.courier}<br>` : ''}
                ${orderData.trackingUrl ? `<strong>Track Package:</strong> <a href="${orderData.trackingUrl}" target="_blank">Click here to track</a><br>` : ''}
                ${orderData.expectedDate ? `<strong>Expected Delivery:</strong> ${new Date(orderData.expectedDate).toLocaleDateString()}` : ''}
              </p>
            </div>
            ` : ''}
            
            <h2>Order Details</h2>
            <div class="order-details">
              <p><strong>Order ID:</strong> ${orderData.orderId}</p>
              <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
              
              <h3>Items Ordered:</h3>
              ${orderData.items.map(item => `
                <div class="item">
                  <span>${item.name} (Qty: ${item.quantity})</span>
                  <span>₹${item.totalPrice}</span>
                </div>
              `).join('')}
              
              <div class="item total">
                <span>Total Amount:</span>
                <span>₹${orderData.totalAmount}</span>
              </div>
            </div>
            
            <h3>Shipping Address:</h3>
            <div class="address">
              <strong>${orderData.shippingAddress.name}</strong><br>
              ${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.pincode}<br>
              Phone: ${orderData.shippingAddress.phone}
            </div>
            
            <div class="footer">
              <p><strong>Contact Us:</strong></p>
              <p>📞 011-4578594 | 📱 +91 79826 45175</p>
              <p>📧 info@cremsonpublications.com</p>
              <p>📍 4578/15 (Basement), Aggarwal Road, Opp. Happy School, Darya Ganj, New Delhi – 110002</p>
              <p style="margin-top: 20px; color: #999;">
                Thank you for choosing Cremson Publications for your educational needs!
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { 
          name: SENDER_NAME, 
          email: SENDER_EMAIL 
        },
        to: [
          { email: orderData.customerEmail, name: orderData.customerName },
          { email: ADMIN_EMAIL, name: "Cremson Publications Admin" }
        ],
        subject: `Order Update #${orderData.orderId} - ${orderData.deliveryStatus} - Cremson Publications`,
        htmlContent: htmlContent,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Order update email sent successfully:', data);
      return { success: true, data };
    } else {
      console.error('Error sending order update email:', data);
      return { success: false, error: data.error || 'Failed to send order update email' };
    }
  } catch (error) {
    console.error('Order update email service error:', error);
    return { success: false, error: error.message };
  }
};
