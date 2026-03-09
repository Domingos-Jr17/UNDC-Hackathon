# ðŸ“± WIRA USSD System - Complete Documentation

## ðŸŽ¯ Overview

The WIRA USSD System allows human trafficking victims to access the educational platform through basic phones, without requiring internet. This digital inclusion ensures that all beneficiaries can have access to professional training, regardless of their device or location.

---

## ðŸ—ï¸ Technical Architecture

### **Implemented Components**

1. **USSD Backend** ([`ussd.routes.js`](backend/src/routes/ussd.routes.js))
   - State machine for navigation
   - Session management in memory
   - Access code validation
   - Integration with SQLite database

2. **API Endpoints**
   - `POST /api/ussd` - Main endpoint for operators
   - `POST /api/ussd/test` - Endpoint for local testing
   - `GET /api/ussd/status` - Service status

3. **Sessions**
   - 5-minute timeout of inactivity
   - Temporary state storage
   - Automatic cleanup of expired sessions

---

## ðŸ“‹ USSD Navigation Flows

### **Flow 1: Login and Access**

```
1. User dials *123#
2. System responds:
   CON Welcome to WIRA - Women's Integrated Reintegration Academy

   Enter your access code (e.g.: V0042):

3. User enters: V0042
4. System validates and responds:
   CON Welcome, V0042!

   How can we help?
   1. My Courses
   2. My Progress
   3. Help
   4. Exit
```

### **Flow 2: Course Inquiry**

```
SELECTED: 1. My Courses

CON YOUR COURSES:

1. Sewing - School Uniforms
   Progress: 37% complete

2. Professional Cooking
   Progress: New

3. Sustainable Agriculture
   Progress: 15% complete

0. Return to main menu
```

### **Flow 3: Course Details**

```
SELECTED: 1. Sewing

CON Sewing - School Uniforms

Progress: 37% complete
Modules: 8/8
Duration: 40 hours

Options:
1. Continue course
2. View certificate
0. Return
```

### **Flow 4: General Progress**

```
SELECTED: 2. My Progress

CON GENERAL PROGRESS - V0042

Active Courses: 3
Completed Modules: 12/24
Study Hours: 127
Last Activity: Today

Statistics:
â€¢ Sewing: 37% complete
â€¢ Cooking: New
â€¢ Agriculture: 15% complete

0. Return to menu
```

### **Flow 5: Help Menu**

```
SELECTED: 3. Help

CON WIRA - HELP CENTER

We are here to help!

Access Codes:
â€¢ Format: V#### (e.g.: V0042)
â€¢ Provided by your NGO

Support:
â€¢ Phone: +258 84 123 4567
â€¢ WhatsApp: +258 84 123 4567
â€¢ Email: ajuda@wira.org

Hours: Mon-Fri, 8am-5pm

0. Return to main menu
```

---

## ðŸ”§ Configuration and Installation

### **Prerequisites**
- Node.js 14+
- SQLite database
- Port 3000 available

### **Installation**

```bash
# 1. Navigate to backend directory
cd wira-platform/backend

# 2. Install dependencies
npm install

# 3. Start server
npm run dev

# Server will run on: http://localhost:3000
```

### **USSD Endpoints**

```bash
# Service status
GET http://localhost:3000/api/ussd/status

# Main operator endpoint
POST http://localhost:3000/api/ussd
Content-Type: application/json

{
  "sessionId": "session_123",
  "serviceCode": "*123#",
  "phoneNumber": "+258840000000",
  "text": "V0042*1*1"
}

# Test endpoint
POST http://localhost:3000/api/ussd/test
Content-Type: application/json

{
  "phoneNumber": "+258840000000",
  "text": "V0042"
}
```

---

## ðŸ§ª Testing and Simulation

### **Local Testing with cURL**

```bash
# 1. Initial test (welcome)
curl -X POST http://localhost:3000/api/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"text": ""}'

# 2. Test login with code
curl -X POST http://localhost:3000/api/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"text": "V0042"}'

# 3. Test course navigation
curl -X POST http://localhost:3000/api/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"text": "V0042*1"}'

# 4. Test course details
curl -X POST http://localhost:3000/api/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"text": "V0042*1*1"}'
```

### **Postman Testing**

1. **Create POST request** to `http://localhost:3000/api/ussd/test`
2. **Headers**: `Content-Type: application/json`
3. **Body (JSON)**:
   ```json
   {
     "phoneNumber": "+258840000000",
     "text": "V0042"
   }
   ```

### **Complete Simulation**

```bash
# Complete test sequence
#!/bin/bash

BASE_URL="http://localhost:3000/api/ussd/test"

echo "ðŸ§ª WIRA USSD TEST - Complete Sequence"
echo "====================================="

# Test 1: Welcome
echo -e "\n1. Initial screen..."
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"text": ""}' | head -1

# Test 2: Login
echo -e "\n2. Login with code V0042..."
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "V0042"}' | head -1

# Test 3: Main menu
echo -e "\n3. Main menu..."
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "V0042"}' | head -1

echo -e "\nâœ… Tests completed!"
```

