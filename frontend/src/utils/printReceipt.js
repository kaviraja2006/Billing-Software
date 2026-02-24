import { numberToWords } from './numberToWords';

export const printReceipt = (invoice, format = '80mm', settings = {}, options = {}) => {
    if (!invoice) return '';

    // --- 1. Setup & Defaults ---
    const store = settings.store || {};
    const invoiceSettings = settings.invoice || {};
    const taxSettings = settings.tax || {};
    const isThermal = format.includes('Thermal') || invoiceSettings.paperSize?.includes('Thermal');

    // GST Enabled Check - if disabled, hide all GST details
    const gstEnabled = taxSettings.gstEnabled !== false; // Default to true if not explicitly false

    // Tax Type Handling
    const taxType = invoice.taxType || invoice.tax_type || 'Intra-State';
    const isInterState = taxType === 'Inter-State';

    // --- 2. Helpers ---

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const getAddressStr = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean);
        return parts.join(', ');
    };

    const getItemTaxDetails = (item) => {
        // LOCK 2 & 8: STRICT READ-ONLY. NO RECALCULATION.
        // We rely entirely on the snapshot stored during billing.
        const taxableValue = item.taxableValue || 0;
        const taxRate = parseFloat(item.taxRate || 0);

        // Standardize output
        return {
            taxableValue,
            cgstRate: item.cgstRate || (item.taxRate / 2), // Helper for display only
            sgstRate: item.sgstRate || (item.taxRate / 2),
            igstRate: item.igstRate || item.taxRate,
            cgstAmt: item.cgst || 0,
            sgstAmt: item.sgst || 0,
            igstAmt: item.igst || 0,
            totalTax: item.totalTax || 0
        };
    };

    // --- 3. Shared Components ---

    const amountInWords = numberToWords(Math.round(invoice.total));
    const bankDetails = store.bankDetails;
    const signatoryLabel = store.signatoryLabel || store.name || 'Authorized Signatory';
    const isInvoiceInclusive = invoice.items && invoice.items.length > 0 && invoice.items.some(i => i.isInclusive);

    const renderBankDetails = () => {
        if (!invoiceSettings.showBankDetails || !bankDetails || !bankDetails.bankName) return '';
        return `
            <div style="margin-top: 10px; font-size: 10px; border: 1px dashed #aaa; padding: 5px;">
                <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">Bank Details</div>
                <div>Bank: <b>${bankDetails.bankName}</b></div>
                <div>A/c No: <b>${bankDetails.accountNumber}</b></div>
                <div>IFSC: <b>${bankDetails.ifscCode}</b> &nbsp; Branch: <b>${bankDetails.branch}</b></div>
            </div>
        `;
    };

    const renderInclusiveNote = () => {
        if (!isInvoiceInclusive || !gstEnabled) return '';
        return `<div style="font-size: 9px; margin-top: 5px; font-style: italic;">* Note: All prices are inclusive of GST. Taxable value is back-calculated.</div>`;
    };

    const generateGstSummaryHTML = () => {
        // If GST is disabled, return empty string
        if (!gstEnabled) return '';

        const summary = {};
        invoice.items.forEach(item => {
            const taxRate = parseFloat(item.taxRate || 0);
            if (!summary[taxRate]) {
                summary[taxRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            }
            // LOCK 2: Aggregation MUST use stored snapshots directly
            summary[taxRate].taxable += (item.taxableValue || 0);
            summary[taxRate].cgst += (item.cgst || 0);
            summary[taxRate].sgst += (item.sgst || 0);
            summary[taxRate].igst += (item.igst || 0);
            summary[taxRate].totalTax += (item.totalTax || 0);
        });

        const sortedRates = Object.keys(summary).sort((a, b) => parseFloat(a) - parseFloat(b));

        const tableStyle = `width: 100%; border-collapse: collapse; margin-top: 10px; font-size: ${isThermal ? '9px' : '10px'};`;
        const thStyle = `border: 1px dashed #aaa; padding: 2px 4px; text-align: right; background: #f9f9f9; font-weight: bold;`;
        const tdStyle = `border: 1px dashed #aaa; padding: 2px 4px; text-align: right;`;

        return `
            <div style="margin-top: 10px; border-top: 1px dotted #ddd; padding-top: 5px;">
                <div style="font-weight: bold; font-size: ${isThermal ? '10px' : '11px'}; margin-bottom: 5px;">GST DETAILS</div>
                <table style="${tableStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} text-align:center;">Rate</th>
                            <th style="${thStyle}">Taxable</th>
                            ${isInterState
                ? `<th style="${thStyle}">IGST</th>`
                : `<th style="${thStyle}">CGST</th><th style="${thStyle}">SGST</th>`
            }
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedRates.map(rate => {
                const row = summary[rate];
                return `
                                <tr>
                                    <td style="${tdStyle} text-align:center;">${rate}%</td>
                                    <td style="${tdStyle}">${formatCurrency(row.taxable)}</td>
                                    ${isInterState
                        ? `<td style="${tdStyle}">${formatCurrency(row.igst)}</td>`
                        : `<td style="${tdStyle}">${formatCurrency(row.cgst)}</td><td style="${tdStyle}">${formatCurrency(row.sgst)}</td>`
                    }
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    // --- 4. Templates ---

    // === EXPRESS RECEIPT ===
    const getExpressStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
        body { 
            font-family: 'Roboto Mono', 'Courier New', monospace; 
            margin: 0; padding: 5px; width: 280px; 
            font-size: 11px; background: white; line-height: 1.2; color: black;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 700; }
        .header { text-align: center; margin-bottom: 5px; }
        .store-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
        .store-info { font-size: 10px; }
        .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
        .meta-line { display: flex; justify-content: space-between; font-size: 10px; }
        .item-header { 
            display: grid; grid-template-columns: 0.8fr 2fr 1fr 1fr 1fr; 
            font-size: 9px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 2px;
        }
        .tax-group-header { font-size: 10px; font-weight: bold; margin-top: 5px; text-decoration: underline; }
        .item-row { display: grid; grid-template-columns: 0.8fr 2fr 1fr 1fr 1fr; font-size: 10px; margin-bottom: 2px; }
        .item-data-row { display: grid; grid-template-columns: 0.8fr 2fr 1fr 1fr 1fr; }
        .summary-line { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; padding: 5px 0; }
        .savings-box { margin-top: 10px; text-align: center; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px; font-weight: bold; font-size: 12px; }
    `;

    const generateExpressHTML = () => {
        const taxGroups = {};
        let totalQty = 0;
        let totalSavings = 0;

        invoice.items.forEach(item => {
            const taxDetails = getItemTaxDetails(item);
            const key = parseFloat(item.taxRate || 0);

            if (!taxGroups[key]) {
                taxGroups[key] = { rate: key, items: [], igstRate: taxDetails.igstRate, cgstRate: taxDetails.cgstRate, sgstRate: taxDetails.sgstRate };
            }

            const mrp = item.mrp || (item.price * 1.1);
            if (mrp > item.price) {
                totalSavings += (mrp - item.price) * item.quantity;
            }

            totalQty += item.quantity;
            taxGroups[key].items.push(item);
        });

        const sortedRates = Object.keys(taxGroups).sort((a, b) => parseFloat(a) - parseFloat(b));

        // Determine invoice title based on GST enabled
        const invoiceTitle = gstEnabled ? (invoiceSettings.invoiceTitle || 'TAX INVOICE') : 'INVOICE';

        return `
            <div class="header">
                ${invoiceSettings.showLogo && store.logo ? `<div class="logo-area" style="text-align: center; margin-bottom: 5px;"><img src="${store.logo}" style="max-height: 40px;" /></div>` : ''}
                <div class="store-name">${store.name || 'STORE NAME'}</div>
                <div class="store-info">
                    ${invoiceSettings.showStoreAddress ? getAddressStr(store.address) + '<br/>' : ''}
                    Phone: ${store.contact || '-'}<br/>
                    ${gstEnabled && store.gstin ? `GSTIN: ${store.gstin}` : ''}
                </div>
            </div>
            
            <div class="divider"></div>
            <div class="text-center bold">${invoiceTitle}</div>
            <div class="divider"></div>
            
            <div class="meta-line">
                <span>Bill No: ${invoice.bill_number !== undefined ? invoice.bill_number : (invoice.billNumber !== undefined ? invoice.billNumber : '#' + invoice.id.slice(-6).toUpperCase())}</span>
                <span>${new Date(invoice.date).toLocaleDateString()}</span>
            </div>
            <div class="meta-line">
                <span>Bill Dt: ${new Date(invoice.date).toLocaleDateString()}</span>
                <span>Time: ${new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="meta-line">
                <span>Customer: ${invoice.customerName || 'Walk-in Customer'}</span>
                <span>Mode: ${invoice.paymentMethod || invoice.payment_method || 'Cash'}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="item-header">
                <div>S.NO</div>
                <div>Item</div>
                <div class="text-right">Qty</div>
                <div class="text-right">${isInvoiceInclusive ? 'Rate (Incl.)' : 'Rate'}</div>
                <div class="text-right">Amt</div>
            </div>

            ${gstEnabled ? sortedRates.map((rate, index) => {
            const group = taxGroups[rate];
            const groupTitle = isInterState
                ? `${index + 1}) IGST @ ${group.igstRate}%`
                : `${index + 1}) CGST @ ${group.cgstRate}% SGST @ ${group.sgstRate}%`;

            return `
                    <div class="tax-group-header">${groupTitle}</div>
                    ${group.items.map(item => `
                        <div class="item-row">
                            <div>${item.hsnCode || ''}</div>
                            <div style="grid-column: 2 / -1;">${item.name}</div>
                        </div>
                        <div class="item-data-row">
                            <div></div>
                            <div></div>
                            <div class="text-right">${item.quantity}</div>
                            <div class="text-right">${parseFloat(item.price).toFixed(2)}</div>
                            <div class="text-right">${parseFloat(item.total).toFixed(2)}</div>
                        </div>
                    `).join('')}
                `;
        }).join('') : invoice.items.map(item => `
                        <div class="item-row">
                            <div>${item.hsnCode || ''}</div>
                            <div style="grid-column: 2 / -1;">${item.name}</div>
                        </div>
                        <div class="item-data-row">
                            <div></div>
                            <div></div>
                            <div class="text-right">${item.quantity}</div>
                            <div class="text-right">${parseFloat(item.price).toFixed(2)}</div>
                            <div class="text-right">${parseFloat(item.total).toFixed(2)}</div>
                        </div>
                    `).join('')}
            
            <div class="divider"></div>
            
            <div class="summary-line">
                <span>Items: ${invoice.items.length}</span>
                <span>Qty: ${totalQty}</span>
                <span>${formatCurrency(invoice.total)}</span>
            </div>
            
            ${invoice.billDiscount > 0 || invoice.bill_discount > 0 ? `
                <div style="text-align: right; font-size: 10px; padding: 2px 0;">
                    Bill Discount: -${formatCurrency(invoice.billDiscount || invoice.bill_discount)}
                </div>
            `: ''}
            ${invoice.loyaltyPointsDiscount > 0 || invoice.loyalty_points_discount > 0 ? `
                <div style="text-align: right; font-size: 10px; padding: 2px 0; color: #16a34a;">
                    Loyalty Points: -${formatCurrency(invoice.loyaltyPointsDiscount || invoice.loyalty_points_discount)}
                </div>
            `: ''}
            ${invoice.additionalCharges > 0 || invoice.additional_charges > 0 ? `
                <div style="text-align: right; font-size: 10px; padding: 2px 0;">
                    Additional Charges: +${formatCurrency(invoice.additionalCharges || invoice.additional_charges)}
                </div>
            `: ''}
            ${invoice.discount > 0 ? `
                <div style="text-align: right; font-size: 10px; padding: 2px 0;">
                    Total Discount: -${formatCurrency(invoice.discount)}
                </div>
            `: ''}
            ${invoice.roundOff || invoice.round_off ? `
                <div style="text-align: right; font-size: 10px; padding: 2px 0;">
                    Round Off: ${(invoice.roundOff || invoice.round_off) > 0 ? '+' : ''}${parseFloat(invoice.roundOff || invoice.round_off).toFixed(2)}
                </div>
            `: ''}

            ${generateGstSummaryHTML()}
            
            <div class="divider"></div>
            
            ${(invoice.amountReceived || invoice.amount_received) > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0;">
                    <span>Amt Received</span>
                    <span>${formatCurrency(invoice.amountReceived || invoice.amount_received)}</span>
                </div>
            ` : ''}

            ${(invoice.amountReceived || invoice.amount_received) > invoice.total ? `
                <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; font-weight: bold; border-bottom: 1px dashed #ddd; margin-bottom: 3px;">
                    <span>Change Return</span>
                    <span>${formatCurrency((invoice.amountReceived || invoice.amount_received) - invoice.total)}</span>
                </div>
            ` : ''}

            ${invoice.status !== 'Paid' && invoice.total > (invoice.amountReceived || invoice.amount_received) ? `
                <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; font-weight: bold; color: #b91c1c;">
                    <span>Balance Due</span>
                    <span>${formatCurrency(invoice.total - (invoice.amountReceived || invoice.amount_received))}</span>
                </div>
            ` : ''}
            
            ${totalSavings > 0 ? `
                <div class="savings-box">
                    ** Saved ${formatCurrency(totalSavings)} on MRP **
                </div>
            ` : ''}

            
            ${invoice.remarks ? `
                <div style="margin-top: 8px; padding: 6px; background: #f9f9f9; border-left: 3px solid #666; font-size: 9px;">
                    <div style="font-weight: bold; margin-bottom: 2px;">Remarks:</div>
                    <div>${invoice.remarks}</div>
                </div>
            `: ''}

            <div class="text-center" style="margin-top: 10px; font-size: 10px;">
                Thank You! Visit Again.<br/>
                ${store.website || ''}
            </div>
            ${renderInclusiveNote()}
        `;
    };

    // === STREAMLINED RECEIPT ===
    const getStreamlinedStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap');
        body { 
            font-family: 'Roboto', Arial, sans-serif; 
            margin: 0; padding: 3px; width: 280px; 
            font-size: 9px; background: white; line-height: 1.15; color: black;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 500; }
        .header { text-align: center; margin-bottom: 3px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
        .store-name { font-size: 13px; font-weight: 500; margin-bottom: 1px; }
        .store-info { font-size: 8px; line-height: 1.3; }
        .divider { border-bottom: 1px dashed #ccc; margin: 3px 0; }
        .meta-line { display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 1px; }
        .item-row { display: flex; justify-content: space-between; font-size: 9px; padding: 2px 0; border-bottom: 1px dotted #eee; }
        .item-name { flex: 1; }
        .item-qty { width: 35px; text-align: center; }
        .item-price { width: 50px; text-align: right; }
        .item-total { width: 60px; text-align: right; font-weight: 500; }
        .summary-row { display: flex; justify-content: space-between; font-size: 9px; padding: 2px 0; }
        .total-row { display: flex; justify-content: space-between; font-weight: 500; font-size: 11px; padding: 4px 0; border-top: 1px solid #000; border-bottom: 1px double #000; margin-top: 2px; }
        .footer { text-align: center; font-size: 8px; margin-top: 5px; padding-top: 3px; border-top: 1px dashed #ccc; }
    `;

    const generateStreamlinedHTML = () => {
        let totalQty = 0;
        invoice.items.forEach(item => {
            totalQty += item.quantity;
        });

        return `
            <div class="header">
                <div class="store-name">${store.name || 'STORE NAME'}</div>
                <div class="store-info">
                    ${getAddressStr(store.address)}<br/>
                    ${store.contact ? `Ph: ${store.contact}` : ''}
                    ${gstEnabled && store.gstin ? ` | GSTIN: ${store.gstin}` : ''}
                </div>
            </div>
            
            <div class="meta-line">
                <span>Bill: ${invoice.bill_number !== undefined ? invoice.bill_number : (invoice.billNumber !== undefined ? invoice.billNumber : '#' + invoice.id.slice(-6).toUpperCase())}</span>
                <span>${new Date(invoice.date).toLocaleDateString()} ${new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="meta-line">
                <span>${invoice.customerName || 'Walk-in'}</span>
                <span>${invoice.paymentMethod || 'Cash'}</span>
            </div>
            
            <div class="divider"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 500; padding-bottom: 2px; border-bottom: 1px solid #ddd;">
                <div style="flex: 1;">Item</div>
                <div style="width: 35px; text-align: center;">Qty</div>
                <div style="width: 50px; text-align: right;">Rate</div>
                <div style="width: 60px; text-align: right;">Amount</div>
            </div>

            ${invoice.items.map(item => `
                <div class="item-row">
                    <div class="item-name">${item.name}</div>
                    <div class="item-qty">${item.quantity}</div>
                    <div class="item-price">${parseFloat(item.price).toFixed(2)}</div>
                    <div class="item-total">${parseFloat(item.total).toFixed(2)}</div>
                </div>
            `).join('')}
            
            <div class="divider"></div>
            
            <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.billDiscount > 0 ? `
                <div class="summary-row">
                    <span>Bill Discount</span>
                    <span>-${formatCurrency(invoice.billDiscount || invoice.bill_discount)}</span>
                </div>
            ` : ''}
            ${invoice.loyaltyPointsDiscount > 0 || invoice.loyalty_points_discount > 0 ? `
                <div class="summary-row" style="color: #16a34a;">
                    <span>Loyalty Points</span>
                    <span>-${formatCurrency(invoice.loyaltyPointsDiscount || invoice.loyalty_points_discount)}</span>
                </div>
            ` : ''}
            ${invoice.additionalCharges > 0 || invoice.additional_charges > 0 ? `
                <div class="summary-row">
                    <span>Additional Charges</span>
                    <span>+${formatCurrency(invoice.additionalCharges || invoice.additional_charges)}</span>
                </div>
            ` : ''}
            ${invoice.discount > 0 ? `
                <div class="summary-row">
                    <span>Total Discount</span>
                    <span>-${formatCurrency(invoice.discount)}</span>
                </div>
            ` : ''}
            ${gstEnabled && invoice.tax > 0 ? `
                <div class="summary-row">
                    <span>Tax</span>
                    <span>${formatCurrency(invoice.tax)}</span>
                </div>
            ` : ''}
            ${invoice.roundOff ? `
                <div class="summary-row">
                    <span>Round Off</span>
                    <span>${invoice.roundOff > 0 ? '+' : ''}${parseFloat(invoice.roundOff).toFixed(2)}</span>
                </div>
            ` : ''}
            
            <div class="total-row">
                <span>TOTAL</span>
                <span>${formatCurrency(invoice.total)}</span>
            </div>

            ${(invoice.paymentMethod === 'Cash' || !invoice.paymentMethod) && (invoice.amountReceived > invoice.total) ? `
                <div class="summary-row" style="margin-top: 2px;">
                    <span>Cash Received</span>
                    <span>${formatCurrency(invoice.amountReceived)}</span>
                </div>
                <div class="summary-row" style="font-weight: bold;">
                    <span>Change Return</span>
                    <span>${formatCurrency(invoice.amountReceived - invoice.total)}</span>
                </div>
            ` : ''}
            
            
            ${invoice.remarks ? `
                <div style="margin-top: 6px; padding: 5px; background: #f9f9f9; border-left: 2px solid #666; font-size: 8px;">
                    <div style="font-weight: 500; margin-bottom: 1px;">Remarks:</div>
                    <div>${invoice.remarks}</div>
                </div>
            `: ''}
            
            <div class="footer">
                Thank you! Visit again.<br/>
                ${store.website || ''}
            </div>
            ${renderInclusiveNote()}
        `;
    };

    // === CLASSIC (A4) - REFINED ===
    const getClassicStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; width: 794px; color: #333; background: white; font-size: 11px; line-height: 1.4; }
        .classic-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 30px 40px; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .logo-area { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .company-info { text-align: right; flex: 1; margin-left: 20px; }
        .company-name { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 4px; text-transform: uppercase; }
        .addr-line { font-size: 12px; color: #555; }
        .invoice-title { font-size: 32px; font-weight: 800; color: #eee; position: absolute; top: 20px; right: 40px; z-index: -1; text-transform: uppercase; letter-spacing: 2px; }
        
        .main-content { padding: 0 40px; }
        .meta-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .bill-to { flex: 1; }
        .invoice-details { text-align: right; }
        .label { font-size: 10px; text-transform: uppercase; color: #888; font-weight: 600; margin-bottom: 2px; }
        .value { font-size: 12px; font-weight: 500; color: #000; margin-bottom: 8px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f5f5f5; color: #444; text-transform: uppercase; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; border-bottom: 2px solid #ddd; }
        td { border-bottom: 1px solid #eee; padding: 10px; vertical-align: middle; color: #333; }
        
        .totals-container { display: flex; justify-content: space-between; margin-top: 20px; page-break-inside: avoid; }
        .left-notes { flex: 1; padding-right: 40px; }
        .right-totals { width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; }
        .grand-total { border-top: 2px solid #333; border-bottom: 2px double #333; padding: 10px 0; margin-top: 10px; font-weight: 700; font-size: 14px; }
        
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-end; }
        .sign-box { text-align: center; }
        .sign-space { height: 40px; margin-bottom: 5px; }
        
        /* Utility */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-uppercase { text-transform: uppercase; }
    `;

    const generateClassicHTML = () => {
        const custName = invoice.customerName || invoice.customer || 'Walk-in Customer';
        // Determine invoice title based on GST enabled
        const invoiceTitle = gstEnabled ? (invoiceSettings.invoiceTitle || 'TAX INVOICE') : 'INVOICE';
        
        return `
            <div class="classic-header">
                <div class="logo-area">
                    ${invoiceSettings.showLogo && store.logo ? `<img src="${store.logo}" class="logo-img" />` : ''}
                </div>
                <div class="company-info">
                    <div style="font-size: 12px; font-weight: bold; color: #888; margin-bottom: 5px;">${invoiceTitle}</div>
                    <div class="company-name">${store.name || 'Company Name'}</div>
                    ${invoiceSettings.showStoreAddress ? `
                        <div class="addr-line">${getAddressStr(store.address)}</div>
                        <div class="addr-line">Phone: ${store.contact || '-'}</div>
                    ` : ''}
                    ${gstEnabled && store.gstin ? `<div class="addr-line">GSTIN: <b>${store.gstin}</b></div>` : ''}
                </div>
            </div>

            <div class="main-content">
                <div class="meta-grid">
                    <div class="bill-to">
                        <div class="label">Bill To</div>
                        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${custName}</div>
                        <div class="addr-line">${invoice.customerAddress || ''}</div>
                        <div class="addr-line">${invoice.customerPhone ? 'Ph: ' + invoice.customerPhone : ''}</div>
                        ${gstEnabled && invoice.customerGstin ? `<div class="addr-line">GSTIN: ${invoice.customerGstin}</div>` : ''}
                    </div>
                    <div class="invoice-details">
                        <div class="label">Invoice Details</div>
                        <div class="value">Inv No: <b>${invoice.bill_number || invoice.billNumber || '#' + invoice.id}</b></div>
                        <div class="value">Date: <b>${new Date(invoice.date).toLocaleDateString()}</b></div>
                        ${gstEnabled ? `<div class="value">POS: <b>${isInterState ? 'Inter-State' : 'State'}</b></div>` : ''}
                        <div class="value">Pay Mode: <b>${invoice.paymentMethod || 'Cash'}</b></div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: ${invoiceSettings.showHsn ? '35%' : '45%'}%;">Item Description</th>
                            ${invoiceSettings.showHsn ? '<th class="text-center">HSN</th>' : ''}
                            <th class="text-right">Qty</th>
                            <th class="text-right">${isInvoiceInclusive ? 'Rate (Incl.)' : 'Price'}</th>
                            ${invoiceSettings.showMrp ? '<th class="text-right">MRP</th>' : ''}
                            ${invoiceSettings.showDiscount ? '<th class="text-right">Disc</th>' : ''}
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map((item, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>
                                    <div style="font-weight: 500;">${item.name}</div>
                                </td>
                                ${invoiceSettings.showHsn ? `<td class="text-center" style="color: #666;">${item.hsnCode || '-'}</td>` : ''}
                                <td class="text-right">${item.quantity}</td>
                                <td class="text-right">${formatCurrency(item.price)}</td>
                                ${invoiceSettings.showMrp ? `<td class="text-right">${formatCurrency(item.mrp || 0)}</td>` : ''}
                                ${invoiceSettings.showDiscount ? `<td class="text-right">${formatCurrency(item.discount || 0)}</td>` : ''}
                                <td class="text-right" style="font-weight: 500;">${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals-container">
                    <div class="left-notes">
                        <div class="label">Amount in Words</div>
                        <div style="font-weight: 600; font-style: italic; margin-bottom: 15px;">${amountInWords}</div>
                        
                        ${renderBankDetails()}
                        
                        ${invoiceSettings.termsAndConditions ? `
                            <div class="label" style="margin-top: 15px;">Terms & Conditions</div>
                            <div style="font-size: 10px; color: #666; white-space: pre-line;">${invoiceSettings.termsAndConditions}</div>
                        ` : ''}
                        
                        ${renderInclusiveNote()}
                    </div>
                    
                    <div class="right-totals">
                        <div class="total-row"><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
                        ${invoice.billDiscount > 0 ? `<div class="total-row" style="color: #059669;"><span>Bill Discount</span><span>-${formatCurrency(invoice.billDiscount || invoice.bill_discount)}</span></div>` : ''}
                        ${invoice.loyaltyPointsDiscount > 0 || invoice.loyalty_points_discount > 0 ? `<div class="total-row" style="color: #16a34a;"><span>Loyalty Points</span><span>-${formatCurrency(invoice.loyaltyPointsDiscount || invoice.loyalty_points_discount)}</span></div>` : ''}
                        ${invoice.additionalCharges > 0 || invoice.additional_charges > 0 ? `<div class="total-row"><span>Additional Charges</span><span>+${formatCurrency(invoice.additionalCharges || invoice.additional_charges)}</span></div>` : ''}
                        ${invoice.discount > 0 ? `<div class="total-row" style="color: green;"><span>Total Discount</span><span>-${formatCurrency(invoice.discount)}</span></div>` : ''}
                        
                        ${gstEnabled && invoice.tax > 0 ? `<div class="total-row"><span>Total Tax</span><span>${formatCurrency(invoice.tax)}</span></div>` : ''}
                        
                        ${invoice.roundOff ? `<div class="total-row"><span>Round Off</span><span>${parseFloat(invoice.roundOff).toFixed(2)}</span></div>` : ''}
                        
                        <div class="total-row grand-total">
                            <span>GRAND TOTAL</span>
                            <span>${formatCurrency(invoice.total)}</span>
                        </div>

                        <div class="total-row" style="margin-top: 5px;">
                            <span>Amount Paid</span>
                            <span>${formatCurrency(invoice.amountPaid || 0)}</span>
                        </div>
                        <div class="total-row" style="font-weight: 600; color: #d32f2f;">
                            <span>Balance Due</span>
                            <span>${formatCurrency(invoice.balance != null ? invoice.balance : Math.max(0, (invoice.total || 0) - (invoice.amountPaid || 0)))}</span>
                        </div>

                        ${(invoice.paymentMethod === 'Cash' || !invoice.paymentMethod) && (invoice.amountReceived > invoice.total) ? `
                            <div class="total-row" style="margin-top: 5px; border-top: 1px dashed #eee; padding-top: 5px;">
                                <span>Cash Received</span>
                                <span>${formatCurrency(invoice.amountReceived)}</span>
                            </div>
                            <div class="total-row" style="font-weight: 600;">
                                <span>Change Return</span>
                                <span>${formatCurrency(invoice.amountReceived - invoice.total)}</span>
                            </div>
                        ` : ''}

                        ${isInterState === false ? `
                            <div style="margin-top: 5px; font-size: 10px; color: #666; text-align: right;">
                                (CGST: ${formatCurrency(invoice.cgst)} | SGST: ${formatCurrency(invoice.sgst)})
                            </div>
                        ` : ''}
                        
                        ${invoice.remarks ? `
                            <div style="margin-top: 10px; padding: 8px; background: #f9f9f9; border-left: 3px solid #666; font-size: 10px;">
                                <div style="font-weight: 600; margin-bottom: 3px;">Remarks:</div>
                                <div style="color: #444;">${invoice.remarks}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="footer">
                    <div style="font-size: 10px; color: #888;">
                        Generated by KwiqBill POS
                    </div>
                    <div class="sign-box">
                        <div class="sign-space"></div>
                        <div style="font-weight: 600;">${signatoryLabel}</div>
                    </div>
                </div>
            </div>
        `;
    };

    // === GST DETAILED (A4) - REFINED ===
    const getGstDetailedStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            font-size: 10px; 
            line-height: 1.4;
            color: #000; 
            background: white;
            padding: 10mm;
        }
        .invoice-container { 
            border: 2px solid #000; 
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
        }
        
        /* Header Section */
        .header-section { 
            display: flex; 
            border-bottom: 2px solid #000; 
        }
        .logo-section { 
            width: 25%; 
            border-right: 2px solid #000; 
            padding: 15px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        .company-section { 
            flex: 1; 
            padding: 10px 15px; 
            text-align: center; 
        }
        .company-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px; 
        }
        .company-details { 
            font-size: 9px; 
            margin-bottom: 3px; 
        }
        .company-gstin { 
            font-weight: bold; 
            margin-top: 5px; 
        }
        
        /* Title */
        .invoice-title { 
            text-align: center; 
            padding: 6px; 
            background: #f5f5f5; 
            border-bottom: 2px solid #000; 
            font-weight: bold; 
            font-size: 14px; 
            letter-spacing: 2px;
        }
        
        /* Rule reference */
        .rule-reference { 
            text-align: center; 
            padding: 4px; 
            border-bottom: 1px solid #000; 
            font-size: 8px; 
            font-style: italic;
        }
        
        /* Top Info Section */
        .top-info-section { 
            display: flex; 
            border-bottom: 1px solid #000; 
        }
        .info-left, .info-right { 
            flex: 1; 
            padding: 8px 10px; 
        }
        .info-left { 
            border-right: 1px solid #000; 
        }
        .info-row { 
            display: flex; 
            margin-bottom: 3px; 
        }
        .info-label { 
            font-weight: bold; 
            min-width: 100px; 
        }
        
        /* Billing and Consignee Section */
        .details-section { 
            display: flex; 
            border-bottom: 1px solid #000; 
        }
        .detail-box { 
            flex: 1; 
            padding: 10px; 
        }
        .detail-box:first-child { 
            border-right: 1px solid #000; 
        }
        .detail-header { 
            font-weight: bold; 
            margin-bottom: 6px; 
            font-size: 9px; 
            text-transform: uppercase;
        }
        .detail-content { 
            font-size: 10px; 
        }
        .detail-content div { 
            margin-bottom: 2px; 
        }
        
        /* Items Table */
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        .items-table th { 
            background: #f5f5f5; 
            border: 1px solid #000; 
            padding: 6px 4px; 
            font-weight: bold; 
            font-size: 9px; 
            text-align: center;
        }
        .items-table td { 
            border: 1px solid #000; 
            padding: 5px 4px; 
            font-size: 9px; 
        }
        .items-table .text-center { 
            text-align: center; 
        }
        .items-table .text-right { 
            text-align: right; 
        }
        .items-table .total-row { 
            font-weight: bold; 
            background: #fafafa;
        }
        
        /* Footer Section */
        .footer-section { 
            display: flex; 
            border-top: 1px solid #000; 
        }
        .amount-words-section { 
            flex: 1; 
            padding: 10px; 
            border-right: 1px solid #000; 
        }
        .amount-words-label { 
            font-weight: bold; 
            margin-bottom: 5px; 
            font-size: 9px;
        }
        .amount-words-value { 
            font-style: italic; 
            margin-bottom: 10px; 
        }
        .tax-summary-section { 
            width: 35%; 
            padding: 0; 
        }
        .tax-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 5px 10px; 
            border-bottom: 1px solid #ddd; 
            font-size: 9px;
        }
        .tax-row.total { 
            background: #f5f5f5; 
            font-weight: bold; 
            border-bottom: 2px solid #000;
        }
        
        /* Bank and Signature Section */
        .bottom-section { 
            display: flex; 
            border-top: 1px solid #000; 
        }
        .bank-terms-section { 
            flex: 1; 
            padding: 10px; 
            border-right: 1px solid #000; 
        }
        .bank-header { 
            font-weight: bold; 
            margin-bottom: 5px; 
            font-size: 10px;
        }
        .bank-details, .terms-details { 
            font-size: 8px; 
            margin-bottom: 8px; 
        }
        .signature-section { 
            width: 35%; 
            padding: 10px; 
            text-align: right; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
        }
        .signature-label { 
            font-weight: bold; 
            margin-top: 40px; 
        }
        
        /* System Generated */
        .system-generated { 
            text-align: center; 
            padding: 5px; 
            font-size: 8px; 
            color: #666; 
            border-top: 1px solid #000;
        }
        
        .bold { font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
    `;

    const generateGstDetailedHTML = () => {
        // Calculate totals
        let subtotal = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalTax = 0;

        invoice.items.forEach(item => {
            const tax = getItemTaxDetails(item);
            subtotal += tax.taxableValue;
            totalCGST += tax.cgstAmt;
            totalSGST += tax.sgstAmt;
            totalIGST += tax.igstAmt;
            totalTax += tax.totalTax;
        });

        const grandTotal = invoice.total || 0;

        // Determine invoice title based on GST enabled
        const invoiceTitle = gstEnabled ? (invoiceSettings.invoiceTitle || 'TAX INVOICE') : 'INVOICE';

        return `
            <div class="invoice-container">
                <!-- Header Section -->
                <div class="header-section">
                    <div class="logo-section">
                        ${invoiceSettings.showLogo && store.logo ? `<img src="${store.logo}" style="max-width: 100%; max-height: 80px;" />` : (store.name || 'LOGO')}
                    </div>
                    <div class="company-section">
                        <div class="company-name">${store.name || 'My Billing Co.'}</div>
                        ${invoiceSettings.showStoreAddress ? `
                            <div class="company-details">${getAddressStr(store.address)}</div>
                            <div class="company-details">Tel: ${store.contact || '635258245'}</div>
                        ` : ''}
                        ${gstEnabled && store.gstin ? `<div class="company-gstin">GSTIN: ${store.gstin}</div>` : ''}
                    </div>
                </div>
                
                <!-- Title -->
                <div class="invoice-title">${invoiceTitle}</div>
                
                ${gstEnabled ? `<!-- Rule Reference -->
                <div class="rule-reference">(See rule 7 for a tax invoice referred to in section 31)</div>` : ''}
                
                <!-- Top Info Section -->
                <div class="top-info-section">
                    <div class="info-left">
                        <div class="info-row">
                            <span class="info-label">Invoice No:</span>
                            <span>${invoice.bill_number || invoice.billNumber || invoice.invoiceNumber || '#' + invoice.id}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Invoice Date:</span>
                            <span>${new Date(invoice.date).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Reverse Charge (Y/N):</span>
                            <span>No</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">State:</span>
                            <span>${store.address?.state || 'fgbhnnhgdfd'}</span>
                        </div>
                    </div>
                    <div class="info-right">
                        <div class="info-row">
                            <span class="info-label">Transport Mode:</span>
                            <span>${invoice?.transportMode || settings.invoice?.transportMode || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Vehicle Number:</span>
                            <span>${invoice?.vehicleNumber || settings.invoice?.vehicleNumber || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Date of Supply:</span>
                            <span>${new Date(invoice.date).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Place of Supply:</span>
                            <span>${invoice?.placeOfSupply || settings.invoice?.placeOfSupply || 'Local'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Billing and Consignee Section -->
                <div class="details-section">
                    <div class="detail-box">
                        <div class="detail-header">Detail of Receiver (Billed to)</div>
                        <div class="detail-content">
                            <div><strong>Name:</strong> ${invoice.customerName || 'Rahul Sharma'}</div>
                            <div><strong>Address:</strong> ${invoice.customerAddress || '12, M.G. Road, Indiranagar, Bangalore'}</div>
                            <div><strong>GSTIN:</strong> ${invoice.customerGstin || '29ABCDE1234F1Z5'}</div>
                            <div><strong>Phone:</strong> ${invoice.customerPhone || invoice.customerMobile || '9876543210'}</div>
                            <div><strong>State:</strong> ${invoice.customerState || '-'}</div>
                        </div>
                    </div>
                    <div class="detail-box">
                        <div class="detail-header">Detail of Consignee (Shipped to)</div>
                        <div class="detail-content">
                            <div><strong>Name:</strong> ${invoice.customerName || 'Rahul Sharma'}</div>
                            <div><strong>Address:</strong> ${invoice.customerAddress || '12, M.G. Road, Indiranagar, Bangalore'}</div>
                            <div><strong>GSTIN:</strong> ${invoice.customerGstin || '29ABCDE1234F1Z5'}</div>
                            <div><strong>State:</strong> ${invoice.customerState || '-'}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Items Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th rowspan="2" style="width: 5%;">S.No</th>
                            <th rowspan="2" style="width: 30%;">Product Description</th>
                            ${invoiceSettings.showHsn ? '<th rowspan="2" style="width: 10%;">HSN/SAC</th>' : ''}
                            <th rowspan="2" style="width: 7%;">Qty</th>
                            <th rowspan="2" style="width: 10%;">Rate</th>
                            <th rowspan="2" style="width: 12%;">Taxable Value</th>
                            ${invoiceSettings.showTaxBreakup ? (isInterState
                ? '<th colspan="2" style="width: 13%;">IGST</th>'
                : '<th colspan="2" style="width: 13%;">CGST</th><th colspan="2" style="width: 13%;">SGST</th>'
            ) : ''}
                            <th rowspan="2" style="width: 13%;">Total</th>
                        </tr>
                        <tr>
                            ${invoiceSettings.showTaxBreakup ? (isInterState
                ? '<th>Rate</th><th>Amt</th>'
                : '<th>Rate</th><th>Amt</th><th>Rate</th><th>Amt</th>'
            ) : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map((item, index) => {
                const tax = getItemTaxDetails(item);
                return `
                                <tr>
                                    <td class="text-center">${index + 1}</td>
                                    <td>${item.name}</td>
                                    ${invoiceSettings.showHsn ? `<td class="text-center">${item.hsnCode || item.hsn || '-'}</td>` : ''}
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-right">${formatCurrency(item.price)}</td>
                                    <td class="text-right">${formatCurrency(tax.taxableValue)}</td>
                                    ${invoiceSettings.showTaxBreakup ? (isInterState
                        ? `<td class="text-center">${tax.igstRate}%</td><td class="text-right">${formatCurrency(tax.igstAmt)}</td>`
                        : `<td class="text-center">${tax.cgstRate}%</td><td class="text-right">${formatCurrency(tax.cgstAmt)}</td><td class="text-center">${tax.sgstRate}%</td><td class="text-right">${formatCurrency(tax.sgstAmt)}</td>`
                    ) : ''}
                                    <td class="text-right bold">${formatCurrency(item.total)}</td>
                                </tr>
                            `;
            }).join('')}
                        
                        <!-- Total Row -->
                        <tr class="total-row">
                            <td colspan="${invoiceSettings.showHsn ? 5 : 4}" class="text-right"><strong>Total</strong></td>
                            <td class="text-right"><strong>${formatCurrency(subtotal)}</strong></td>
                            ${invoiceSettings.showTaxBreakup ? (isInterState
                ? `<td></td><td class="text-right"><strong>${formatCurrency(totalIGST)}</strong></td>`
                : `<td></td><td class="text-right"><strong>${formatCurrency(totalCGST)}</strong></td><td></td><td class="text-right"><strong>${formatCurrency(totalSGST)}</strong></td>`
            ) : ''}
                            <td class="text-right"><strong>${formatCurrency(grandTotal)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
                <!-- Footer Section -->
                <div class="footer-section">
                    <div class="amount-words-section">
                        <div class="amount-words-label">Total Invoice Amount in Words:</div>
                        <div class="amount-words-value">${amountInWords}</div>
                    </div>
                    <div class="tax-summary-section">
                        <div class="tax-row">
                            <span>Total Amount before Tax:</span>
                            <span>${formatCurrency(subtotal)}</span>
                        </div>
                        ${isInterState
                ? `<div class="tax-row">
                                <span>Add: IGST</span>
                                <span>${formatCurrency(totalIGST)}</span>
                            </div>`
                : `<div class="tax-row">
                                <span>Add: CGST</span>
                                <span>${formatCurrency(totalCGST)}</span>
                            </div>
                            <div class="tax-row">
                                <span>Add: SGST</span>
                                <span>${formatCurrency(totalSGST)}</span>
                            </div>`
            }
                        <div class="tax-row">
                            <span>Add: IGST</span>
                            <span>0.00</span>
                        </div>
                        <div class="tax-row">
                            <span>Total Tax Amount:</span>
                            <span>${formatCurrency(totalTax)}</span>
                        </div>
                        <div class="tax-row total">
                            <span>Total Amount after Tax:</span>
                            <span>${formatCurrency(grandTotal)}</span>
                        </div>
                        <div class="tax-row">
                            <span>Amount Paid:</span>
                            <span>${formatCurrency(invoice.amountPaid || 0)}</span>
                        </div>
                        <div class="tax-row" style="font-weight: bold; color: #d32f2f;">
                            <span>Balance Due:</span>
                            <span>${formatCurrency(invoice.balance != null ? invoice.balance : Math.max(0, (invoice.total || 0) - (invoice.amountPaid || 0)))}</span>
                        </div>

                        ${(invoice.paymentMethod === 'Cash' || !invoice.paymentMethod) && (invoice.amountReceived > invoice.total) ? `
                            <div class="tax-row" style="margin-top: 5px; border-top: 1px dashed #eee; padding-top: 5px;">
                                <span>Cash Received:</span>
                                <span>${formatCurrency(invoice.amountReceived)}</span>
                            </div>
                            <div class="tax-row" style="font-weight: bold;">
                                <span>Change Return:</span>
                                <span>${formatCurrency(invoice.amountReceived - invoice.total)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Bank and Signature Section -->
                <div class="bottom-section" style="${!invoiceSettings.showSignature ? 'border-bottom: 2px solid #000;' : ''}">
                    <div class="bank-terms-section">
                        ${invoiceSettings.showBankDetails && bankDetails && bankDetails.bankName ? `
                            <div class="bank-header">Bank Details</div>
                            <div class="bank-details">
                                <div>Bank: <strong>${bankDetails.bankName}</strong></div>
                                <div>A/c No: <strong>${bankDetails.accountNumber}</strong></div>
                                <div>IFSC: <strong>${bankDetails.ifscCode}</strong> &nbsp; Branch: <strong>${bankDetails.branch}</strong></div>
                            </div>
                        ` : ''}
                        <div class="bank-header">Terms & Conditions:</div>
                        <div class="terms-details">
                            ${invoiceSettings.termsAndConditions || '1. Goods once sold will not be taken back. 2. Interest @18% pa will be charged if not paid within due date.'}
                        </div>
                        ${renderInclusiveNote()}
                    </div>
                    ${invoiceSettings.showSignature ? `
                    <div class="signature-section">
                        <div style="font-size: 9px; text-align: center;">
                            Certified that the particulars given above are true and correct
                        </div>
                        <div style="text-align: center; margin-top: 10px;">
                            <strong>For ${store.name || 'My Billing Co.'}</strong>
                        </div>
                        <div class="signature-label">${store.signatoryLabel || 'Authorised Signatory'}</div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- GST Note -->
                <div class="rule-reference" style="border-top: 1px solid #000; border-bottom: none;">
                    GST on Reverse Charge: No
                </div>
                
                <!-- System Generated -->
                <div class="system-generated">System Generated Invoice</div>
            </div>
        `;
    };

    // --- 5. Selection & Render ---
    let selectedStyles = getClassicStyles();
    let selectedHTML = generateClassicHTML();

    // === PROFESSIONAL (TEAL) ===
    const getProfessionalStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; width: 794px; color: #333; background: white; font-size: 11px; line-height: 1.4; }
        
        /* Header */
        .prof-header { background-color: #00695c; color: white; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
        .prof-title { font-size: 48px; font-weight: 800; margin-bottom: 5px; line-height: 1; }
        .prof-inv-no { font-size: 14px; opacity: 0.9; font-weight: 500; }
        
        .prof-company { text-align: right; }
        .prof-company-name { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
        .prof-company-addr { font-size: 11px; opacity: 0.9; max-width: 250px; margin-left: auto; line-height: 1.4; }

        /* Meta Grid */
        .prof-meta { padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
        .prof-bill-to-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: 700; margin-bottom: 8px; }
        .prof-customer-name { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 4px; }
        .prof-customer-details { font-size: 12px; color: #444; line-height: 1.5; }
        
        .prof-dates { text-align: right; }
        .prof-date-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 5px; font-size: 12px; }
        .prof-date-label { text-transform: uppercase; color: #666; font-weight: 600; font-size: 10px; padding-top: 2px; }
        .prof-date-val { font-weight: 600; color: #111; width: 80px; text-align: right; }

        /* Table */
        .prof-table-container { padding: 0 40px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px 0; color: #888; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; }
        td { padding: 15px 0; border-bottom: 1px solid #f5f5f5; color: #111; font-size: 12px; font-weight: 500; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Footer */
        .prof-footer { display: flex; justify-content: space-between; padding: 0 40px 40px; page-break-inside: avoid; }
        .prof-notes { flex: 1; padding-right: 60px; }
        .prof-notes-box { background-color: #f0fdfa; padding: 15px; border-radius: 4px; border-left: 3px solid #00695c; margin-bottom: 20px; }
        .prof-notes-title { color: #00695c; font-weight: 700; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; }
        .prof-notes-text { font-size: 11px; color: #334155; line-height: 1.5; }
        .prof-terms { font-size: 10px; color: #666; line-height: 1.4; }
        
        .prof-totals { width: 300px; }
        .prof-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; color: #444; }
        .prof-grand-total { background-color: #00695c; color: white; padding: 15px 20px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
        .prof-grand-label { font-weight: 600; font-size: 12px; text-transform: uppercase; }
        .prof-grand-val { font-size: 20px; font-weight: 700; }
    `;

    const generateProfessionalHTML = () => {
        const custName = invoice.customerName || invoice.customer || 'Walk-in Customer';

        // Calculate GST Summary
        const summary = {};
        invoice.items.forEach(item => {
            const taxRate = parseFloat(item.taxRate || 0);
            if (!summary[taxRate]) {
                summary[taxRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            }
            summary[taxRate].taxable += (item.taxableValue || 0);
            summary[taxRate].cgst += (item.cgst || 0);
            summary[taxRate].sgst += (item.sgst || 0);
            summary[taxRate].igst += (item.igst || 0);
            summary[taxRate].totalTax += (item.totalTax || 0);
        });
        const sortedRates = Object.keys(summary).sort((a, b) => parseFloat(a) - parseFloat(b));

        const gstHtml = sortedRates.length > 0 ? `
            <div style="padding: 0 40px; margin-bottom: 20px;">
                <div style="font-size: 10px; font-weight: 700; color: #444; margin-bottom: 8px; text-transform: uppercase;">GST Summary</div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 5px 0; border-bottom: 1px solid #eee; text-align: left; font-size: 9px; color: #666; text-transform: uppercase;">Rate</th>
                            <th style="padding: 5px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 9px; color: #666; text-transform: uppercase;">Taxable Value</th>
                            ${isInterState
                ? `<th style="padding: 5px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 9px; color: #666; text-transform: uppercase;">IGST</th>`
                : `<th style="padding: 5px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 9px; color: #666; text-transform: uppercase;">CGST</th><th style="padding: 5px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 9px; color: #666; text-transform: uppercase;">SGST</th>`
            }
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedRates.map(rate => {
                const row = summary[rate];
                return `
                                <tr>
                                    <td style="padding: 5px 0; border-bottom: 1px solid #f9f9f9; font-size: 10px; color: #333;">${rate}%</td>
                                    <td style="padding: 5px 0; border-bottom: 1px solid #f9f9f9; font-size: 10px; color: #333; text-align: right;">${formatCurrency(row.taxable)}</td>
                                    ${isInterState
                        ? `<td style="padding: 5px 0; border-bottom: 1px solid #f9f9f9; font-size: 10px; color: #333; text-align: right;">${formatCurrency(row.igst)}</td>`
                        : `<td style="padding: 5px 0; border-bottom: 1px solid #f9f9f9; font-size: 10px; color: #333; text-align: right;">${formatCurrency(row.cgst)}</td><td style="padding: 5px 0; border-bottom: 1px solid #f9f9f9; font-size: 10px; color: #333; text-align: right;">${formatCurrency(row.sgst)}</td>`
                    }
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            </div>
        ` : '';

        return `
            <div class="prof-header">
                <div>
                    <div class="prof-title">Invoice</div>
                    <div class="prof-inv-no">${invoice.bill_number || invoice.billNumber || '#' + invoice.id}</div>
                </div>
                <div class="prof-company">
                    <div class="prof-company-name">${store.name || 'Company Name'}</div>
                    <div class="prof-company-addr">${getAddressStr(store.address)}</div>
                </div>
            </div>

            <div class="prof-meta">
                <div>
                    <div class="prof-bill-to-label">BILL TO</div>
                    <div class="prof-customer-name">${custName}</div>
                    <div class="prof-customer-details">
                        ${invoice.customerGstin ? `<div>GSTIN: ${invoice.customerGstin}</div>` : ''}
                        ${invoice.customerPhone ? `<div>Ph: ${invoice.customerPhone}</div>` : ''}
                        <div style="max-width: 250px; margin-top: 2px;">${invoice.customerAddress || ''}</div>
                    </div>
                </div>
                <div class="prof-dates">
                    <div class="prof-date-row">
                        <div class="prof-date-label">INVOICE DATE</div>
                        <div class="prof-date-val">${new Date(invoice.date).toLocaleDateString()}</div>
                    </div>
                     <div class="prof-date-row">
                        <div class="prof-date-label">DUE DATE</div>
                        <div class="prof-date-val">${new Date(invoice.date).toLocaleDateString()}</div>
                    </div>
                </div>
            </div>

            <div class="prof-table-container">
                <table>
                    <thead>
                        <tr>
                            <th width="55%">ITEM DESCRIPTION</th>
                            <th width="10%" class="text-center">QTY</th>
                            <th width="15%" class="text-right">PRICE</th>
                            <th width="10%" class="text-right">TAX</th>
                            <th width="10%" class="text-right">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>
                                    <div style="color: #111;">${item.name}</div>
                                </td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${formatCurrency(item.price)}</td>
                                <td class="text-right">${item.taxRate}%</td>
                                <td class="text-right">${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            ${gstHtml}

            <div class="prof-footer">
                <div class="prof-notes">
                    <div class="prof-notes-box">
                        <div class="prof-notes-title">NOTES</div>
                        <div class="prof-notes-text">${invoiceSettings.footerNote || 'Thank you for your business!'}</div>
                    </div>

                    ${invoiceSettings.termsAndConditions ? `
                        <div style="font-weight: 700; font-size: 10px; color: #444; margin-bottom: 2px;">Terms:</div>
                        <div class="prof-terms">${invoiceSettings.termsAndConditions}</div>
                    ` : ''}
                </div>

                <div class="prof-totals">
                    <div class="prof-total-row">
                        <span>Subtotal</span>
                        <span style="font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
                    </div>
                    ${invoice.loyaltyPointsDiscount > 0 || invoice.loyalty_points_discount > 0 ? `
                        <div class="prof-total-row" style="color: #16a34a;">
                            <span>Loyalty Points</span>
                            <span>-${formatCurrency(invoice.loyaltyPointsDiscount || invoice.loyalty_points_discount)}</span>
                        </div>
                    ` : ''}
                    ${invoice.additionalCharges > 0 || invoice.additional_charges > 0 ? `
                        <div class="prof-total-row">
                            <span>Additional Charges</span>
                            <span>+${formatCurrency(invoice.additionalCharges || invoice.additional_charges)}</span>
                        </div>
                    ` : ''}
                     ${invoice.discount > 0 ? `
                        <div class="prof-total-row" style="color: #15803d;">
                            <span>Total Discount</span>
                            <span>-${formatCurrency(invoice.discount)}</span>
                        </div>
                    ` : ''}
                    ${invoice.tax > 0 ? `
                        <div class="prof-total-row">
                            <span>Tax (GST)</span>
                            <span style="font-weight: 600;">${formatCurrency(invoice.tax)}</span>
                        </div>
                    ` : ''}
                     ${invoice.roundOff ? `
                        <div class="prof-total-row">
                            <span>Round Off</span>
                            <span>${parseFloat(invoice.roundOff).toFixed(2)}</span>
                        </div>
                    ` : ''}

                    <div class="prof-grand-total">
                        <span class="prof-grand-label">TOTAL</span>
                        <span class="prof-grand-val">${formatCurrency(invoice.total)}</span>
                    </div>

                    <div class="prof-total-row" style="margin-top: 5px;">
                        <span>Amount Paid</span>
                        <span>${formatCurrency(invoice.amountPaid || 0)}</span>
                    </div>
                    <div class="prof-total-row" style="font-weight: 700; color: #b91c1c;">
                        <span>Balance Due</span>
                        <span>${formatCurrency(invoice.balance != null ? invoice.balance : Math.max(0, (invoice.total || 0) - (invoice.amountPaid || 0)))}</span>
                    </div>

                    ${(invoice.paymentMethod === 'Cash' || !invoice.paymentMethod) && (invoice.amountReceived > invoice.total) ? `
                        <div class="prof-total-row" style="margin-top: 8px; border-top: 1px dashed #eee; padding-top: 8px;">
                            <span>Cash Received</span>
                            <span>${formatCurrency(invoice.amountReceived)}</span>
                        </div>
                        <div class="prof-total-row" style="font-weight: 700; font-size: 14px; margin-top: 2px;">
                            <span>Change Return</span>
                            <span>${formatCurrency(invoice.amountReceived - invoice.total)}</span>
                        </div>
                    ` : ''}
                    
                    ${invoice.remarks ? `
                        <div style="margin-top: 12px; padding: 10px; background: #f9f9f9; border-left: 3px solid #666; font-size: 10px;">
                            <div style="font-weight: 600; margin-bottom: 4px;">Remarks:</div>
                            <div style="color: #444;">${invoice.remarks}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    // Map templates
    // Use options.template if provided (for preview mode), otherwise use settings
    const templateName = options.template || invoiceSettings.template || 'Classic';
    if (templateName === 'Express' || templateName === 'Modern') {
        // Support both Express and Modern for backward compatibility
        selectedStyles = getExpressStyles();
        selectedHTML = generateExpressHTML();
    } else if (templateName === 'Streamlined' || templateName === 'Minimal') {
        // Support both Streamlined and Minimal for backward compatibility
        selectedStyles = getStreamlinedStyles();
        selectedHTML = generateStreamlinedHTML();
    } else if (templateName === 'GST-Detailed') {
        selectedStyles = getGstDetailedStyles();
        selectedHTML = generateGstDetailedHTML();
    } else if (templateName === 'Compact') { // Professional
        selectedStyles = getProfessionalStyles();
        selectedHTML = generateProfessionalHTML();
    }

    // --- Dynamic Page Settings ---
    const printSettings = settings.print || {};
    const margins = printSettings.margins || { top: 0, right: 0, bottom: 0, left: 0 };
    const orientation = printSettings.orientation || 'portrait';
    const scale = printSettings.scale || 100;

    // Map internal paper size names to CSS size values
    const paperSizeMap = {
        'A4': 'A4',
        'A5': 'A5',
        'Thermal-3inch': '80mm auto', // approx 
        'Thermal-2inch': '58mm auto'
    };
    const cssSize = paperSizeMap[invoiceSettings.paperSize] || 'auto';

    const pageRules = `
        @page {
            size: ${cssSize} ${orientation};
            margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }
        body {
            transform: scale(${scale / 100});
            transform-origin: top left;
            width: ${scale !== 100 ? `${(100 * 100 / scale)}%` : 'auto'}; 
        }
    `;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print</title>
            <style>
                ${selectedStyles}
                ${pageRules}
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            ${selectedHTML}
            <script>
                window.onload = () => { window.print(); }
            </script>
        </body>
        </html>
    `;

    // If preview mode, return HTML without opening window
    if (options.preview) {
        return htmlContent;
    }

    // Check for Electron bridge
    if (window.electron && window.electron.printReceipt) {

        // GUARD: If silent print is on but no printer is selected, "Print to PDF" (default)
        // will trigger a save dialog. The user explicitly requested NO dialogs and NO saving.
        // So we MUST skip printing in this case.
        if ((settings.print?.silentPrint ?? true) && !settings.print?.printerName) {
            console.warn("Silent Print skipped: No printer selected. (Avoids 'Save As' dialog)");
            // Optional: Notify user via console or small toast if possible, but user asked for no popups.
            return;
        }

        console.log("Attempting Silent Print with options:", {
            printerName: settings.print?.printerName,
            silent: settings.print?.silentPrint
        });

        window.electron.printReceipt(htmlContent, {
            printerName: settings.print?.printerName,
            silent: settings.print?.silentPrint ?? true
        })
            .then(() => console.log("Silent print initiated successfully"))
            .catch(err => {
                console.error("Silent print failed", err);
                // alert("Silent Print Failed: " + err.message + ". Please check printer connection.");
            });
        return;
    }

    // Fallback for Web Mode (iframe method)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Write content to iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // specific handler for iframe printing
    iframe.onload = () => {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (e) {
            console.error('Printing failed', e);
        } finally {
            // Remove iframe after sufficient time
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 60000);
        }
    };
};
