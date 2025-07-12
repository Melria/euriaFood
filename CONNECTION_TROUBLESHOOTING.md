# EURIA Food - Connection Troubleshooting Guide

## Problem Identified
You're experiencing two separate issues:
1. **Backend server is not running** - causing connection timeouts
2. **Browser extension conflict** - causing "Could not establish connection. Receiving end does not exist" error

## Quick Fix Steps

### Method 1: Use the simple startup script (RECOMMENDED)
1. Double-click on `start_backend_simple.bat` in the project root folder
2. Wait for the server to start (you'll see "Uvicorn running on http://0.0.0.0:8001")
3. In another terminal/command prompt, start the frontend:
   ```cmd
   cd "c:\Users\YANN\Desktop\Emergent-app\frontend"
   npm start
   ```

### Method 2: Start servers manually

#### Start Backend Server:
1. Open Command Prompt as Administrator
2. Navigate to backend folder:
   ```cmd
   cd "c:\Users\YANN\Desktop\Emergent-app\backend"
   ```
3. Activate virtual environment and start server:
   ```cmd
   C:/Users/YANN/Desktop/Emergent-app/.venv/Scripts/activate
   python server.py
   ```

#### Start Frontend Server:
1. Open another Command Prompt
2. Navigate to frontend folder:
   ```cmd
   cd "c:\Users\YANN\Desktop\Emergent-app\frontend"
   ```
3. Start the React development server:
   ```cmd
   npm start
   ```

### Method 3: Fix Browser Extension Error
The error "Could not establish connection. Receiving end does not exist" is typically caused by:
1. **Chrome/Edge extension conflicts**
2. **Ad blockers or security extensions**
3. **Developer tools extensions**

**Solutions:**
1. **Disable browser extensions temporarily**:
   - Open Chrome/Edge
   - Go to `chrome://extensions/` or `edge://extensions/`
   - Disable all extensions temporarily
   - Try accessing the app again

2. **Use Incognito/Private mode**:
   - Open an incognito/private browser window
   - Navigate to `http://localhost:3000`
   - This bypasses most extension conflicts

3. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete`
   - Clear browsing data, cache, and cookies
   - Restart browser

## Verification Steps

### 1. Check if Backend is Running
Open Command Prompt and run:
```cmd
netstat -an | findstr 8001
```
You should see: `TCP 0.0.0.0:8001 0.0.0.0:0 LISTENING`

### 2. Test Backend API
Open your browser and go to: `http://localhost:8001/docs`
You should see the FastAPI interactive documentation.

### 3. Test Frontend
Go to: `http://localhost:3000`
The frontend should load without hanging on login.

## Default Login Credentials
Once both servers are running, you can use these credentials:
- **Admin Account**: 
  - Email: `admin@restaurant.com`
  - Password: `admin123`

## Common Issues & Solutions

### Issue: Server Won't Start
**Possible Causes:**
- Python virtual environment not activated
- Missing dependencies
- Port 8001 already in use

**Solutions:**
1. Check if port is in use:
   ```cmd
   netstat -ano | findstr :8001
   taskkill /PID <PID_NUMBER> /F
   ```
2. Reinstall dependencies:
   ```cmd
   C:/Users/YANN/Desktop/Emergent-app/.venv/Scripts/pip install -r requirements.txt
   ```

### Issue: "Could not establish connection" Error
**Cause**: Browser extension conflict
**Solutions:**
1. Disable browser extensions
2. Use incognito mode
3. Try a different browser (Firefox, Safari)
4. Clear browser cache and cookies

### Issue: Frontend shows "Network Error"
**Cause**: Backend server not running or not accessible
**Solution**: Make sure backend is started first and running on port 8001

### Issue: "Permission denied" errors
**Solution**: Run Command Prompt as Administrator

## Environment Configuration
Make sure your `.env` file in the backend folder contains:
```
DATABASE_URL=mongodb+srv://meligloria0:nAsC1egkLcUOPcOg@cluster0.wnls6ns.mongodb.net/restaurant_db?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=restaurant_db
OPENAI_API_KEY=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
DEBUG=True
PORT=8001
```

## Startup Order (IMPORTANT)
1. **Start Backend first** (wait for "Uvicorn running on http://0.0.0.0:8001")
2. **Then start Frontend** 
3. **Access app at** `http://localhost:3000`
4. **If browser errors persist**, try incognito mode

## Emergency Troubleshooting
If nothing works:
1. Restart your computer
2. Use a different browser or incognito mode
3. Temporarily disable antivirus/firewall
4. Check Windows Defender isn't blocking the ports