---

## ðŸŒ Operator Integration

### **Standard USSD Format**

```json
{
  "sessionId": "unique_session_id",
  "serviceCode": "*123#",
  "phoneNumber": "+25884XXXXXXX",
  "text": "user_input_sequence"
}
```

### **Expected Response**

```
CON Interactive menu (Continuation)
END Final message (Termination)
```

### **Operator Configuration**

To integrate with mobile operators in Mozambique:

1. **mCel**: Configure webhook to `https://api.wira.org/ussd`
2. **Vodacom**: Implement callback URL
3. **Tmcel**: Register USSD endpoint

**Configuration example:**
```javascript
const ussdConfig = {
  shortcode: "*123#",
  endpoint: "https://api.wira.org/api/ussd",
  method: "POST",
  timeout: 30000,
  retries: 3
};
```

---

## ðŸ”’ Security and Validation

### **Implemented**
- âœ… **Code validation**: V#### format mandatory
- âœ… **Session timeout**: 5 minutes inactive
- âœ… **Rate limiting**: Prevention against abuse
- âœ… **Input sanitization**: Data cleaning
- âœ… **Logging**: Access audit

### **Demo Access Codes**
- **V0042**: Beneficiaria A - Sewing (37% complete)
- **V0038**: Beneficiaria B - Cooking (New)
- **V0031**: Beneficiario C - Agriculture (15% complete)

---

## ðŸ“Š Monitoring and Debugging

### **System Logs**

```bash
# View server logs
npm run dev

# USSD logs appear as:
ðŸ“± USSD Request: Session=session_123, Phone=+258840000000, Text="V0042"
ðŸ“¤ USSD Response: CON Welcome to WIRA...
âœ… User authenticated: V0042
ðŸ—‘ï¸ Session expired: session_456
```

### **Service Status**

```bash
# Check status
curl http://localhost:3000/api/ussd/status

# Expected response:
{
  "service": "WIRA USSD Service",
  "status": "Online",
  "activeSessions": 3,
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Complete Health Check**

```bash
curl http://localhost:3000/health

# Includes USSD status:
{
  "status": "OK",
  "services": {
    "api": "online",
    "ussd": "online",
    "database": "connected"
  }
}
```

---

## ðŸš€ Production Deploy

### **Environment Variables**

```env
# USSD Configuration
USSD_SHORTCODE=*123#
USSD_TIMEOUT=300000
USSD_MAX_SESSIONS=1000

# Security
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=https://wira.org

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
```

### **Docker Configuration**

```dockerfile
# Dockerfile for USSD service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### **Nginx Proxy**

```nginx
# nginx.conf for USSD
server {
    listen 80;
    server_name ussd.wira.org;

    location /api/ussd {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }
}
```

---

## ðŸ“ˆ Metrics and KPIs

### **Usage Metrics**
- **Active sessions**: Number of connected users
- **Completion rate**: % of courses completed via USSD
- **Average session time**: Duration of interactions
- **Drop-off rate**: % of incomplete sessions

### **Expected KPIs**
- **Accessibility**: +95% coverage in rural areas
- **Engagement**: 70% of weekly active users
- **Completion**: 60% course completion rate
- **Satisfaction**: >4.5/5 in evaluations

---

## ðŸ†˜ Support and Troubleshooting

### **Common Problems**

| Problem | Cause | Solution |
|----------|-------|---------|
| "Service unavailable" | Server offline | Restart backend |
| "Invalid code" | Wrong format | Use V#### |
| "Session expired" | Timeout | Restart navigation |
| "No response" | Slow network | Check connectivity |

### **Useful Commands**

```bash
# Check if server is running
ps aux | grep node

# Check occupied port
netstat -tlnp | grep :3000

# Test connectivity
telnet localhost 3000

# Check real-time logs
tail -f /var/log/wira/ussd.log
```

### **Support Contact**

- **Technical**: tech@wira.org
- **Operators**: operators@wira.org
- **Emergency**: +258 84 123 4567

---

## ðŸ”„ Future Roadmap

### **V1.1 (3 months)**
- ðŸ”„ M-Pesa integration for certificates
- ðŸ”„ Offline system with SMS
- ðŸ”„ Multilingual support (Emakhuwa, Xichangana)
- ðŸ”„ Advanced analytics

### **V2.0 (6 months)**
- ðŸ”„ AI for personalized recommendations
- ðŸ”„ Voice (IVR) complementary to USSD
- ðŸ”„ WhatsApp Business integration
- ðŸ”„ Dashboard USSD Analytics

---

## ðŸ“š References

- **USSD Guidelines**: GSMA USSD Best Practices
- **Security**: OWASP Mobile Security
- **Accessibility**: UN Digital Inclusion Standards
- **Privacy**: GDPR Compliant USSD Implementation

---

**WIRA USSD System** - Digital inclusion through accessible and empowering technology.

*Developed with â¤ï¸ for human trafficking victims in Mozambique*
