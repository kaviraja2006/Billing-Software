# MongoDB Setup Guide

## Quick Fix: Use MongoDB Atlas (Cloud - Recommended)

Since local MongoDB installation is having issues, here's the **fastest solution**:

### Step 1: Create MongoDB Atlas Account (2 minutes)

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub or email (FREE - no credit card needed)

### Step 2: Create a Free Cluster

1. After login, click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select **AWS** as provider
4. Choose a region closest to you (e.g., Mumbai for India)
5. Click **"Create Cluster"** (takes 1-3 minutes)

### Step 3: Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `billing_admin`
5. Password: `billing123` (or your choice - save it!)
6. Set **"Built-in Role"** to **"Atlas admin"**
7. Click **"Add User"**

### Step 4: Whitelist IP Address

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://billing_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `<password>` with your actual password** (e.g., `billing123`)

### Step 6: Update Backend .env File

Open `backend\.env` and update the `MONGO_URI`:

```env
PORT=5001
MONGO_URI=mongodb+srv://billing_admin:billing123@cluster0.xxxxx.mongodb.net/billing_app?retryWrites=true&w=majority
JWT_SECRET=dev_secret_key_123
NODE_ENV=development
```

**IMPORTANT**: Replace the entire connection string with YOUR actual connection string from Step 5!

### Step 7: Restart Backend

1. Stop the current backend (Ctrl+C in the terminal)
2. Run: `npm run dev`
3. You should see: `MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net`

---

## Alternative: Install MongoDB Locally

If you prefer local installation:

### Option A: Download Installer

1. Go to: https://www.mongodb.com/try/download/community
2. Download **MongoDB Community Server** for Windows
3. Run installer → Choose **"Complete"** installation
4. Check **"Install MongoDB as a Service"**
5. After installation, MongoDB will start automatically

### Option B: Use Chocolatey (if you have admin rights)

Run PowerShell as Administrator:
```powershell
choco install mongodb-community -y
```

Then start MongoDB service:
```powershell
net start MongoDB
```

---

## Next Steps After MongoDB is Running

1. **Seed the database** with a demo user:
   ```bash
   cd backend
   node seedUser.js
   ```

2. **Start backend**:
   ```bash
   npm run dev
   ```

3. **Start frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open browser**: http://localhost:5173

5. **Login with**:
   - Email: `admin@example.com`
   - Password: `password`

---

## Troubleshooting

### Backend still crashing?
- Check if MongoDB is actually running
- Verify connection string in `.env` is correct
- Check for typos in password

### Frontend not starting?
- Run `npm install` in frontend directory
- Delete `node_modules` and run `npm install` again if needed

### Can't connect to MongoDB Atlas?
- Make sure you replaced `<password>` in connection string
- Check Network Access allows your IP
- Wait 2-3 minutes after creating cluster
