# 🚀 DEPLOYMENT SUMMARY & NEXT STEPS

## ✅ LOCAL ENVIRONMENT - COMPLETE

All fixes have been successfully applied and tested locally:

- ✅ Backend rebuilt and running on port 9000
- ✅ Database connected and verified
- ✅ 2 image URLs fixed (from localhost:3000 → localhost:9000)
- ✅ API responding correctly

**Verification:**
```bash
# Check backend
curl http://localhost:9000/store/products \
  -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36"

# Check database
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT url FROM image LIMIT 2;"
```

---

## 🌍 VM DEPLOYMENT - READY

### Prerequisites ✓
- VM IP: 158.180.37.41
- VM User: ubuntu
- VM Path: /home/ubuntu/dawon
- SSH key: Configured and working
- Docker: Running on VM

### Deployment Steps

#### Step 1: Run Automated Deployment
```bash
cd /Users/User/daw-store
chmod +x deploy-to-vm.sh
./deploy-to-vm.sh
```

**What this does:**
- Syncs backend with correct .env for VM
- Syncs admin panel with API_URL configured
- Syncs storefront with API_URL configured
- Syncs upload directory
- Configures all .env.local files for VM IP

#### Step 2: Start Backend on VM
```bash
ssh ubuntu@158.180.37.41
cd /home/ubuntu/dawon/backend
npm install
npm run dev
```

Expected output:
```
⠋ Creating server
info:    Skipping instrumentation...
info:    No link to load from...
```

#### Step 3: Fix Database on VM
In a new terminal:
```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cd /home/ubuntu/dawon
API_URL=http://158.180.37.41:9000 node fix-image-urls.js
EOF
```

Expected output:
```
🔄 Fixing image URLs in database...
📍 API URL: http://158.180.37.41:9000
✅ Updated X images
✨ Migration complete!
```

---

## 📋 VERIFICATION AFTER DEPLOYMENT

### Test Backend
```bash
curl http://158.180.37.41:9000/store/products \
  -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36"
```

### Test Admin Panel
- Open: http://158.180.37.41:3001
- Verify: Can access admin
- Try: Upload an image
- Check: Database shows `http://158.180.37.41:9000/uploads/...`

### Test Storefront
- Open: http://158.180.37.41:3000
- Verify: Page loads
- Check: Images display correctly
- Network tab: Should show images from port 9000, not 3000

### Check Database
```bash
ssh ubuntu@158.180.37.41
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT url FROM image LIMIT 3;"
```

All URLs should show: `http://158.180.37.41:9000/uploads/...`

---

## 🐛 Troubleshooting

### Images still not loading on VM
```bash
# 1. Check backend is running
ssh ubuntu@158.180.37.41 "curl http://localhost:9000/store/products"

# 2. Check image URLs in database
ssh ubuntu@158.180.37.41 << 'EOF'
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT COUNT(*) FROM image WHERE url LIKE '%158.180.37.41%';"
EOF

# 3. Check uploads directory exists
ssh ubuntu@158.180.37.41 "ls -la /home/ubuntu/dawon/storefront/public/uploads/"
```

### Backend won't start on VM
```bash
# Check Node.js version
ssh ubuntu@158.180.37.41 "node --version"

# Check dependencies
ssh ubuntu@158.180.37.41 "cd /home/ubuntu/dawon/backend && npm list pg"

# Check Redis
ssh ubuntu@158.180.37.41 "redis-cli ping"
```

### CORS errors in browser
```bash
# Verify CORS config in VM backend .env
ssh ubuntu@158.180.37.41 "grep CORS /home/ubuntu/dawon/backend/.env"

# Should show VM IP addresses:
# STORE_CORS=http://158.180.37.41:3000,http://158.180.37.41:3001,...
```

---

## 📊 File Locations

### Local
- Backend: `/Users/User/daw-store/backend/`
- Database config: `/Users/User/daw-store/backend/.env`
- Migration script: `/Users/User/daw-store/fix-image-urls.js`
- Deployment script: `/Users/User/daw-store/deploy-to-vm.sh`

### VM  
- Backend: `/home/ubuntu/dawon/backend/`
- Admin: `/home/ubuntu/dawon/admin/`
- Storefront: `/home/ubuntu/dawon/storefront/`
- Uploads: `/home/ubuntu/dawon/storefront/public/uploads/`

---

## 🔑 Key Configuration Values

### Local
```
API_URL=http://localhost:9000
DATABASE_URL=postgresql://medusa:medusa@localhost:5433/medusa_db
REDIS_URL=redis://localhost:6380
```

### VM
```
API_URL=http://158.180.37.41:9000
DATABASE_URL=postgresql://medusa:medusa@localhost:5433/medusa_db
REDIS_URL=redis://localhost:6380
```

### Frontend (both environments)
```
NEXT_PUBLIC_API_URL=http://localhost:9000           # Local
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000       # VM
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
```

---

## ✨ Final Checklist

- [x] Local backend fixed and running
- [x] Local database URLs migrated
- [x] Deployment script ready
- [x] VM environment config ready
- [ ] VM deployment executed
- [ ] VM backend started
- [ ] VM database migrated
- [ ] VM testing complete

---

**Status:** Local complete. Ready for VM deployment! 🚀

For automated deployment, run:
```bash
cd /Users/User/daw-store && ./deploy-to-vm.sh
```
