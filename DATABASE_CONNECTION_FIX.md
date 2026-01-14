# Database & Image URL Connection Fix Guide

## 🔍 Problem Summary

**Issue:** Images in the database are pointing to the wrong URL endpoint
- ❌ **Wrong:** `http://localhost:3000/uploads/image.jpg` (storefront frontend)
- ✅ **Correct:** `http://localhost:9000/uploads/image.jpg` (backend API)

This causes image load failures because the storefront frontend (port 3000) doesn't serve images - the backend API (port 9000) does.

---

## 🛠️ Solution Overview

The fix involves 3 components:

### 1. **Backend Upload Handler** 
Returns full absolute URLs when images are uploaded

### 2. **Image Serving Endpoint**
Backend API now serves images from `/uploads/{filename}`

### 3. **Database Migration**
Updates all existing image URLs to point to correct endpoint

---

## 📦 Local Setup (Development)

### Prerequisites
- Backend running on port 9000
- PostgreSQL running on port 5433
- Node.js installed

### Step 1: Apply Code Changes ✅ (Already Done)

The following files have been updated:

**A) Backend Upload Handler**
```typescript
// File: backend/src/api/store/admin-upload-image/route.ts
// Returns: http://localhost:9000/uploads/{filename}
```

**B) Image Serving Endpoint**
```typescript
// File: backend/src/api/uploads/[...path]/route.ts (NEW)
// GET /uploads/* → serves images with proper headers
```

**C) Environment Config**
```bash
# File: backend/.env
API_URL=http://localhost:9000
```

### Step 2: Restart Backend

```bash
cd /Users/User/daw-store/backend
npm install  # if dependencies changed
npm run dev
```

### Step 3: Fix Existing Database Records

```bash
cd /Users/User/daw-store

# Option A: Node.js script (recommended)
node fix-image-urls.js

# Option B: Direct psql command
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db << EOF
UPDATE image SET url = 'http://localhost:9000' || url 
WHERE url LIKE '/uploads/%' AND url NOT LIKE 'http%';

UPDATE image SET url = REPLACE(url, 'http://localhost:3000', 'http://localhost:9000')
WHERE url LIKE '%localhost:3000%';
EOF
```

### Step 4: Verify Fix

Open admin panel and test:
1. Upload an image
2. Check database to see full URL
3. Verify image loads in storefront

```bash
# Check database
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db -c \
  "SELECT url FROM image WHERE url LIKE '%uploads%' LIMIT 5;"
```

---

## 🌍 VM Deployment

### Step 1: Prepare VM Environment Variables

VM uses different host IP: `158.180.37.41`

```bash
# File: /Users/User/daw-store/.env.vm (already created)
API_URL=http://158.180.37.41:9000
DATABASE_URL=postgresql://medusa:medusa@VM_HOST:5433/medusa_db
# ... other config
```

### Step 2: Deploy to VM

**Automated Deployment (Recommended):**
```bash
chmod +x /Users/User/daw-store/deploy-to-vm.sh
/Users/User/daw-store/deploy-to-vm.sh
```

**Manual Deployment:**

```bash
# 1. Sync backend with correct .env
rsync -avz /Users/User/daw-store/backend/ \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/backend/

# 2. Update VM backend .env
scp /Users/User/daw-store/.env.vm \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/backend/.env

# 3. Sync other services
rsync -avz /Users/User/daw-store/admin/ \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/admin/

rsync -avz /Users/User/daw-store/storefront/ \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/storefront/
```

### Step 3: Configure Admin & Storefront on VM

```bash
# SSH into VM
ssh ubuntu@158.180.37.41

# Configure admin panel
cat > /home/ubuntu/dawon/admin/.env.local << EOF
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EOF

# Configure storefront
cat > /home/ubuntu/dawon/storefront/.env.local << EOF
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EOF
```

### Step 4: Fix VM Database URLs

On VM, connect to database and run migration:

