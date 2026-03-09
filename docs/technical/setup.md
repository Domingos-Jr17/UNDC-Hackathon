# 🚀 WIRA Development Environment Setup Guide

## 📋 Overview

This guide will help you set up and start all components of the WIRA platform in development mode:
- **Backend API** (Node.js + TypeScript + Prisma + SQLite)
- **Web Frontend** (React + Vite + Material-UI)
- **Mobile Application** (React Native + Expo)

---

## 🔧 Step 1: Check Prerequisites

### Node.js and npm
```bash
# Check installed versions
node --version  # Must be >= 14.0.0
npm --version   # Must be >= 8.0.0
```

### Git (optional, for version control)
```bash
git --version
```

---

## 🗄️ Step 2: Set Up Backend

### 2.1 Install Dependencies
```bash
cd wira-platform/backend
npm install
```

### 2.2 Initialize Database
```bash
# Run migrations and create initial data
npm run migrate

# Populate database with demo data
npm run seed
```

### 2.3 Start Backend Server
```bash
# Development mode with hot reload
npm run dev

# Alternatively:
npm run dev:watch
```

The backend server will start at: **http://localhost:3000**

### 2.4 Verify Backend
```bash
# Health check
curl http://localhost:3000/health

# API documentation
curl http://localhost:3000/api
```

---

## 🖥️ Step 3: Set Up Web Frontend

### 3.1 Install Dependencies
```bash
cd wira-platform/frontend
npm install
```

### 3.2 Start Frontend Server
```bash
npm run dev
```

The web frontend will start at: **http://localhost:5173**

### 3.3 NGO Dashboard Access
- URL: http://localhost:5173
- Demo Login:
  - Email: `demo@ong.org`
  - Password: `demo123`

---

## 📱 Step 4: Set Up Mobile Application

### 4.1 Install Dependencies
```bash
cd wira-platform/mobile-app
npm install
```

### 4.2 Start Expo Development Server
```bash
npm start
```

### 4.3 Access Application
- **Web**: Open browser at the address provided by Expo
- **Android**: Use Expo Go app and scan the QR code
- **iOS**: Use Expo Go app and scan the QR code

### 4.4 Demo Access Codes
- **V0042**: Beneficiaria A (Sewing - 37% complete)
- **V0038**: Ana Joaquim (Cooking - New)
- **V0031**: João Mandlate (Agriculture - 15% complete)

---

## 🧪 Step 5: Verify Connectivity

### 5.1 Test API Endpoints
```bash
# Verify API status
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"anonymousCode": "V0042"}'

# List courses
curl http://localhost:3000/api/courses

# Check progress
curl http://localhost:3000/api/progress/user/V0042/course/costura-001
```

### 5.2 Test USSD
```bash
# Test USSD endpoint
curl -X POST http://localhost:3000/api/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"text": "V0042"}'
```

---

## 🛠️ Service Structure

### Backend (Port 3000)
- **RESTful API**: Endpoints for all operations
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with anonymous codes
- **Security**: Rate limiting, encryption, audit trails

### Web Frontend (Port 5173)
- **NGO Dashboard**: User management and progress tracking
- **Reports**: Statistics and export
- **Activation**: New user registration

### Mobile App (Expo Port)
- **Anonymous Access**: Login with V#### codes
- **Courses**: Access to materials and progress
- **Quizzes**: Assessments with immediate feedback
- **Certificates**: Generation and sharing

---

## 🔍 Final Verification

### Functionality Checklist
- [ ] Backend API responding at localhost:3000
- [ ] Web frontend loading at localhost:5173
- [ ] Expo app running and accessible
- [ ] Database initialized with demo data
- [ ] Anonymous login working (codes V0042, V0038, V0031)
- [ ] USSD responding to test endpoint
- [ ] No critical errors in logs

### Important URLs
- **API Health**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api
- **Web Frontend**: http://localhost:5173
- **Expo Dev Tools**: http://localhost:19002 (typically)

---

## 🚨 Troubleshooting

### Occupied Ports
```bash
# Check ports in use
netstat -tlnp | grep :3000
netstat -tlnp | grep :5173

# Kill processes
sudo kill -9 <PID>
```

### Database Problems
```bash
# Recreate database
cd wira-platform/backend
rm -f data/wira.db
npm run migrate
npm run seed
```

### Dependency Problems
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Next Steps

1. **Run automated tests**: `npm test` (in each directory)
2. **Validate critical flows**: Login, courses, certificates
3. **Test USSD functionality**: Complete simulation
4. **Verify security**: Rate limiting, encryption
5. **Test performance**: Response time, load

---

## 🎯 Priority Test Scenarios

### 1. Authentication and Access
- Login with anonymous codes
- JWT token validation
- Rate limiting on login attempts

### 2. Course System
- Listing available courses
- Individual progress per module
- Quiz with immediate feedback

### 3. Certificates
- Automatic generation
- QR code verification
- Digital sharing

### 4. USSD
- Complete menu navigation
- Access via basic phones
- Session timeout

### 5. NGO Dashboard
- New user activation
- Progress monitoring
- Reports and statistics

---

**Environment successfully configured!** 🎉

Now you're ready to start testing the WIRA platform in development mode.
