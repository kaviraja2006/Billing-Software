@echo off
echo ============================================
echo Checking Analytics Database
echo ============================================
echo.

cd /d "%~dp0backend"

echo Querying installations table...
echo.

sqlite3 analytics.db "SELECT user_name, user_email, platform, app_version, datetime(last_seen) as last_seen FROM installations ORDER BY last_seen DESC;"

echo.
echo ============================================
echo Total installations:
sqlite3 analytics.db "SELECT COUNT(*) FROM installations;"
echo.
echo ============================================
echo.
echo Press any key to exit...
pause > nul
