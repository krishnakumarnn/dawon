# 📚 Database Connection Fix - Complete Documentation Index

## 🎯 Start Here
- **[QUICK_START.md](QUICK_START.md)** ← **READ THIS FIRST!** 2-5 minute overview and quick commands

## 📖 Detailed Guides
- **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** - Step-by-step checklist with all commands for local and VM
- **[DATABASE_CONNECTION_FIX.md](DATABASE_CONNECTION_FIX.md)** - Complete guide with troubleshooting section
- **[CODE_CHANGES_DETAIL.md](CODE_CHANGES_DETAIL.md)** - Before/after code changes explained
- **[IMAGE_URL_FIX_SUMMARY.md](IMAGE_URL_FIX_SUMMARY.md)** - Technical architecture summary

## 🛠️ Scripts & Configuration
- **[fix-image-urls.js](fix-image-urls.js)** - Node.js script to fix database image URLs (recommended)
- **[fix-image-urls.py](fix-image-urls.py)** - Python alternative for fixing database URLs
- **[fix-image-urls-local.sh](fix-image-urls-local.sh)** - Bash alternative for fixing database URLs
- **[deploy-to-vm.sh](deploy-to-vm.sh)** - Automated VM deployment script
- **[.env.vm](.env.vm)** - VM environment configuration template

## 🔄 Quick Command Reference

### LOCAL (2 minutes)
```bash
# 1. Restart backend
cd /Users/User/daw-store/backend && npm run dev

# 2. Fix database
cd /Users/User/daw-store && node fix-image-urls.js
```

### VM (5 minutes)
```bash
# 1. Deploy everything
cd /Users/User/daw-store && ./deploy-to-vm.sh

# 2. Start backend on VM
ssh ubuntu@158.180.37.41
cd /home/ubuntu/dawon/backend && npm run dev

# 3. Fix database on VM
API_URL=http://158.180.37.41:9000 node fix-image-urls.js
```

---

## 📋 What Was Fixed

### Problem
Images pointed to wrong endpoint:
- ❌ `http://localhost:3000/uploads/...` (Storefront Frontend - doesn't serve images)
- ✅ `http://localhost:9000/uploads/...` (Backend API - serves images)

### Solution
1. ✅ Backend upload handler now returns full URLs
2. ✅ Backend can serve images at `/uploads/{filename}`
3. ✅ Database image URLs fixed to point to backend
4. ✅ Configuration supports both local (9000) and VM (9000) deployments

---

## 📁 Files Modified

### Backend Code (2 files)
- `backend/src/api/store/admin-upload-image/route.ts` - Returns full URLs
- `backend/src/api/uploads/[...path]/route.ts` - NEW: Image serving endpoint

### Configuration (1 file)
- `backend/.env` - Added `API_URL=http://localhost:9000`

### New Files (6 files)
- `.env.vm` - VM environment configuration
- `fix-image-urls.js` - Database migration script
- `fix-image-urls.py` - Alternative Python migration
- `fix-image-urls-local.sh` - Alternative Bash migration
- `deploy-to-vm.sh` - Automated VM deployment
- `CODE_CHANGES_DETAIL.md` - Code changes explained

### Documentation (5 files)
- `QUICK_START.md` - This start guide
- `IMPLEMENTATION_CHECKLIST.md` - Step-by-step instructions
- `DATABASE_CONNECTION_FIX.md` - Detailed guide + troubleshooting
- `IMAGE_URL_FIX_SUMMARY.md` - Technical summary
- `CODE_CHANGES_DETAIL.md` - Code before/after

---

## ✨ Implementation Status

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Code changes | ✅ Complete | None - already implemented |
| Configuration | ✅ Complete | None - already configured |
| Scripts | ✅ Complete | Run when ready |
| Documentation | ✅ Complete | Reference as needed |
| **Local fix** | ⏳ Pending | Run `node fix-image-urls.js` |
| **VM deployment** | ⏳ Pending | Run `./deploy-to-vm.sh` |
| **VM database** | ⏳ Pending | Run on VM after deployment |
| Testing | ⏳ Pending | Verify images load |

---

## 🚀 Typical Workflow

### First Time Setup
1. Read **QUICK_START.md**
2. Read **IMPLEMENTATION_CHECKLIST.md**
3. Follow the checklist step-by-step

### For Reference
- Having CORS issues? → **DATABASE_CONNECTION_FIX.md** troubleshooting
- Want to understand changes? → **CODE_CHANGES_DETAIL.md**
- Need technical overview? → **IMAGE_URL_FIX_SUMMARY.md**

### For Deployment
- Local setup: Use commands in **IMPLEMENTATION_CHECKLIST.md**
- VM setup: Run **deploy-to-vm.sh** then follow **IMPLEMENTATION_CHECKLIST.md**

---

## 🔗 API Connection Flow

```
┌─ Storefront/Admin (3000/3001)
│  │
│  └──→ Requests image: /uploads/file.jpg
│
├─ Backend API (9000)
│  │
│  ├──→ Handler: GET /uploads/{filename}
│  │
│  └──→ Returns: Image + headers
│
├─ Database (5433)
│  │
│  └──→ Stores: http://localhost:9000/uploads/file.jpg
│
└─ Browser
   │
   └──→ Displays image ✅
```

---

## ✅ Success Criteria

After following the guides, you should have:

✅ Local images working on port 3000/3001  
✅ Local backend serving images on port 9000  
✅ Database showing correct image URLs  
✅ VM images working with VM IP address  
✅ VM backend serving images  
✅ No CORS or 404 errors in console  

---

## 📞 Troubleshooting Path

1. **Images not loading?**
   - → See "Troubleshooting" in DATABASE_CONNECTION_FIX.md
   - → Check browser Network tab for 404 errors

2. **CORS errors?**
   - → Check STORE_CORS and ADMIN_CORS in backend/.env
   - → Ensure frontend addresses are listed

3. **Database errors?**
   - → Test connection: `psql -h localhost -p 5433 -U medusa -d medusa_db -c "SELECT 1;"`
   - → Run migration again: `node fix-image-urls.js`

4. **Deployment issues?**
   - → Review deploy-to-vm.sh output
   - → SSH to VM and check backend logs
   - → Verify .env files are correctly deployed

---

## 📊 Quick Stats

- **Lines of code changed:** ~50
- **New features added:** Image serving endpoint
- **Files affected:** 9 total (2 code, 1 config, 6 new)
- **Documentation pages:** 5 guides + this index
- **Scripts provided:** 3 variants (JS, Python, Bash)
- **Time to implement:** 5-10 minutes per environment

---

## 🎓 Key Concepts

**Relative vs Absolute URLs**
- Relative: `/uploads/file.jpg` (depends on current page)
- Absolute: `http://localhost:9000/uploads/file.jpg` (complete address)

**Port Numbers**
- 3000/3001: Frontend (Storefront/Admin)
- 9000: Backend API (image serving, data endpoints)
- 5433: PostgreSQL Database

**Environment-Specific Configuration**
- Local: `API_URL=http://localhost:9000`
- VM: `API_URL=http://158.180.37.41:9000`

---

## 🔄 Update Process

If you need to make changes after deployment:

1. Update code in local repo
2. Run migration: `node fix-image-urls.js` (local)
3. Deploy to VM: `./deploy-to-vm.sh`
4. Run migration on VM: `API_URL=http://158.180.37.41:9000 node fix-image-urls.js`
5. Restart services

---

**Last Updated:** January 14, 2026  
**Version:** 1.0 - Complete Implementation  
**Status:** ✅ Ready to Deploy
