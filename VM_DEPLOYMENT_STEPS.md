# 🚀 VM Deployment - Step by Step Guide

## Prerequisites Check
```bash
# 1. Test SSH access to VM
ssh ubuntu@158.180.37.41 "echo 'SSH working!'"
```

If that works, continue with deployment.

---

## Method 1: Automated Deployment (Recommended)

```bash
# 1. Go to project directory
cd /Users/User/daw-store

# 2. Run deployment script
./deploy-to-vm.sh
```

**Expected output:**
```
🚀 DAW Store - VM Deployment
========================================
📍 VM: ubuntu@158.180.37.41:/home/ubuntu/dawon

1️⃣  Syncing backend files to VM...
✅ Backend synced

2️⃣  Deploying .env configuration...
✅ .env deployed

3️⃣  Syncing upload directory...
✅ Uploads synced

4️⃣  Syncing admin panel...
✅ Admin synced

5️⃣  Configuring admin panel for VM...
✅ Admin .env.local configured

6️⃣  Syncing storefront...
✅ Storefront synced

7️⃣  Configuring storefront for VM...
✅ Storefront .env.local configured

✨ VM Deployment Complete!
```

---

## Method 2: Manual Deployment (If Script Fails)

### Step 1: Sync Backend
```bash
cd /Users/User/daw-store
rsync -avz --delete backend/ ubuntu@158.180.37.41:/home/ubuntu/dawon/backend/
```

### Step 2: Deploy Backend .env
```bash
scp .env.vm ubuntu@158.180.37.41:/home/ubuntu/dawon/backend/.env
```

### Step 3: Configure Admin Panel
```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cat > /home/ubuntu/dawon/admin/.env.local << 'EEOF'
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EEOF
echo "✅ Admin configured"
EOF
```

### Step 4: Sync Admin Files
```bash
rsync -avz --delete admin/ ubuntu@158.180.37.41:/home/ubuntu/dawon/admin/
```

### Step 5: Configure Storefront
```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cat > /home/ubuntu/dawon/storefront/.env.local << 'EEOF'
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EEOF
echo "✅ Storefront configured"
EOF
```

### Step 6: Sync Storefront Files
```bash
rsync -avz --delete storefront/ ubuntu@158.180.37.41:/home/ubuntu/dawon/storefront/
```

### Step 7: Sync Uploads
```bash
rsync -avz --delete storefront/public/uploads/ ubuntu@158.180.37.41:/home/ubuntu/dawon/storefront/public/uploads/
```

### Step 8: Copy Migration Script
```bash
scp fix-image-urls.js ubuntu@158.180.37.41:/home/ubuntu/dawon/
```

---

## After Deployment: Start Services on VM

### Step 1: SSH into VM
```bash
ssh ubuntu@158.180.37.41
```

### Step 2: Install Backend Dependencies
```bash
cd /home/ubuntu/dawon/backend
npm install
```

### Step 3: Start Backend
```bash
npm run dev
```

Wait for this output (takes ~30 seconds):
```
⠋ Creating server
✓ Server ready
```

### Step 4: In a NEW Terminal, Fix Database

```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cd /home/ubuntu/dawon
API_URL=http://158.180.37.41:9000 node fix-image-urls.js
EOF
```

**Expected output:**
```
🔄 Fixing image URLs in database...
📍 API URL: http://158.180.37.41:9000
✅ Updated 2 images
📊 Total images: 2
✨ Migration complete!
```

### Step 5: Start Other Services (Optional)

If you need admin/storefront running on VM too:

```bash
# Install admin dependencies
cd /home/ubuntu/dawon/admin
npm install
npm run dev    # Will run on port 3001

# In another terminal:
cd /home/ubuntu/dawon/storefront
npm install
npm run dev    # Will run on port 3000
```

---

## Testing After Deployment

### Check Backend
```bash
curl http://158.180.37.41:9000/store/products \
  -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36"
```

Should return JSON product data ✅

### Check Database
```bash
ssh ubuntu@158.180.37.41 << 'EOF'
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT COUNT(*) as total_images, 
           COUNT(CASE WHEN url LIKE '%158.180.37.41%' THEN 1 END) as correct_urls 
       FROM image;"
EOF
```

Should show all images with 158.180.37.41 URLs ✅

### Access Services
- Admin: http://158.180.37.41:3001
- Storefront: http://158.180.37.41:3000
- Backend API: http://158.180.37.41:9000

---

## Troubleshooting

### If rsync fails
```bash
# Ensure directory exists on VM
ssh ubuntu@158.180.37.41 "mkdir -p /home/ubuntu/dawon/{backend,admin,storefront}"

# Then retry sync commands
```

### If SSH fails
```bash
# Check SSH key
ssh-keygen -l -f ~/.ssh/id_rsa

# Test connection
ssh -v ubuntu@158.180.37.41 "echo OK"
```

### If npm install fails
```bash
# SSH to VM and check Node.js version
ssh ubuntu@158.180.37.41 "node --version && npm --version"

# If not installed:
ssh ubuntu@158.180.37.41 "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
```

### If backend won't start
```bash
# Check for port conflicts
ssh ubuntu@158.180.37.41 "lsof -i :9000"

# Check logs
ssh ubuntu@158.180.37.41 "cd /home/ubuntu/dawon/backend && npm run dev 2>&1 | head -50"
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| **Deploy (auto)** | `./deploy-to-vm.sh` |
| **SSH to VM** | `ssh ubuntu@158.180.37.41` |
| **Start backend** | `ssh ubuntu@158.180.37.41 "cd /home/ubuntu/dawon/backend && npm run dev"` |
| **Fix database** | `ssh ubuntu@158.180.37.41 "cd /home/ubuntu/dawon && API_URL=http://158.180.37.41:9000 node fix-image-urls.js"` |
| **Check backend** | `curl http://158.180.37.41:9000/store/products -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36"` |

---

## Complete Workflow (TL;DR)

```bash
# 1. Deploy everything
cd /Users/User/daw-store && ./deploy-to-vm.sh

# 2. Start backend on VM (in one terminal)
ssh ubuntu@158.180.37.41 "cd /home/ubuntu/dawon/backend && npm install && npm run dev"

# 3. Fix database (in another terminal)
ssh ubuntu@158.180.37.41 "cd /home/ubuntu/dawon && API_URL=http://158.180.37.41:9000 node fix-image-urls.js"

# 4. Test
curl http://158.180.37.41:9000/store/products \
  -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36"
```

Done! 🎉
