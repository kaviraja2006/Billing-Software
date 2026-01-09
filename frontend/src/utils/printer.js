export const printReceipt = (billData, format = '80mm', storeSettings = {}) => {
    const {
        customerName,
        date,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMode,
        id
    } = billData;

    // Default store settings if not provided
    const store = {
        name: storeSettings.name || 'MY STORE',
        address: storeSettings.address || '123 Main Street, City',
        contact: storeSettings.contact || '+91 98765 43210',
        email: storeSettings.email || '',
        website: storeSettings.website || '',
        footer: storeSettings.footer || 'Thank you for shopping with us!'
    };

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
        alert("Please allow popups to print receipts.");
        return;
    }

    // --- Format Configurations ---
    const isThermal = ['80mm', '58mm', '112mm'].includes(format);

    // Widths
    const widths = {
        '80mm': '80mm',
        '58mm': '58mm',
        '112mm': '112mm',
        'A4': '210mm',
        'A5': '148mm'
    };
    const bodyWidth = widths[format] || '80mm';

    // Font Sizes
    const fontSize = format === '58mm' ? '10px' : format === '112mm' ? '14px' : '12px';
    const headerSize = format === '58mm' ? '14px' : '16px';

    // Margins/Padding
    const padding = isThermal ? '5px 0' : '20px'; // Less padding for thermal

    // CSS Styles
    const styles = `
        body { 
            font-family: ${isThermal ? "'Courier New', Courier, monospace" : "'Inter', Helvetica, Arial, sans-serif"};
            width: ${bodyWidth};
            margin: 0 auto;
            padding: ${isThermal ? '10px' : '20px'};
            font-size: ${fontSize};
            background: white;
            color: black;
        }
        
        /* Thermal Specifics */
        .thermal-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
        .thermal-items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .thermal-items th { text-align: left; border-bottom: 1px dashed #000; padding: 2px 0; }
        .thermal-items td { padding: 2px 0; vertical-align: top; }
        .thermal-totals { border-top: 1px dashed #000; padding-top: 5px; }
        .thermal-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        
        /* Sheet (A4/A5) Specifics */
        .sheet-header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .sheet-title { font-size: 24px; font-weight: bold; color: #1E3A8A; }
        .sheet-grid { display: flex; gap: 20px; margin-bottom: 20px; }
        .sheet-col { flex: 1; }
        .sheet-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .sheet-table th { background: #F1F5F9; padding: 10px; text-align: left; font-weight: bold; border-bottom: 1px solid #CBD5E1; }
        .sheet-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .sheet-totals { float: right; width: 40%; }
        .sheet-total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .sheet-total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 5px; color: #1E3A8A; }
        
        /* Utilities */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .mb-2 { margin-bottom: 5px; }
        .uppercase { text-transform: uppercase; }
        
        @media print {
            body { 
                width: 100%; 
                padding: 0;
            }
            @page {
                size: ${isThermal ? 'auto' : format + ' portrait'};
                margin: ${isThermal ? '0mm' : '10mm'};
            }
        }
    `;

    // --- Content Generation ---
    let bodyContent = '';

    if (isThermal) {
        // --- THERMAL LAYOUT ---
        bodyContent = `
            <div class="thermal-header">
                <h2 style="font-size: ${headerSize}; margin: 0;">${store.name}</h2>
                <p style="margin: 2px 0;">${store.address}</p>
                <p style="margin: 2px 0;">Tel: ${store.contact}</p>
            </div>
            
            <div style="margin-bottom: 10px;">
                <div class="thermal-row"><span>Bill No:</span> <span>${id ? id.slice(-6).toUpperCase() : 'N/A'}</span></div>
                <div class="thermal-row"><span>Date:</span> <span>${new Date(date).toLocaleString()}</span></div>
                <div class="thermal-row"><span>Customer:</span> <span>${customerName}</span></div>
            </div>

            <table class="thermal-items">
                <thead>
                    <tr>
                        <th style="width: 45%">Item</th>
                        <th style="width: 15%" class="text-right">Qty</th>
                        <th style="width: 20%" class="text-right">Price</th>
                        <th style="width: 20%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${parseFloat(item.price).toFixed(2)}</td>
                        <td class="text-right">${parseFloat(item.total).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="thermal-totals">
                <div class="thermal-row"><span>Subtotal:</span> <span>${parseFloat(subtotal).toFixed(2)}</span></div>
                ${tax > 0 ? `<div class="thermal-row"><span>Tax:</span> <span>${parseFloat(tax).toFixed(2)}</span></div>` : ''}
                ${discount > 0 ? `<div class="thermal-row"><span>Discount:</span> <span>-${parseFloat(discount).toFixed(2)}</span></div>` : ''}
                <div class="thermal-row" style="font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px;">
                    <span>TOTAL:</span>
                    <span>₹${parseFloat(total).toFixed(2)}</span>
                </div>
            </div>

            <div class="text-center" style="margin-top: 20px; font-size: 10px;">
                <p>${store.footer}</p>
                <p style="color: #ccc; font-size: 8px;">Debug: ${JSON.stringify(store)}</p>
            </div>
        `;
    } else {
        // --- SHEET LAYOUT (A4 / A5) ---
        bodyContent = `
            <div class="sheet-header">
                <div>
                    <h1 class="sheet-title">${store.name}</h1>
                    <p>${store.address}</p>
                    <p>Phone: ${store.contact}</p>
                    ${store.email ? `<p>Email: ${store.email}</p>` : ''}
                    ${store.website ? `<p>Web: ${store.website}</p>` : ''}
                </div>
                <div class="text-right">
                    <h2 class="uppercase" style="color: #64748B;">Invoice</h2>
                    <p class="font-bold">#${id ? id.slice(-8).toUpperCase() : 'N/A'}</p>
                    <p>Date: ${new Date(date).toLocaleDateString()}</p>
                    <p>Time: ${new Date(date).toLocaleTimeString()}</p>
                </div>
            </div>

            <div class="sheet-grid">
                <div class="sheet-col">
                    <h3 class="font-bold mb-2 uppercase" style="font-size: 12px; color: #64748B;">Bill To:</h3>
                    <p class="font-bold" style="font-size: 16px;">${customerName}</p>
                    <p>Payment Mode: ${paymentMode}</p>
                </div>
            </div>

            <table class="sheet-table">
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 45%">Item Description</th>
                        <th style="width: 15%" class="text-right">Quantity</th>
                        <th style="width: 15%" class="text-right">Unit Price</th>
                        <th style="width: 20%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <div class="font-bold">${item.name}</div>
                            ${item.sku ? `<div style="font-size: 10px; color: #64748B;">SKU: ${item.sku}</div>` : ''}
                        </td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">₹${parseFloat(item.price).toFixed(2)}</td>
                        <td class="text-right font-bold">₹${parseFloat(item.total).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end;">
                <div class="sheet-totals">
                    <div class="sheet-total-row">
                        <span>Subtotal:</span>
                        <span>₹${parseFloat(subtotal).toFixed(2)}</span>
                    </div>
                    ${tax > 0 ? `
                    <div class="sheet-total-row">
                        <span>Tax:</span>
                        <span>₹${parseFloat(tax).toFixed(2)}</span>
                    </div>` : ''}
                    ${discount > 0 ? `
                    <div class="sheet-total-row" style="color: #DC2626;">
                        <span>Discount:</span>
                        <span>-₹${parseFloat(discount).toFixed(2)}</span>
                    </div>` : ''}
                    <div class="sheet-total-row sheet-total-final">
                        <span>Grand Total:</span>
                        <span>₹${parseFloat(total).toFixed(2)}</span>
                    </div>
                    <div class="sheet-total-row" style="font-size: 12px; color: #64748B; margin-top: 10px;">
                        <span>Amount in words:</span>
                        <span>${amountToWords(total)} Only</span>
                    </div>
                </div>
            </div>

            <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #64748B;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p class="font-bold">Terms & Conditions:</p>
                        <ul style="padding-left: 20px; margin: 5px 0;">
                            <li>Goods once sold will not be taken back.</li>
                            <li>Interest @24% will be charged if bill is not paid within 30 days.</li>
                            <li>Subject to local jurisdiction.</li>
                        </ul>
                    </div>
                    <div class="text-center" style="margin-top: 20px;">
                        <p style="margin-bottom: 30px;">For ${store.name}</p>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
                <div class="text-center" style="margin-top: 20px;">
                     <p>${store.footer}</p>
                     <p style="color: #ccc; font-size: 8px;">Debug: ${JSON.stringify(store)}</p>
                </div>
            </div>
        `;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Receipt</title>
        <style>
            ${styles}
        </style>
    </head>
    <body>
        ${bodyContent}
        <script>
            window.onload = function() {
                window.print();
                // window.onafterprint = function() { window.close(); } // Keep open for debugging or multiple prints
            }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

// Helper for A4/A5 visual polish
const amountToWords = (amount) => {
    // Simple mock for now, can use 'number-to-words' library if installed
    return "Rupees " + Math.round(amount) + "";
};
