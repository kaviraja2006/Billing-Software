const { withDB } = require("../db/db");
const { performBackup, uploadEvent, listEvents, downloadEvent, clearEvents } = require("../services/backupService");
const { v4: uuidv4 } = require('uuid');

exports.triggerBackup = async (req, res) => {
    try {
        const db = await withDB(req);

        // 🛡️ Check Settings for Automated Triggers
        const isAutomated = req.headers['x-automated-trigger'] === 'true';
        if (isAutomated) {
            const settingsRow = db.prepare('SELECT data FROM settings WHERE id = ?').get('singleton');
            const settingsData = settingsRow ? JSON.parse(settingsRow.data) : {};

            if (!settingsData.backup?.enabled) {
                console.log("[Backup] Automated trigger skipped: Disabled in settings");
                return res.json({ success: true, skipped: true, message: "Auto-backup disabled in settings" });
            }
        }

        const result = await performBackup(req.user.googleSub, req.userBaseDir);

        if (result.success) {
            res.json({ success: true, timestamp: result.timestamp });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error("Manual Backup Error:", error);

        // Detect authentication errors and return 401
        if (error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_EXPIRED') {
            return res.status(401).json({
                success: false,
                error: error.message,
                authRequired: true
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Upload an Event to Drive
 * Body: { type, payload }
 */
exports.syncEvent = async (req, res) => {
    const { type, payload } = req.body;
    if (!type || !payload) return res.status(400).json({ error: "Missing type or payload" });

    try {
        const db = await withDB(req);

        // Wrap in Envelope
        const eventEnvelope = {
            eventId: uuidv4(),
            eventVersion: 1,
            type,
            deviceId: 'desktop-electron', // Or get from req/config
            createdAt: new Date().toISOString(),
            payload
        };

        const result = await uploadEvent(req.user.googleSub, eventEnvelope);

        // Optimistically mark as processed locally? 
        // Yes, because we created it, we don't need to re-apply it.
        // We should add it to processedEventIds to avoid re-processing if we sync our own event (unlikely if loopcheck works, but safe).

        const settings = db.prepare('SELECT data FROM settings WHERE id = ?').get('sync_state');
        let syncState = settings ? JSON.parse(settings.data) : { processedEventIds: [] };

        syncState.processedEventIds.push(eventEnvelope.eventId);

        // Save state
        db.prepare(`
            INSERT INTO settings (id, data, updated_at) 
            VALUES ('sync_state', ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
        `).run(JSON.stringify(syncState), new Date().toISOString());

        res.json({ success: true, eventId: eventEnvelope.eventId });
    } catch (error) {
        console.error("Sync Event Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Force Push All Data (Segregated Snapshots)
 */
exports.pushAllData = async (req, res) => {
    try {
        const { clearExisting } = req.body;
        const db = await withDB(req);
        const userId = req.user.googleSub;

        // 1. Clear existing events if requested
        if (clearExisting) {
            console.log("🧹 Clearing existing events before push...");
            await clearEvents(userId);

            // Reset local sync state
            db.prepare(`
                UPDATE settings SET data = ?, updated_at = ? WHERE id = 'sync_state'
            `).run(JSON.stringify({ processedEventIds: [] }), new Date().toISOString());
        }

        const newEventIds = [];
        let totalCount = 0;

        // Helper to push snapshot
        const pushSnapshot = async (type, table, mapFn) => {
            const rows = db.prepare(`SELECT * FROM ${table}`).all();
            if (rows.length === 0) return;

            console.log(`📤 Pushing ${rows.length} ${table} as SNAPSHOT...`);

            const payload = rows.map(row => mapFn ? mapFn(row) : row);

            const eventEnvelope = {
                eventId: uuidv4(),
                eventVersion: 1,
                type, // e.g. 'PRODUCTS_SNAPSHOT'
                deviceId: 'desktop-electron',
                createdAt: new Date().toISOString(),
                payload: payload // Array of items
            };

            await uploadEvent(userId, eventEnvelope);
            newEventIds.push(eventEnvelope.eventId);
            totalCount += rows.length;
        };

        // 2. Push Snapshots
        await pushSnapshot('PRODUCTS_SNAPSHOT', 'products', (p) => ({
            ...p,
            variants: JSON.parse(p.variants || "[]")
        }));

        await pushSnapshot('CUSTOMERS_SNAPSHOT', 'customers', (c) => ({
            ...c,
            address: JSON.parse(c.address || "{}"),
            tags: JSON.parse(c.tags || "[]")
        }));

        await pushSnapshot('INVOICES_SNAPSHOT', 'invoices', (i) => ({
            ...i,
            items: JSON.parse(i.items || "[]"),
            payments: JSON.parse(i.payments || "[]")
        }));

        await pushSnapshot('EXPENSES_SNAPSHOT', 'expenses', (e) => ({
            ...e,
            tags: JSON.parse(e.tags || "[]")
        }));

        // 3. Update Local State
        const settings = db.prepare('SELECT data FROM settings WHERE id = ?').get('sync_state');
        let syncState = settings ? JSON.parse(settings.data) : { processedEventIds: [] };

        const combinedIds = new Set([...syncState.processedEventIds, ...newEventIds]);
        syncState.processedEventIds = Array.from(combinedIds);

        db.prepare(`
            INSERT INTO settings (id, data, updated_at) 
            VALUES ('sync_state', ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
        `).run(JSON.stringify(syncState), new Date().toISOString());

        res.json({ success: true, count: totalCount, message: `Pushed ${totalCount} items in 4 snapshots` });

    } catch (error) {
        console.error("Push All Data Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Trigger Sync (Download & Apply)
 */
exports.triggerSync = async (req, res) => {
    try {
        const db = await withDB(req);

        // 1. Load Local State
        const settings = db.prepare('SELECT data FROM settings WHERE id = ?').get('sync_state');
        let syncState = settings ? JSON.parse(settings.data) : { processedEventIds: [] };
        const processedIds = new Set(syncState.processedEventIds || []);

        // 2. List Events from Drive
        // TODO: Use pageToken for large sets
        const { files } = await listEvents(req.user.googleSub);

        if (!files || files.length === 0) {
            return res.json({ success: true, applied: 0, message: "No events found" });
        }

        // 3. Download & Mem-Sort (for strict ordering by payload.createdAt)
        const newEvents = [];

        // Filter by ID first *if* possible, but to be safe we check file content or rely on processedIds check after download.
        // Optimization: If filename contains uuid, we can check `processedIds` before download.
        // Filename format: event_{TIMESTAMP}_{TYPE}_{UUID}.json

        for (const file of files) {
            // content regex to extract uuid from filename?
            // "event_2024-01-30..._INVOICE..._uuid.json"
            const match = file.name.match(/_([0-9a-fA-F-]{36})\.json$/);
            if (match && processedIds.has(match[1])) {
                continue; // Skip already processed
            }

            // Download
            try {
                const content = await downloadEvent(req.user.googleSub, file.id);
                if (content && content.eventId && !processedIds.has(content.eventId)) {
                    newEvents.push(content);
                }
            } catch (e) {
                console.error(`Failed to download event ${file.id}`, e);
            }
        }

        // 4. Sort by Content Timestamp
        newEvents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // 5. Apply Events
        let appliedCount = 0;
        const transaction = db.transaction(() => {
            const applyEntity = (type, entity) => {
                // Map SNAPSHOT items to CREATED types logic
                // Or unify logic here

                switch (type) {
                    case 'INVOICE_CREATED':
                    case 'INVOICE_SNAPSHOT_ITEM':
                        // Check existence
                        const existsInv = db.prepare('SELECT 1 FROM invoices WHERE id = ?').get(entity.id);
                        if (!existsInv) {
                            db.prepare(`
                                INSERT INTO invoices (id, customer_id, customer_name, date, type, items, subtotal, tax, discount, total, status, payments, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `).run(
                                entity.id, entity.customer_id || null, entity.customer_name, entity.date, entity.type,
                                JSON.stringify(entity.items), entity.subtotal, entity.tax, entity.discount, entity.total,
                                entity.status, JSON.stringify(entity.payments), entity.created_at, entity.updated_at
                            );
                        }
                        break;

                    case 'EXPENSE_CREATED':
                    case 'EXPENSE_SNAPSHOT_ITEM':
                        const existsExp = db.prepare('SELECT 1 FROM expenses WHERE id = ?').get(entity.id);
                        if (!existsExp) {
                            db.prepare(`
                                INSERT INTO expenses (id, title, amount, category, date, payment_method, tags, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                             `).run(
                                entity.id, entity.title, entity.amount, entity.category, entity.date,
                                entity.payment_method, JSON.stringify(entity.tags), entity.created_at, entity.updated_at
                            );
                        }
                        break;

                    case 'EXPENSE_ADJUSTED':
                        // Check if adjustment ALREADY applied (idempotency via processedEvents usually handles this, 
                        // but if we re-process, we need to be careful).
                        // However, eventId check at top of loop prevents re-processing same event file.
                        // So we just need to valid the expense exists.

                        const parentExp = db.prepare('SELECT 1 FROM expenses WHERE id = ?').get(entity.expenseId);
                        if (parentExp) {
                            // Ensure adjustment ID uniqueness if provided in payload, or generate one?
                            // Best practice: Payload should have the adjustment details including ID.
                            // If entity is the "adjustment record":
                            const adjExists = db.prepare('SELECT 1 FROM expense_adjustments WHERE id = ?').get(entity.id);
                            if (!adjExists) {
                                db.prepare(`
                                    INSERT INTO expense_adjustments (id, expense_id, delta_amount, reason, created_at, updated_at)
                                    VALUES (?, ?, ?, ?, ?, ?)
                                `).run(
                                    entity.id || uuidv4(), // Fallback if no ID in payload (should satisfy NOT NULL)
                                    entity.expenseId,
                                    entity.delta,
                                    entity.reason,
                                    entity.createdAt || new Date().toISOString(),
                                    new Date().toISOString()
                                );
                            }
                        }
                        break;

                    case 'PRODUCT_CREATED':
                    case 'PRODUCT_UPDATED':
                    case 'PRODUCT_SNAPSHOT_ITEM':
                        // Upsert
                        const existsProd = db.prepare('SELECT 1 FROM products WHERE id = ?').get(entity.id);
                        if (existsProd) {
                            // Update
                            db.prepare(`
                                UPDATE products SET name=?, sku=?, category=?, brand=?, price=?, unit=?, tax_rate=?, variants=?, stock=?, updated_at=?
                                WHERE id=?
                             `).run(
                                entity.name, entity.sku, entity.category, entity.brand, entity.price,
                                entity.unit, entity.tax_rate, JSON.stringify(entity.variants), entity.stock, new Date().toISOString(), entity.id
                            );
                        } else {
                            // Insert
                            db.prepare(`
                                INSERT INTO products (id, name, sku, category, brand, price, stock, unit, tax_rate, variants, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `).run(
                                entity.id, entity.name, entity.sku, entity.category, entity.brand, entity.price,
                                entity.stock || 0, // Initial stock 0, recalculated later
                                entity.unit, entity.tax_rate, JSON.stringify(entity.variants), entity.created_at, entity.updated_at
                            );
                        }
                        break;

                    case 'CUSTOMER_CREATED':
                    case 'CUSTOMER_UPDATED':
                    case 'CUSTOMER_SNAPSHOT_ITEM':
                        const existsCust = db.prepare('SELECT 1 FROM customers WHERE id = ?').get(entity.id);
                        if (existsCust) {
                            db.prepare(`
                                UPDATE customers SET 
                                    firstName=?, lastName=?, phone=?, email=?, customerType=?, gstin=?, address=?, 
                                    source=?, tags=?, loyaltyPoints=?, whatsappOptIn=?, smsOptIn=?, notes=?
                                WHERE id=?
                            `).run(
                                entity.firstName, entity.lastName, entity.phone, entity.email, entity.customerType, entity.gstin,
                                JSON.stringify(entity.address), entity.source, JSON.stringify(entity.tags), entity.loyaltyPoints,
                                entity.whatsappOptIn ? 1 : 0, entity.smsOptIn ? 1 : 0, entity.notes, entity.id
                            );
                        } else {
                            db.prepare(`
                                INSERT INTO customers (
                                    id, firstName, lastName, phone, email, customerType, gstin, address, 
                                    source, tags, loyaltyPoints, whatsappOptIn, smsOptIn, notes, createdAt
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `).run(
                                entity.id, entity.firstName, entity.lastName, entity.phone, entity.email, entity.customerType, entity.gstin,
                                JSON.stringify(entity.address), entity.source, JSON.stringify(entity.tags), entity.loyaltyPoints,
                                entity.whatsappOptIn ? 1 : 0, entity.smsOptIn ? 1 : 0, entity.notes, entity.createdAt || new Date().toISOString()
                            );
                        }
                        break;
                }
            };

            for (const event of newEvents) {
                if (processedIds.has(event.eventId)) continue;

                const { type, payload } = event;

                if (type.endsWith('_SNAPSHOT')) {
                    // Handle Snapshot Arrays
                    const entityList = Array.isArray(payload) ? payload : [];
                    let itemType = '';
                    if (type === 'PRODUCTS_SNAPSHOT') itemType = 'PRODUCT_SNAPSHOT_ITEM';
                    if (type === 'CUSTOMERS_SNAPSHOT') itemType = 'CUSTOMER_SNAPSHOT_ITEM';
                    if (type === 'INVOICES_SNAPSHOT') itemType = 'INVOICE_SNAPSHOT_ITEM';
                    if (type === 'EXPENSES_SNAPSHOT') itemType = 'EXPENSE_SNAPSHOT_ITEM';

                    for (const item of entityList) {
                        applyEntity(itemType, item);
                    }
                } else {
                    // Handle Single Events
                    const entity = payload.entity || payload;
                    applyEntity(type, entity);
                }

                processedIds.add(event.eventId);
                appliedCount++;
            }
        });

        transaction();

        // 6. Recalculate Stock (Simplified)
        if (appliedCount > 0) {
            const updateStockTx = db.transaction(() => {
                for (const event of newEvents) {
                    // Start simple: If invoice created, decrement
                    const processInvoiceItem = (item) => {
                        const productId = item.id || item.productId;
                        if (productId) {
                            db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, productId);
                        }
                    };

                    if (event.type === 'INVOICE_CREATED') {
                        const entity = event.payload.entity || event.payload;
                        (entity.items || []).forEach(processInvoiceItem);
                    } else if (event.type === 'INVOICE_SNAPSHOT') {
                        // Ideally snapshots are "state", not "changes", so maybe we DON'T recalc stock from snapshots? 
                        // If it's a seed, we invoke "recalc all".
                        // Use existing stock values from Product Snapshot instead?
                        // YES. Product Snapshot includes 'stock' (from push logic).
                        // But wait, our push logic for products did NOT include stock? 
                        // `SELECT * FROM products` includes 'stock'.
                        // And applyEntity for PRODUCT... UPDATES products set ... we didn't include stock in update!
                        // In INSERT we put 0.
                        // FIX: We should use the stock from the payload if available in SNAPSHOT.
                    }
                }
            });
            updateStockTx();
        }

        // 7. Save Sync State
        const finalSyncState = { processedEventIds: Array.from(processedIds), lastSyncAt: new Date().toISOString() };
        db.prepare(`
            UPDATE settings SET data = ?, updated_at = ? WHERE id = 'sync_state'
        `).run(JSON.stringify(finalSyncState), new Date().toISOString());

        res.json({ success: true, applied: appliedCount });

    } catch (error) {
        console.error("Sync Error:", error);

        // Detect authentication errors and return 401
        if (error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_EXPIRED') {
            return res.status(401).json({
                success: false,
                error: error.message,
                authRequired: true
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBackupStatus = async (req, res) => {
    try {
        const db = await withDB(req);
        const settings = db.prepare('SELECT data FROM settings WHERE id = ?').get('sync_state');
        const syncState = settings ? JSON.parse(settings.data) : { lastSyncAt: null };
        res.json({ status: "idle", lastSyncAt: syncState.lastSyncAt });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
