export const printReceipt = (billData) => {
    const {
        customerName,
        date,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMode,
        id // Invoice ID if available
    } = billData;

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
        alert("Please allow popups to print receipts.");
        return;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Receipt</title>
        <style>
            body { 
                font-family: 'Courier New', Courier, monospace; 
                width: 80mm; 
                margin: 0; 
                padding: 10px; 
                font-size: 12px;
            }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
            .header p { margin: 2px 0; }
            .info { margin-bottom: 10px; }
            .info div { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
            td { padding: 2px 0; vertical-align: top; }
            .text-right { text-align: right; }
            .totals { border-top: 1px dashed #000; padding-top: 5px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            
            @media print {
                body { width: 100%; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>MY STORE</h2>
            <p>123 Main Street, City</p>
            <p>Tel: +91 98765 43210</p>
        </div>
        
        <div class="info">
            <div><span>Bill No:</span> <span>${id ? id.slice(-6).toUpperCase() : 'N/A'}</span></div>
            <div><span>Date:</span> <span>${new Date(date).toLocaleString()}</span></div>
            <div><span>Customer:</span> <span>${customerName}</span></div>
            <div><span>Pay Mode:</span> <span>${paymentMode}</span></div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 40%">Item</th>
                    <th style="width: 20%" class="text-right">Qty</th>
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

        <div class="totals">
            <div><span>Subtotal:</span> <span>${parseFloat(subtotal).toFixed(2)}</span></div>
            ${tax > 0 ? `<div><span>Tax:</span> <span>${parseFloat(tax).toFixed(2)}</span></div>` : ''}
            ${discount > 0 ? `<div><span>Discount:</span> <span>-${parseFloat(discount).toFixed(2)}</span></div>` : ''}
            <div class="grand-total">
                <span>TOTAL:</span>
                <span>₹${parseFloat(total).toFixed(2)}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>Please visit again.</p>
        </div>

        <script>
            window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); }
            }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
