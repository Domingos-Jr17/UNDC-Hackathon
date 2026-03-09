# 🚀 QUICK GUIDE - HOW TO INITIALIZE AND TEST THE WIRA USSD/SMS SYSTEM

## 📋 PREREQUISITES

### **Required Software:**

- Node.js (v14 or higher)
- Modern web browser (Chrome, Firefox, Edge)
- Command-line terminal
- Internet connection (to load frontend)

---

## 🎯 **STEP 1: START THE SYSTEM**

### **1.1 Open Terminal**

```bash
# Navigate to the project directory
cd E:\IT-developer\Hackathons\hackathos_trafico_de_pessoas\mvp\test_hack\wira-platform\backend
```

### **1.2 Start USSD/SMS Server**

**Option A: Use JavaScript (Recommended for Demo)**

```bash
# Start complete server
node ussd-server.js

# Server should respond:
🚀 WIRA USSD/SMS Enhanced Server started on port 3000
📊 Health: http://localhost:3000/health
📱 USSD Test: curl -X POST http://localhost:3000/api/ussd/test
📧 SMS Status: http://localhost:3000/api/sms/status
🎬 Demo Sequence: http://localhost:3000/api/demo/ussd/sequence

📱 USSD Shortcode: *123#
📞 SMS Service: Online (Mock)
⏰ Session Timeout: 5 minutes
```

**Option B: Use TypeScript (For Development)**

```bash
# Install TypeScript dependencies
npm install

# Start TypeScript server in development mode
npm run dev:ussd

# Or compile and run
npm run build
npm run start:ussd

# For the simple TypeScript server
npm run dev:simple
```

### **1.3 Start Demo Frontend**

```bash
# Open new terminal
cd E:\IT-developer\Hackathons\hackathos_trafico_de_pessoas\mvp\test_hack\wira-platform\frontend
node serve.cjs

# Frontend should respond:
🚀 WIRA Dashboard Server started on port 3001
📊 Dashboard: http://localhost:3001
🔧 Backend: http://localhost:3000
```

---

## 🧪 **STEP 2: VERIFY OPERATION**

### **2.1 Health Check Test**

```bash
# Verify if server is online
curl http://localhost:3000/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2025-10-27T11:10:52.491Z",
  "uptime": 20.5872537,
  "environment": "development",
  "version": "3.0.0-ussd-enhanced",
  "services": {
    "api": "online",
    "ussd": "online",
    "sms": "online (mock)",
    "database": "connected (memory)"
  }
}
```

### **2.2 Basic USSD Test**

```bash
# Test initial USSD screen
curl -X POST http://localhost:3000/api/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"text":""}'

# Expected response:
{
  "success": true,
  "response": "CON Welcome to WIRA - Women's Integrated Reintegration Academy\n\nYour access code (ex: V0042):",
  "sessionId": "test_1761563453350",
  "step": "login"
}
```

---

## 📱 **STEP 3: COMPLETE USSD TEST**

### **3.1 Login Sequence**

```bash
# Step 1: Login with code V0042
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo123","phoneNumber":"+258840000000","text":"V0042"}'

# Expected response:
{
  "success": true,
  "response": "CON Welcome, Maria! 👋\n\nHow can we help?\n1. My Courses\n2. My Progress\n3. Help\n4. Exit",
  "sessionId": "demo123",
  "step": "main_menu"
}
```

### **3.2 Menu Navigation**

```bash
# View progress (option 2)
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo123","phoneNumber":"+258840000000","text":"2"}'

# View courses (option 1)
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo123","phoneNumber":"+258840000000","text":"1"}'

# Help menu (option 3)
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo123","phoneNumber":"+258840000000","text":"3"}'
```

### **3.3 Available Access Codes**

- **V0042** - Beneficiária A (Sewing 37%, Cooking 14%)
- **V0038** - Beneficiária B (Cooking 14%)
- **V0031** - Beneficiário F (Sewing 100% - with certificate)

---

