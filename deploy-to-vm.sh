#!/bin/bash

# DAW Store - VM Deployment Script
# Syncs backend with correct configuration to VM and fixes database

VM_IP="158.180.37.41"
VM_USER="ubuntu"
VM_PATH="/home/ubuntu/dawon"

echo "🚀 DAW Store - VM Deployment"
echo "=========================================="
echo "📍 VM: $VM_USER@$VM_IP:$VM_PATH"
echo ""

# 1. Sync backend files
echo "1️⃣  Syncing backend files to VM..."
rsync -avz --delete \
  /Users/User/daw-store/backend/ \
  $VM_USER@$VM_IP:$VM_PATH/backend/

if [ $? -ne 0 ]; then
  echo "❌ Backend sync failed!"
  exit 1
fi
echo "✅ Backend synced"

# 2. Upload VM .env file
echo ""
echo "2️⃣  Deploying .env configuration..."
scp /Users/User/daw-store/.env.vm \
  $VM_USER@$VM_IP:$VM_PATH/backend/.env

if [ $? -ne 0 ]; then
  echo "❌ .env deployment failed!"
  exit 1
fi
echo "✅ .env deployed"

# 3. Sync uploads
echo ""
echo "3️⃣  Syncing upload directory..."
rsync -avz --delete \
  /Users/User/daw-store/storefront/public/uploads/ \
  $VM_USER@$VM_IP:$VM_PATH/storefront/public/uploads/

if [ $? -ne 0 ]; then
  echo "⚠️  Uploads sync had issues (may be ok if first time)"
else
  echo "✅ Uploads synced"
fi

# 4. Sync admin files
echo ""
echo "4️⃣  Syncing admin panel..."
rsync -avz --delete \
  /Users/User/daw-store/admin/ \
  $VM_USER@$VM_IP:$VM_PATH/admin/

if [ $? -ne 0 ]; then
  echo "❌ Admin sync failed!"
  exit 1
fi
echo "✅ Admin synced"

# 5. Fix admin .env.local for VM
echo ""
echo "5️⃣  Configuring admin panel for VM..."
ssh $VM_USER@$VM_IP << 'EOSSH'
cat > /home/ubuntu/dawon/admin/.env.local << EOF
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EOF
echo "✅ Admin .env.local configured"
EOSSH

# 6. Sync storefront files
echo ""
echo "6️⃣  Syncing storefront..."
rsync -avz --delete \
  /Users/User/daw-store/storefront/ \
  $VM_USER@$VM_IP:$VM_PATH/storefront/

if [ $? -ne 0 ]; then
  echo "❌ Storefront sync failed!"
  exit 1
fi
echo "✅ Storefront synced"

# 7. Fix storefront .env.local for VM
echo ""
echo "7️⃣  Configuring storefront for VM..."
ssh $VM_USER@$VM_IP << 'EOSSH'
cat > /home/ubuntu/dawon/storefront/.env.local << EOF
NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
NEXT_PUBLIC_PUBLISHABLE_API_KEY=pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36
EOF
echo "✅ Storefront .env.local configured"
EOSSH

echo ""
echo "=================================="
echo "✨ VM Deployment Complete!"
echo "=================================="
echo ""
echo "📝 Next Steps:"
echo "1. SSH into VM: ssh $VM_USER@$VM_IP"
echo "2. Go to backend: cd $VM_PATH/backend"
echo "3. Install dependencies: npm install"
echo "4. Start backend: npm run dev"
echo ""
echo "5. In another terminal, sync docker-compose:"
echo "   rsync -avz /Users/User/daw-store/docker-compose.yml $VM_USER@$VM_IP:$VM_PATH/"
echo ""
echo "6. On VM, fix database image URLs:"
echo "   API_URL=http://158.180.37.41:9000 node fix-image-urls.js"
echo ""
