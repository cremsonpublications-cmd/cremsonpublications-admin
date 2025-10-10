# Install jsPDF for PDF Generation

To enable the shipping label download functionality, you need to install the jsPDF library.

## Installation

Run the following command in the admin project directory:

```bash
npm install jspdf
```

## Usage

The PDF generation service is already implemented in:
- `/src/services/pdfService.js` - PDF generation logic
- `/src/containers/Admin/AdminOrders.jsx` - Download functionality

## Features

- **A4 Format Shipping Labels**: Professional shipping labels in A4 format
- **Company Branding**: Includes Cremson Publications branding and contact info
- **Order Details**: Shows order ID, date, customer info, and items
- **Download Button**: Green download icon in the orders table
- **Automatic Filename**: Generated with order ID and date

## File Structure

```
cremsonpublications-admin/
├── src/
│   ├── services/
│   │   └── pdfService.js          # PDF generation service
│   └── containers/Admin/
│       └── AdminOrders.jsx        # Orders management with download
```

## PDF Content

The generated PDF includes:
- Date and Order Number
- Customer Name and Address
- Contact Information
- Order Items with Quantities
- Company Information (FROM section)
- Professional formatting matching the provided sample