## 📧 **STEP 4: SMS SYSTEM TEST**

### **4.1 Check SMS Status**

```bash
# Check SMS service
curl http://localhost:3000/api/sms/status

# Expected response:
{
  "success": true,
  "service": "WIRA SMS Service",
  "status": "Online (Mock)",
  "totalSent": 0,
  "recentMessages": [],
  "timestamp": "2025-10-27T11:11:15.147Z"
}
```

### **4.2 Send Manual SMS**

```bash
# Send test SMS
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+258841234567","message":"WIRA SMS Test - Working!"}'

# Expected response:
{
  "success": true,
  "message": "SMS sent successfully",
  "sms": {
    "id": 1761563525667,
    "to": "+258841234567",
    "message": "WIRA SMS Test - Working!",
    "sentAt": "2025-10-27T11:12:05.667Z",
    "status": "sent",
    "provider": "mock-sms-provider"
  }
}
```

### **4.3 Check Sent SMS**

```bash
# List all SMS
curl http://localhost:3000/api/sms/all

# Shows automatic SMS sent by USSD
```

---

## 🎬 **STEP 5: AUTOMATIC DEMONSTRATION**

### **5.1 Complete Automatic Sequence**

```bash
# Execute complete USSD demo
curl http://localhost:3000/api/demo/ussd/sequence

# Expected response with 3 steps:
{
  "success": true,
  "demoSequence": [
    {
      "step": "Welcome",
      "response": "CON Welcome to WIRA..."
    },
    {
      "step": "Login",
      "response": "CON Welcome, Maria! 👋..."
    },
    {
      "step": "Progress",
      "response": "CON GENERAL PROGRESS - V0042..."
    }
  ]
}
```

---

## 🖥️ **STEP 6: ACCESS INTERACTIVE FRONTENDS**

### **6.1 Main Dashboard**

- **URL:** `http://localhost:3001`
- **Features:** KPIs, progress, USSD status

### **6.2 USSD/SMS Demonstration**

- **URL:** `http://localhost:3001/ussd-demo.html`
- **Features:**
  - USSD phone simulator
  - Interactive SMS chat
  - Quick templates
  - Automatic demo
  - Real-time system status

### **6.3 How to Use USSD Frontend:**

1. **USSD Keyboard:** Type `*123#` then `V0042`
2. **Navigation:** Use number buttons 1-4
3. **SMS:** Type message and click "Send"
4. **Demo:** Click "Automatic Demo" for complete test

---

## 🔧 **STEP 7: TROUBLESHOOTING**

### **7.1 Common Problems and Solutions**

| Problem                  | Cause              | Solution                                  |
| ------------------------ | ------------------ | ----------------------------------------- |
| "address already in use" | Port 3000 occupied | Close other Node.js processes             |
| "Connection refused"     | Server not started | Check if `node ussd-server.js` is running |
| "Invalid JSON"           | Formatting error   | Use double quotes in JSON                 |
| "Session expired"        | USSD timeout       | Use new session or restart browser        |

### **7.2 Useful Commands**

```bash
# Check ports in use
netstat -ano | findstr :3000

# Kill Node.js processes
taskkill /f /im node.exe

# Restart complete server
# Close current terminal and open new one
```

### **7.3 Connectivity Verification**

```bash
# Test connectivity with backend
curl -v http://localhost:3000/health

# Test USSD endpoint
curl -v -X POST http://localhost:3000/api/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"text":""}'

# Test SMS endpoint
curl -v http://localhost:3000/api/sms/status
```

---

## 📊 **STEP 8: MONITORING**

### **8.1 Real-Time Status**

```bash
# USSD Status
curl http://localhost:3000/api/ussd/status

# SMS Status
curl http://localhost:3000/api/sms/status

# Complete Health Check
curl http://localhost:3000/health
```

### **8.2 System Logs**

The server displays real-time logs:

