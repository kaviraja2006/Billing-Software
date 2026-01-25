// Configuration
const API_BASE_URL = 'http://localhost:5000/api/analytics';
let authToken = localStorage.getItem('adminToken');
let refreshInterval = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const adminUsername = document.getElementById('adminUsername');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showDashboard();
    }

    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    searchInput.addEventListener('input', debounce(handleSearch, 500));
    exportBtn.addEventListener('click', exportToCSV);
});

// Authentication
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUsername', data.username);

            loginError.classList.add('hidden');
            showDashboard();
        } else {
            showError(data.error || 'Invalid credentials');
        }
    } catch (error) {
        showError('Login failed. Please check your connection.');
        console.error('Login error:', error);
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');

    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    loginForm.reset();
}

function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

// Dashboard
function showDashboard() {
    const username = localStorage.getItem('adminUsername');
    adminUsername.textContent = username || 'Admin';

    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');

    loadDashboardData();

    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(loadDashboardData, 30000);
}

async function loadDashboardData() {
    try {
        // Load all stats
        await Promise.all([
            loadStats('all', 'totalUsers'),
            loadStats('today', 'activeToday'),
            loadStats('7days', 'active7Days'),
            loadStats('30days', 'active30Days'),
            loadInstallations()
        ]);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);

        if (error.message.includes('401')) {
            handleLogout();
        }
    }
}

async function loadStats(timeRange, elementId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats?timeRange=${timeRange}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (timeRange === 'all') {
            document.getElementById(elementId).textContent = data.stats.totalInstallations || 0;
            renderPlatformChart(data.stats.platformDistribution || []);
            renderVersionChart(data.stats.versionDistribution || []);
        } else {
            document.getElementById(elementId).textContent = data.stats.activeUsers || 0;
        }
    } catch (error) {
        console.error(`Failed to load ${timeRange} stats:`, error);
        throw error;
    }
}

async function loadInstallations(searchTerm = '') {
    try {
        const url = new URL(`${API_BASE_URL}/admin/installations`);
        if (searchTerm) {
            url.searchParams.append('search', searchTerm);
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        renderUsersTable(data.installations || []);
    } catch (error) {
        console.error('Failed to load installations:', error);
        throw error;
    }
}

// Rendering
function renderPlatformChart(data) {
    const container = document.getElementById('platformChart');

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="loading">No data available</p>';
        return;
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    container.innerHTML = data.map(item => {
        const percentage = (item.count / total * 100).toFixed(1);
        const platform = getPlatformName(item.platform);

        return `
            <div class="chart-bar">
                <div class="chart-label">${platform}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%">
                        <span class="chart-value">${item.count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderVersionChart(data) {
    const container = document.getElementById('versionChart');

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="loading">No data available</p>';
        return;
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const topVersions = data.slice(0, 5); // Show top 5 versions

    container.innerHTML = topVersions.map(item => {
        const percentage = (item.count / total * 100).toFixed(1);

        return `
            <div class="chart-bar">
                <div class="chart-label">v${item.app_version || 'Unknown'}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%">
                        <span class="chart-value">${item.count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderUsersTable(installations) {
    const tbody = document.getElementById('usersTableBody');

    if (installations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = installations.map(user => `
        <tr>
            <td>${escapeHtml(user.user_name || 'Anonymous')}</td>
            <td>${escapeHtml(user.user_email || 'Not provided')}</td>
            <td>${getPlatformName(user.platform)}</td>
            <td>v${escapeHtml(user.app_version)}</td>
            <td>${formatDate(user.first_seen)}</td>
            <td>${formatDate(user.last_seen)}</td>
            <td><span class="badge badge-success">${user.ping_count}</span></td>
            <td>
                <button class="btn-delete" onclick="deleteUser('${user.install_id}', '${escapeHtml(user.user_name || 'Anonymous')}')" title="Delete user">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// Utilities
function getPlatformName(platform) {
    const platformMap = {
        'win32': 'Windows',
        'darwin': 'macOS',
        'linux': 'Linux'
    };
    return platformMap[platform] || platform;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Delete user installation
async function deleteUser(installId, userName) {
    if (!confirm(`Are you sure you want to delete the installation for "${userName}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/installations/${installId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete installation');
        }

        alert('Installation deleted successfully');
        loadDashboardData(); // Refresh the data
    } catch (error) {
        console.error('Error deleting installation:', error);
        alert('Failed to delete installation. Please try again.');
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function handleSearch(e) {
    const searchTerm = e.target.value.trim();
    loadInstallations(searchTerm);
}

function exportToCSV() {
    const table = document.getElementById('usersTable');
    const rows = Array.from(table.querySelectorAll('tr'));

    const csv = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => {
            let text = cell.textContent.trim();
            // Escape quotes and wrap in quotes if contains comma
            if (text.includes(',') || text.includes('"')) {
                text = '"' + text.replace(/"/g, '""') + '"';
            }
            return text;
        }).join(',');
    }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
