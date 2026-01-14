# 🔧 Database Connection Fix - Implementation Checklist

## Status: COMPLETE ✅

All code changes have been implemented. Follow these steps to finalize the fix for local and VM.

---

## 📋 LOCAL ENVIRONMENT - ACTION REQUIRED

### 1. Restart Backend Service
```bash
cd /Users/User/daw-store/backend
npm run dev
```
**Expected:** Backend running on port 9000, serving images

---

### 2. Fix Database Image URLs

**Choose one method:**

**Method A: Node.js Script (Recommended)**
```bash
cd /Users/User/daw-store
node fix-image-urls.js
```

**Method B: Direct SQL (Manual)**
```bash
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db << 'SQL'
UPDATE image SET url = 'http://localhost:9000' || url 
WHERE url LIKE '/uploads/%' AND url NOT LIKE 'http%';

UPDATE image SET url = REPLACE(url, 'http://localhost:3000', 'http://localhost:9000')
WHERE url LIKE '%localhost:3000%';
SQL
```

**Expected Output:**
```
📊 Image URL statistics:
   Total images: XX
   Absolute URLs (http://...): XX
   Relative URLs (/...): 0
```

---

### 3. Verify Local Fix

**Check database:**
```bash
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db -c \
  "SELECT url FROM image LIMIT 3;"
```

**Expected:** All URLs show `http://localhost:9000/uploads/...`

**Test in Browser:**
1. Open admin: http://localhost:3001
2. Upload new image → should see full URL in response
3. Check storefront: http://localhost:3000 → images should load

---

## 🌍 VM ENVIRONMENT - ACTION REQUIRED

### Prerequisites
- [ ] SSH access to VM (ubuntu@158.180.37.41)
- [ ] Docker/Database running on VM
- [ ] Backend directory exists at `/home/ubuntu/dawon/backend`

### 1. Automated Deployment (Recommended)

```bash
cd /Users/User/daw-store
chmod +x deploy-to-vm.sh
./deploy-to-vm.sh
```

This will:
- ✅ Sync backend with .env configured for VM
- ✅ Sync admin & storefront with correct API URLs
- ✅ Sync uploads directory
- ✅ Configure all .env.local files

**Expected Output:**
```
✨ VM Deployment Complete!
```

---

### 2. Manual Deployment (If Automated Failed)

**A. Sync Backend**
```bash
rsync -avz /Users/User/daw-store/backend/ \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/backend/

scp /Users/User/daw-store/.env.vm \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/backend/.env
```

**B. Configure Admin**
```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cat > /home/ubuntu/dawon/admin/.env.local << EEOF
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EEOF
EOF
```

**C. Configure Storefront**
```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cat > /home/ubuntu/dawon/storefront/.env.local << EEOF
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EEOF
EOF
```

**D. Sync Admin & Storefront**
```bash
rsync -avz /Users/User/daw-store/admin/ \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/admin/

rsync -avz /Users/User/daw-store/storefront/ \
  ubuntu@158.180.37.41:/home/ubuntu/dawon/storefront/
```

---

### 3. Start Backend on VM

```bash
ssh ubuntu@158.180.37.41
cd /home/ubuntu/dawon/backend
npm install
npm run dev
```

**Expected:** Backend running on port 9000

---

### 4. Fix VM Database URLs

```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cd /home/ubuntu/dawon
API_URL="http://158.180.37.41:9000" node fix-image-urls.js
EOF
```

**Expected Output:**
```
📍 API URL: http://158.180.37.41:9000
✅ Updated X images with relative URLs
✅ Updated X images with localhost:3000
📊 Total images: XX
✨ Migration complete!
```

---

## ✅ Verification Checklist

### Local Verification
- [ ] Backend running: `curl http://localhost:9000/store/products`
- [ ] Database URLs fixed: `psql ... "SELECT url FROM image LIMIT 1;"`
- [ ] Admin uploads work: Upload image in admin panel
- [ ] Storefront displays: Images visible on http://localhost:3000
- [ ] Browser console: No CORS/404 errors

### VM Verification
- [ ] Backend running: `ssh ubuntu@158.180.37.41 "curl http://localhost:9000/store/products"`
- [ ] Database fixed: SSH in and check image URLs
- [ ] Admin accessible: http://158.180.37.41:3001
- [ ] Storefront accessible: http://158.180.37.41:3000
- [ ] Images load: Check browser network tab

---

## 🔄 Connection Flow After Fix

```
Storefront (Port 3000)
    ↓
Requests image: /uploads/file.jpg
    ↓
Backend API (Port 9000)
    ↓
GET /uploads/file.jpg
    ↓
Serves from: storefront/public/uploads/file.jpg
    ↓
Returns: Image with correct headers
    ↓
Browser displays ✅
```

---

## 📊 Summary of Changes

### Code Changes (Backend)
1. **Upload Handler** - Returns full URLs instead of relative paths
2. **Image Serving** - New endpoint to serve images from backend
3. **Environment** - Added `API_URL` configuration

### Database Changes
- Fix relative URLs to absolute: `/uploads/file.jpg` → `http://localhost:9000/uploads/file.jpg`
- Fix wrong host URLs: `localhost:3000` → `localhost:9000`

### Configuration Changes
- Local: `API_URL=http://localhost:9000`
- VM: `API_URL=http://158.180.37.41:9000`

---

## 📁 New/Modified Files

### New Files Created
- ✅ `backend/src/api/uploads/[...path]/route.ts` - Image serving
- ✅ `fix-image-urls.js` - Database migration
- ✅ `fix-image-urls.py` - Alternative Python migration
- ✅ `fix-image-urls-local.sh` - Alternative Bash migration
- ✅ `.env.vm` - VM environment configuration
- ✅ `deploy-to-vm.sh` - Automated deployment script
- ✅ `IMAGE_URL_FIX_SUMMARY.md` - Technical summary
- ✅ `DATABASE_CONNECTION_FIX.md` - Detailed guide

### Modified Files
- ✅ `backend/.env` - Added `API_URL=http://localhost:9000`
- ✅ `backend/src/api/store/admin-upload-image/route.ts` - Return full URLs

---

## 🚨 Common Issues & Solutions

### Images still not loading
```bash
# 1. Verify backend is running
curl http://localhost:9000/uploads/test.jpg

# 2. Check image URL in database
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT url FROM image LIMIT 1;"

# 3. Clear browser cache and reload
```

### CORS errors in console
```bash
# Check CORS configuration in backend/.env
# Ensure frontend addresses are listed:
# STORE_CORS=http://localhost:3000,http://localhost:3001,...
# ADMIN_CORS=http://localhost:3001,http://localhost:5173,...
```

### Database connection failed
```bash
# Test connection
psql -h localhost -p 5433 -U medusa -d medusa_db -c "SELECT 1;"

# If fails, check:
# - PostgreSQL running: docker ps | grep postgres
# - Correct port: 5433 (not 5432)
# - Correct credentials: medusa/medusa
```

---

## 📞 Need Help?

Refer to: `DATABASE_CONNECTION_FIX.md` for detailed troubleshooting

---

## ✨ Status Summary

| Item | Status | Details |
|------|--------|---------|
| Code Implementation | ✅ Complete | Upload handler, image serving, env config |
| Local Configuration | ⏳ Pending | Need to run fix-image-urls.js |
| VM Configuration | ⏳ Pending | Run deploy-to-vm.sh script |
| Documentation | ✅ Complete | 3 detailed guides provided |
| Testing | ⏳ Pending | User to verify after implementation |

---

**Last Updated:** January 14, 2026
**Author:** GitHub Copilot
**Status:** Ready for Implementation
