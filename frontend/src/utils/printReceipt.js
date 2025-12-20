export const printReceipt = (invoice) => {
    if (!invoice) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
        alert('Please allow popups for this site to print receipts.');
        return;
    }

    const parseAmount = (amt) => {
        if (typeof amt === 'number') return amt;
        if (typeof amt === 'string') return parseFloat(amt.replace(/[^0-9.-]+/g, ""));
        return 0;
    };

    // Calculate totals if missing
    const subtotal = invoice.totals?.subtotal || invoice.subtotal || parseAmount(invoice.amount) || 0;
    const tax = invoice.totals?.tax || invoice.tax || 0;
    const total = invoice.amount || (subtotal + tax).toFixed(2);

    // Generate Rows
    const itemsRows = invoice.items && invoice.items.length > 0
        ? invoice.items.map(item => `
            <tr>
                <td style="padding: 5px; border-bottom: 1px dashed #ddd;">${item.name}</td>
                <td style="padding: 5px; border-bottom: 1px dashed #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 5px; border-bottom: 1px dashed #ddd; text-align: right;">${(item.price || 0).toFixed(2)}</td>
                <td style="padding: 5px; border-bottom: 1px dashed #ddd; text-align: right;">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
            </tr>
        `).join('')
        : `<tr><td colspan="4" style="text-align:center; padding: 10px; color: #666;">No item details</td></tr>`;

    const receiptHTML = `
        <html>
            <head>
                <title>Invoice #${invoice.id}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; color: #000; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .store-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                    .meta { font-size: 14px; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; font-size: 14px; }
                    th { text-align: left; border-bottom: 1px solid #000; padding: 5px; font-weight: bold; }
                    .totals { margin-top: 20px; font-size: 14px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .total-row { font-weight: bold; font-size: 16px; border-top: 1px dashed #000; padding-top: 10px; margin-top: 5px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="store-name">My Supermarket</div>
                    <div>123 Market Street, Downtown</div>
                    <div>Phone: +1 234 567 890</div>
                </div>
                
                <div class="meta">
                    <div><strong>Invoice: ${invoice.id}</strong></div>
                    <div>Date: ${invoice.date || new Date().toLocaleDateString()}</div>
                    <div>Customer: ${invoice.customerName || invoice.customer || 'Walk-in'}</div>
                    <div>Method: ${invoice.paymentMethod || invoice.method || 'Cash'}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="row">
                        <span>Subtotal</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span>Tax</span>
                        <span>$${tax.toFixed(2)}</span>
                    </div>
                     <div class="row total-row">
                        <span>Total</span>
                        <span>${typeof total === 'number' ? '$' + total.toFixed(2) : total}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for shopping with us!</p>
                    <p>No Refunds / Exchange within 7 days</p>
                </div>
                <div style="text-align: center; margin-top: 20px;" class="no-print">
                    <button onclick="window.print()" style="padding: 8px 16px; margin-right: 10px; cursor: pointer;">Print Again</button>
                    <button onclick="window.close()" style="padding: 8px 16px; cursor: pointer;">Close Window</button>
                </div>
                <style>
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </body>
        </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();

    // Allow time for styles to load (even though inline)
    setTimeout(() => {
        printWindow.print();
        // Do NOT auto-close. Let the user close it.
    }, 500);
};
