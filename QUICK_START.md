# Quick Start Guide - Billing Software

## ✅ Current Status

**Frontend:** ✅ Running on http://localhost:5173 (using MOCK data)
**Backend:** ⚠️ Running but needs MongoDB connection

---

## 🚀 Option 1: Test with Mock Data (Immediate - No Setup Required)

The frontend is now configured to use **mock data**, so you can test the entire application immediately!

### What You Can Do Right Now:

1. **Open the app**: http://localhost:5173
2. **Login with demo credentials**:
   - Email: `admin@example.com`
   - Password: `password`
3. **Test all features**:
   - ✅ Dashboard with stats
   - ✅ Create invoices/bills
   - ✅ Manage products
   - ✅ Manage customers
   - ✅ Track expenses
   - ✅ View reports
   - ✅ Generate barcodes

### Try the New Signup Flow:

1. Go to http://localhost:5173/signup
2. Create a new account (stored in browser localStorage)
3. Auto-login after signup
4. Access the dashboard

**Note:** With mock mode, all data is stored in your browser's localStorage. It persists across page refreshes but won't be shared with the backend.

---

## 🔧 Option 2: Connect to Real Backend (For Production Use)

To use the real backend with database persistence:

### Step 1: Set Up MongoDB Atlas (5 minutes)

Follow the guide: `MONGODB_SETUP.md`

**Quick Steps:**
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create FREE account
3. Create FREE M0 cluster
4. Create database user (username: `billing_admin`, password: `billing123`)
5. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
6. Get connection string

### Step 2: Update Backend .env

You currently have this file open! Update line 2:

**Replace:**
```env
MONGO_URI=mongodb://localhost:27017/billing_app
```

**With your MongoDB Atlas connection string:**
```env
MONGO_URI=mongodb+srv://billing_admin:billing123@cluster0.xxxxx.mongodb.net/billing_app?retryWrites=true&w=majority
```

⚠️ **Important:** Replace `cluster0.xxxxx.mongodb.net` with YOUR actual cluster URL from Atlas!

### Step 3: Restart Backend

1. Stop the backend (Ctrl+C in the terminal)
2. Run: `npm run dev`
3. You should see: `MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net`

### Step 4: Seed Demo User

```bash
cd backend
node seedUser.js
```

This creates the demo admin account in the database.

### Step 5: Switch Frontend to Real API

Open: `frontend/src/services/api.js`

Change line 11:
```javascript
const USE_MOCK = false; // Use real backend API
```

### Step 6: Test End-to-End

1. Refresh the frontend: http://localhost:5173
2. Login with: `admin@example.com` / `password`
3. All data now persists in MongoDB!

---

## 🎯 Recommended Approach

**For Learning/Testing:** Use Option 1 (Mock Data) - works immediately!

**For Production/Real Use:** Use Option 2 (MongoDB Atlas) - takes 5-10 minutes to set up

---

## 📝 Current Configuration

### Frontend (Port 5173)
- ✅ Running successfully
- ✅ Using MOCK data mode
- ✅ Login/Signup pages working
- ✅ All features available with mock data

### Backend (Port 5001)
- ✅ Server running
- ⚠️ Waiting for MongoDB connection
- ⚠️ Will work once MongoDB is configured

---

## 🐛 Troubleshooting

### "Failed to fetch" errors in console
**Solution:** This is normal when using mock mode. The frontend tries to connect to the backend but falls back to mock data.

### Backend crashes on startup
**Solution:** MongoDB is not connected. Either:
- Use mock mode (already enabled)
- Set up MongoDB Atlas (see MONGODB_SETUP.md)

### Can't login
**Solution:** 
- In mock mode, use: `admin@example.com` / `password`
- In real mode, run `node seedUser.js` first

---

## 🎨 Features to Test

### ✅ Authentication
- Login page with demo credentials
- Signup page with validation
- Auto-login after signup
- Protected routes

### ✅ Dashboard
- Sales overview
- Recent transactions
- Quick stats
- Charts and graphs

### ✅ Billing
- Create invoices
- Add products to cart
- Apply discounts
- Print invoices

### ✅ Products
- Add/edit products
- Set prices
- Track inventory
- Search and filter

### ✅ Customers
- Add/edit customers
- View purchase history
- Contact information

### ✅ Reports
- Sales reports
- Inventory reports
- Export to Excel

### ✅ Barcode Generator
- Generate product barcodes
- Print labels

---

## Next Steps

1. **Test the app now** with mock data: http://localhost:5173
2. **When ready for production**, follow Option 2 to connect MongoDB
3. **Customize** the app for your business needs

Enjoy your Billing Software! 🎉