```bash
# Option 1: Via SSH
ssh ubuntu@158.180.37.41 << 'EOF'
cd /home/ubuntu/dawon
API_URL="http://158.180.37.41:9000" node fix-image-urls.js
EOF

# Option 2: Manual update
export PGPASSWORD=medusa
psql -h VM_HOST -p 5433 -U medusa -d medusa_db << EOF
UPDATE image 
SET url = 'http://158.180.37.41:9000' || url 
WHERE url LIKE '/uploads/%' AND url NOT LIKE 'http%';

UPDATE image 
SET url = REPLACE(url, 'http://localhost:9000', 'http://158.180.37.41:9000')
WHERE url LIKE '%localhost:9000%';
EOF
```

---

## 📡 Connection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSERS                          │
└────────┬──────────────────────────────────────────────────┬─┘
         │                                                  │
      Port 3000/3001                                  Port 3000/3001
    Storefront/Admin                               (VM Address)
         │                                                  │
         └──────────────────┬───────────────────────────────┘
                            │
                     Load Images/Data
                     (HTTP Requests)
                            │
         ┌──────────────────▼───────────────────────┐
         │    BACKEND API - Port 9000               │
         │  (localhost or 158.180.37.41)            │
         │                                          │
         │  Endpoints:                             │
         │  - POST /store/admin-upload-image       │
         │  - GET  /uploads/{filename}             │
         │  - POST /store/admin-products           │
         │  - GET  /store/products                 │
         └──────────────────┬──────────────────────┘
                            │
                       Connect to DB
                       (Port 5433)
                            │
         ┌──────────────────▼───────────────────────┐
         │     POSTGRESQL DATABASE                  │
         │    Port 5433 or custom port             │
         │                                          │
         │  image table:                           │
         │  - url: "http://localhost:9000/uploads" │
         │  - created_at: timestamp                │
         │  - id: uuid                             │
         └──────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

### Local
- [ ] Backend running on port 9000
- [ ] Admin panel accessible on port 3001
- [ ] Storefront accessible on port 3000
- [ ] Can upload image in admin
- [ ] Image URL in DB shows `http://localhost:9000/uploads/...`
- [ ] Image displays in storefront
- [ ] No CORS errors in browser console

### VM
- [ ] Backend running on VM port 9000
- [ ] Admin configured with `NEXT_PUBLIC_API_URL=http://158.180.37.41:9000`
- [ ] Storefront configured with same API URL
- [ ] Database image URLs show `http://158.180.37.41:9000/uploads/...`
- [ ] Can upload images in VM admin panel
- [ ] Images load from VM storefront

---

## 🐛 Troubleshooting

### Images not loading
```bash
# Check browser console for 404 or CORS errors
# Verify image URLs in database:
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT url FROM image LIMIT 5;"
```

### API connection errors
```bash
# Test backend connectivity
curl http://localhost:9000/store/products
curl http://158.180.37.41:9000/store/products  # from VM

# Check CORS configuration in backend/.env
# Should include the frontend addresses
```

### Database connection issues
```bash
# Test DB connection
psql -h localhost -p 5433 -U medusa -d medusa_db -c "SELECT 1;"
psql -h 158.180.37.41 -p 5433 -U medusa -d medusa_db -c "SELECT 1;"
```

---

## 📚 Key Files Changed

| File | Purpose |
|------|---------|
| `backend/src/api/store/admin-upload-image/route.ts` | Upload handler - returns full URLs |
| `backend/src/api/uploads/[...path]/route.ts` | Image serving endpoint |
| `backend/.env` | Added `API_URL` configuration |
| `fix-image-urls.js` | Database migration script |
| `.env.vm` | VM environment configuration |
| `deploy-to-vm.sh` | Automated VM deployment |

---

## 🚀 Quick Commands

```bash
# Local: Fix database
cd /Users/User/daw-store && node fix-image-urls.js

# Local: Restart backend
cd /Users/User/daw-store/backend && npm run dev

# Deploy to VM
cd /Users/User/daw-store && ./deploy-to-vm.sh

# VM: Fix database after deployment
ssh ubuntu@158.180.37.41 "cd /home/ubuntu/dawon && \
  API_URL=http://158.180.37.41:9000 node fix-image-urls.js"
```

---

## 📞 Support

For issues:
1. Check the troubleshooting section
2. Verify all environment variables are correct
3. Ensure ports are not conflicting
4. Check database connectivity
5. Review browser console for errors