```
📱 USSD Request: Session=demo123, Phone=+258840000000, Text="V0042"
📤 USSD Response: CON Welcome, Maria! 👋
✅ User authenticated: V0042
📱 Sending SMS to +258840000000: "Welcome Maria to WIRA!"
✅ SMS sent successfully! ID: 1761563525667
```

---

## 🎯 **STEP 9: JUDGE DEMONSTRATION**

### **9.1 Suggested Script (2 minutes)**

**Minute 1: Backend API**

```bash
# Show health check
curl http://localhost:3000/health

# Show USSD login
curl -X POST http://localhost:3000/api/ussd/test -d '{"text":"V0042"}'
```

**Minute 2: Interactive Frontend**

- Access: `http://localhost:3001/ussd-demo.html`
- Click "Automatic Demo"
- Show USSD navigation and automatic SMS sending

### **9.2 Points to Highlight**

1. **USSD works without internet** - real digital inclusion
2. **Automatic SMS** - proactive communication
3. **Anonymous codes** - V0042, V0038, V0031
4. **Professional frontend** - clear demonstration
5. **Complete integration** - USSD ↔ SMS ↔ Dashboard

---

## 🚨 **STEP 10: BACKUP AND RECOVERY**

### **10.1 Important Files**

- `ussd-server.js` - Main USSD/SMS Server
- `ussd-demo.html` - Demo Frontend
- `simple-server.js` - Basic Backend (backup)

### **10.2 Settings**

- **USSD Port:** 3000
- **Frontend Port:** 3001
- **Session Timeout:** 5 minutes
- **USSD Shortcode:** \*123#

### **10.3 Demo Data**

- **Users:** V0042 (Maria), V0038 (Ana), V0031 (João)
- **Courses:** Sewing, Cooking, Agriculture
- **Progress:** Realistic data (37%, 14%, 100%)

---

## ✅ **FINAL FUNCTIONALITY CHECKLIST**

- [ ] **USSD/SMS server running** on port 3000
- [ ] **Demo frontend** accessible at 3001
- [ ] **USSD login** working with V0042
- [ ] **Complete navigation** through USSD menus
- [ ] **Automatic SMS sending** after USSD actions
- [ ] **Manual SMS** sending and receiving
- [ ] **Health check** responding correctly
- [ ] **Logs visible** in terminal
- [ ] **Automatic demo** working
- [ ] **Frontend-backend integration** operational

---

## 🔧 **TYPESCRIPT MIGRATION INFORMATION**

### **Migrated Files**

- ✅ `src/types/ussd.ts` - Complete type definitions
- ✅ `src/simple-server.ts` - Basic server with typing
- ✅ `src/ussd-server.ts` - Complete USSD server with typing
- ✅ `package.json` - Build and development scripts for TypeScript

### **Available TypeScript Scripts**

```bash
npm run dev:ussd      # USSD Server Development
npm run dev:simple    # Simple Server Development
npm run build         # Compile TypeScript to JavaScript
npm run start:ussd    # Execute Compiled USSD Server
npm run start:simple  # Execute Compiled Simple Server
npm run demo          # Build + Execute USSD Server
```

### **Migration Advantages**

- 🔒 **Type Safety**: Type checking during compilation
- 🛠️ **Better IDE**: Auto-complete and refactoring
- 📚 **Documentation**: Types as living documentation
- 🔧 **Maintainability**: More robust and scalable code

### **Development Note**

For presentations and demonstrations, use the JavaScript version (`node ussd-server.js`) as it's simpler and more direct. For future development, prefer the TypeScript version.

---

## 🎉 **READY FOR PRESENTATION!**

If all items above are marked ✅, the WIRA USSD/SMS system is **100% functional** and ready for demonstration at the UNODC Hackathon!

**Important URLs:**

- 📱 **USSD Demo:** `http://localhost:3001/ussd-demo.html`
- 📊 **Dashboard:** `http://localhost:3001`
- 🔧 **API Health:** `http://localhost:3000/health`

**Good luck with your presentation!** 🚀
