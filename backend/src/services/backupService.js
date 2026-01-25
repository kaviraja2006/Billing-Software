const { google } = require('googleapis');
const keytar = require('keytar');
const path = require('path');
const fs = require('fs');

const SERVICE_NAME = 'BillingSoftware-Drive';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback";

/**
 * Get Authenticated Drive Client
 */
async function getDriveClient(userId) {
    try {
        const refreshToken = await keytar.getPassword(SERVICE_NAME, userId);
        if (!refreshToken) {
            throw new Error("No refresh token found. User needs to re-authenticate.");
        }

        const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        auth.setCredentials({ refresh_token: refreshToken });
        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error("Drive Auth Error:", error);
        return null;
    }
}

/**
 * Ensure core folder structure exists
 * Returns the folder IDs for { root, daily, weekly, monthly }
 */
async function ensureFolderStructure(drive) {
    const findOrCreateFolder = async (name, parentId = null) => {
        let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
        if (parentId) query += ` and '${parentId}' in parents`;

        const res = await drive.files.list({ q: query, fields: 'files(id, name)' });
        if (res.data.files.length > 0) return res.data.files[0].id;

        const fileMetadata = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined
        };
        const folder = await drive.files.create({ resource: fileMetadata, fields: 'id' });
        return folder.data.id;
    };

    const rootId = await findOrCreateFolder('BillingSoftware');
    const dailyId = await findOrCreateFolder('daily', rootId);
    const weeklyId = await findOrCreateFolder('weekly', rootId);
    const monthlyId = await findOrCreateFolder('monthly', rootId);

    return { rootId, dailyId, weeklyId, monthlyId };
}

/**
 * Perform Backup
 * @param {string} userId - Google User ID
 * @param {string} userBaseDir - Local user data directory
 */
async function performBackup(userId, userBaseDir) {
    console.log(`📦 Starting Backup for ${userId}...`);
    const drive = await getDriveClient(userId);
    if (!drive) return { success: false, error: 'Auth Failed' };

    try {
        const folders = await ensureFolderStructure(drive);

        // Determine Backup Type (Simple logic: Default to daily)
        // Ideally we check last back up time, but for now we just push to daily
        // We can add "Weekly" / "Monthly" triggers based on simple day-of-week checks
        const now = new Date();
        const type = 'daily'; // Default
        const targetFolderId = folders[`${type}Id`];

        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        const tables = ['invoices', 'customers', 'products', 'expenses'];
        let backedUpFiles = [];

        for (const table of tables) {
            const localPath = path.join(userBaseDir, 'data', table, `${table}.json`);
            if (fs.existsSync(localPath)) {
                await drive.files.create({
                    resource: {
                        name: `${table}_${timestamp}.json`,
                        parents: [targetFolderId]
                    },
                    media: {
                        mimeType: 'application/json',
                        body: fs.createReadStream(localPath)
                    },
                    fields: 'id'
                });
                backedUpFiles.push(table);
            }
        }

        // Upload Metadata
        const metadata = {
            createdAt: now.toISOString(),
            backupType: type,
            appVersion: '1.0.0', // Read from package.json in real app
            tables: backedUpFiles
        };

        await drive.files.create({
            resource: {
                name: `metadata_${timestamp}.json`,
                parents: [targetFolderId]
            },
            media: {
                mimeType: 'application/json',
                body: JSON.stringify(metadata, null, 2)
            }
        });

        // Enforce Retention (Simple Delete Oldest if > 7)
        await enforceRetention(drive, targetFolderId, 7);

        console.log("✅ Backup Complete");
        return { success: true, timestamp: now.toISOString() };

    } catch (error) {
        console.error("❌ Backup Failed:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Keep only N most recent backups (groups of files)
 * This is a simplified retention policy. real one relies on metadata grouping.
 */
async function enforceRetention(drive, folderId, maxCount) {
    try {
        // List all files in folder, sorted by createdTime desc
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, createdTime)',
            orderBy: 'createdTime desc'
        });

        const files = res.data.files;
        // Group files roughly by "backup set" (timestamp) or just limit total files?
        // Since we upload 4-5 files per backup, maxCount should be "Backup Sets".
        // Simplified: Just delete anything older than 7 'Backup Events'.
        // Hard to group without strict naming.
        // Let's just limit query to total * 5 for now safely.

        const SAFE_LIMIT = maxCount * 6; // ~6 files per backup * 7 backups
        if (files.length > SAFE_LIMIT) {
            const toDelete = files.slice(SAFE_LIMIT);
            for (const file of toDelete) {
                await drive.files.delete({ fileId: file.id });
                console.log(`🗑️ Pruned old backup file: ${file.name}`);
            }
        }
    } catch (e) {
        console.error("Retention Error:", e);
    }
}

module.exports = { performBackup };
