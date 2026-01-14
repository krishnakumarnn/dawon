# Database Connection & Image URL Fix - Implementation Summary

## 🎯 Problem Identified
The database was storing image URLs pointing to `http://localhost:3000/uploads/...` (the storefront frontend) instead of `http://localhost:9000/uploads/...` (the backend API). This causes images to fail loading because:
- Port 3000 is the storefront (doesn't serve images)
- Port 9000 is the backend API (should serve images)

## ✅ Solutions Implemented

### 1. **Backend Upload Handler Fix**
**File:** `/Users/User/daw-store/backend/src/api/store/admin-upload-image/route.ts`

- Modified upload endpoint to return full URLs with `API_URL` prefix
- Changed from: `{ url: "/uploads/{filename}" }`
- Changed to: `{ url: "http://localhost:9000/uploads/{filename}" }`

### 2. **Environment Configuration**
**File:** `/Users/User/daw-store/backend/.env`

- Added `API_URL=http://localhost:9000`
- This controls the base URL for image responses

### 3. **Image Serving Endpoint**
**File:** `/Users/User/daw-store/backend/src/api/uploads/[...path]/route.ts` (NEW)

- Created new route handler to serve image files from backend API
- Endpoint: `GET /uploads/{filename}`
- Security: Validates file paths to prevent directory traversal
- Caching: Sets 1-year cache headers for performance
- Returns proper MIME types (png, jpg, gif, webp)

### 4. **Database URL Migration**
**Script:** `/Users/User/daw-store/fix-image-urls.js`

- Fixes existing database entries with wrong URLs
- Updates relative URLs (`/uploads/...`) to absolute (`http://localhost:9000/uploads/...`)
- Replaces `localhost:3000` URLs with `localhost:9000`

## 🚀 Next Steps

### Local Testing
1. Stop and restart backend service:
   ```bash
   npm run dev  # in /backend directory
   ```

2. Run the database migration:
   ```bash
   cd /Users/User/daw-store
   node fix-image-urls.js
   ```

3. Test image upload in admin panel
4. Verify images load correctly on storefront

### VM Deployment
1. Create equivalent `.env` for VM with `API_URL=http://158.180.37.41:9000`
2. Sync backend files to VM:
   ```bash
   rsync -avz /Users/User/daw-store/backend/ ubuntu@158.180.37.41:/home/ubuntu/dawon/backend/
   ```

3. Run the migration on VM database:
   ```bash
   API_URL="http://158.180.37.41:9000" node fix-image-urls.js
   ```

## 📋 Files Modified

| File | Change |
|------|--------|
| `backend/src/api/store/admin-upload-image/route.ts` | Return full URLs instead of relative paths |
| `backend/.env` | Added `API_URL=http://localhost:9000` |
| `backend/src/api/uploads/[...path]/route.ts` | **NEW** - Image serving endpoint |
| `fix-image-urls.js` | **NEW** - Database migration script |
| `fix-image-urls.py` | **NEW** - Python migration script (alt) |
| `fix-image-urls-local.sh` | **NEW** - Bash migration script (alt) |

## 🔗 Connection Flow (After Fix)

```
Admin Panel (3000/3001)
    ↓
Backend API (9000)
    ├─→ Upload: POST /uploads
    │   └─→ Saves to: storefront/public/uploads/
    │   └─→ Returns: http://localhost:9000/uploads/{filename}
    │
    └─→ Serve: GET /uploads/{filename}
        └─→ Reads from: storefront/public/uploads/
        └─→ Returns: Image file with proper headers

Database (5433)
    └─→ Stores: http://localhost:9000/uploads/{filename}

Storefront (3000/3001)
    └─→ Requests: http://localhost:9000/uploads/{filename}
        └─→ Images load correctly!
```

## ⚠️ Important Notes

1. **API_URL Environment Variable:** Must match the actual backend address
   - Local: `http://localhost:9000`
   - VM: `http://158.180.37.41:9000`

2. **Database Consistency:** Run migration script after updating environment to ensure all URLs are correct

3. **Docker/VM Setup:** When deployed on VM, ensure:
   - PostgreSQL database is accessible
   - Backend service is running on port 9000
   - Environment variables are set correctly
   - Uploads directory has proper permissions

4. **Cache Considerations:** Images are cached for 1 year. If you need to force refresh during testing, clear browser cache.
