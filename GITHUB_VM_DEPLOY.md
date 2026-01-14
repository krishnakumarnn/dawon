# 🚀 VM DEPLOYMENT FROM GITHUB

## Step 1: Clone/Update from GitHub on VM

```bash
ssh ubuntu@158.180.37.41 << 'EOF'
# If first time, clone:
if [ ! -d /home/ubuntu/dawon/.git ]; then
  cd /home/ubuntu && rm -rf dawon
  git clone https://github.com/krishnakumarnn/dawon.git
else
  # Otherwise just pull latest
  cd /home/ubuntu/dawon && git pull origin main
fi
EOF
```

---

## Step 2: Install Dependencies & Start Backend

```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cd /home/ubuntu/dawon/backend
npm install
npm run dev &
EOF
```

Wait ~30 seconds for server to start.

---

## Step 3: Fix Database (New Terminal)

```bash
ssh ubuntu@158.180.37.41 << 'EOF'
cd /home/ubuntu/dawon
npm install pg --save  # (from root)
API_URL=http://158.180.37.41:9000 node fix-image-urls.js
EOF
```

---

## Step 4: Verify Everything

```bash
# Test backend
curl http://158.180.37.41:9000/store/products \
  -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36" | jq '.products | length'

# Test database
ssh ubuntu@158.180.37.41 << 'EOF'
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT COUNT(*) as total, COUNT(CASE WHEN url LIKE '%158.180.37.41%' THEN 1 END) as vm_urls FROM image;"
EOF
```

---

## Done! 🎉

Your VM now has:
- ✅ Latest code from GitHub
- ✅ Backend running on port 9000
- ✅ Database fixed with VM URLs
- ✅ All images pointing to 158.180.37.41:9000

Access:
- Admin: http://158.180.37.41:3001
- Storefront: http://158.180.37.41:3000
- Backend: http://158.180.37.41:9000
