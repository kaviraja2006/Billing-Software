# Analytics Admin Dashboard

This is the admin dashboard for viewing usage analytics of the Billing Software.

## Setup

1. **Create Admin User** (First time only):

   ```bash
   curl -X POST http://localhost:5005/api/analytics/admin/create \
   -H "Content-Type: application/json" \
   -d '{
     "username": "admin",
     "password": "your-secure-password-here",
     "masterKey": "change-this-master-key"
   }'
   ```

   **Important**: Change the `masterKey` in the backend `.env` file before using!

2. **Open the Dashboard**:
   - Simply open `index.html` in any web browser
   - Or serve it using a local server:
     ```bash
     python -m http.server 8080
     ```
   - Then visit: `http://localhost:8080`

3. **Login**:
   - Use the username and password you created in step 1

## Features

- 📊 View total installations
- 🟢 Track daily, weekly, and monthly active users
- 📈 Platform and version distribution charts
- 👥 Complete list of software users
- 🔍 Search and filter users
- 📥 Export user data to CSV
- 🔄 Auto-refresh every 30 seconds

## Configuration

Edit `app.js` to change the API endpoint:
```javascript
const API_BASE_URL = 'http://localhost:5000/api/analytics';
```

## Security

- This dashboard should be served over HTTPS in production
- Keep admin credentials secure
- Only accessible to company administrators
- User business data is NOT accessible through this dashboard

## Privacy

**What this dashboard shows:**
- Software users (who installed the app)
- User names and emails (from Google login)
- Installation statistics

**What this dashboard DOES NOT show:**
- Users' business customers
- Invoice/transaction data
- Business financial information
- Any data from the local SQLite databases
