// PDF Generation Service for Shipping Labels
import jsPDF from 'jspdf';

export const generateShippingLabel = (orderData) => {
  try {
    // Create new PDF document in A4 format
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // A4 dimensions: 210mm x 297mm
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Set font
    pdf.setFont('helvetica');
    
    // Header section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    
    // Date and Order Number (top right)
    const currentDate = new Date().toLocaleDateString('en-GB');
    pdf.text(`DATE: ${currentDate}`, pageWidth - 60, 20);
    pdf.text(`Order No: #${orderData.order_id}`, 20, 30);
    
    // Title
    pdf.setFontSize(14);
    pdf.text('PRINTED BOOKS(ORDER)', 20, 45);
    pdf.text('REGD.', pageWidth - 30, 45);
    
    // TO Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TO', 20, 65);
    
    // Customer Details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    let yPosition = 80;
    
    // Customer Name
    pdf.setFont('helvetica', 'bold');
    pdf.text(orderData.user_info?.name || 'Customer Name', 30, yPosition);
    yPosition += 10;
    
    // Address
    pdf.setFont('helvetica', 'normal');
    pdf.text('Address:-', 30, yPosition);
    yPosition += 8;
    
    // Street Address
    if (orderData.user_info?.address?.street) {
      const streetText = pdf.splitTextToSize(orderData.user_info.address.street, 150);
      pdf.text(streetText, 30, yPosition);
      yPosition += streetText.length * 6;
    }
    
    // City, State, Pincode
    const locationText = `${orderData.user_info?.address?.city || ''}, ${orderData.user_info?.address?.state || ''} - ${orderData.user_info?.address?.pincode || ''}`;
    pdf.text(locationText, 30, yPosition);
    yPosition += 8;
    
    // Pin Code (separate line)
    pdf.text(`Pin Code:- ${orderData.user_info?.address?.pincode || ''}`, 30, yPosition);
    yPosition += 8;
    
    // Contact Number
    pdf.text(`Contact No:- ${orderData.user_info?.phone || ''}`, 30, yPosition);
    yPosition += 10;
    
    // Order Items
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach((item, index) => {
        pdf.text(`Quantity:- ${item.quantity}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Subject:- ${item.name}`, 30, yPosition);
        yPosition += 8;
      });
    }
    
    // FROM Section
    yPosition += 15;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FROM:-', 20, yPosition);
    yPosition += 10;
    
    // Company Details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CREMSON PUBLICATIONS', 20, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('4578/15, (Basement) Aggarwal Road,', 20, yPosition);
    yPosition += 6;
    pdf.text('Opp. Happy School, Ansari Road', 20, yPosition);
    yPosition += 6;
    pdf.text('Daryaganj, New Delhi-110002', 20, yPosition);
    yPosition += 10;
    
    pdf.text('Email:-info@cremsonpublications.com', 20, yPosition);
    yPosition += 6;
    pdf.text('PH:-011-45785945', 20, yPosition);
    
    // Add border around the content
    pdf.setLineWidth(0.5);
    pdf.rect(15, 15, pageWidth - 30, yPosition - 5);
    
    // Generate filename with order ID and date
    const filename = `shipping_label_${orderData.order_id}_${currentDate.replace(/\//g, '-')}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('Error generating shipping label PDF:', error);
    return { success: false, error: error.message };
  }
};

// Alternative function for generating multiple labels on one page
export const generateBulkShippingLabels = (ordersData) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    
    let currentY = 20;
    const labelHeight = 120; // Height for each label
    
    ordersData.forEach((orderData, index) => {
      // Check if we need a new page
      if (currentY + labelHeight > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Generate individual label at current position
      generateSingleLabelAt(pdf, orderData, 15, currentY, pageWidth - 30, labelHeight);
      
      currentY += labelHeight + 10; // Add spacing between labels
    });
    
    const filename = `bulk_shipping_labels_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
    pdf.save(filename);
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('Error generating bulk shipping labels:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to generate a single label at specific position
const generateSingleLabelAt = (pdf, orderData, x, y, width, height) => {
  const startY = y;
  
  // Draw border
  pdf.setLineWidth(0.5);
  pdf.rect(x, y, width, height);
  
  // Header
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  
  const currentDate = new Date().toLocaleDateString('en-GB');
  pdf.text(`DATE: ${currentDate}`, x + width - 40, y + 10);
  pdf.text(`Order No: #${orderData.order_id}`, x + 5, y + 15);
  
  // TO Section
  pdf.setFontSize(12);
  pdf.text('TO', x + 5, y + 25);
  
  // Customer details (compact format)
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  let currentYPos = y + 35;
  pdf.text(orderData.user_info?.name || 'Customer Name', x + 10, currentYPos);
  currentYPos += 6;
  
  if (orderData.user_info?.address?.street) {
    const streetText = pdf.splitTextToSize(orderData.user_info.address.street, width - 20);
    pdf.text(streetText, x + 10, currentYPos);
    currentYPos += streetText.length * 4;
  }
  
  pdf.text(`${orderData.user_info?.address?.city || ''}, ${orderData.user_info?.address?.state || ''} - ${orderData.user_info?.address?.pincode || ''}`, x + 10, currentYPos);
  currentYPos += 6;
  pdf.text(`Phone: ${orderData.user_info?.phone || ''}`, x + 10, currentYPos);
  
  // FROM section (bottom of label)
  const fromY = y + height - 25;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FROM: CREMSON PUBLICATIONS', x + 5, fromY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('4578/15, Aggarwal Road, Daryaganj, New Delhi-110002', x + 5, fromY + 5);
};
