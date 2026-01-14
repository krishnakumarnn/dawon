# ✅ LOCAL ENVIRONMENT - VERIFICATION CHECKLIST

## 1. Backend Status
```bash
# Check backend log
tail -20 /tmp/backend.log

# Test API is responding
curl http://localhost:9000/store/products \
  -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36"
```

Should return products JSON ✅

---

## 2. Database Check
```bash
# Check image URLs are correct (should show localhost:9000)
export PGPASSWORD=medusa
psql -h localhost -p 5433 -U medusa -d medusa_db \
  -c "SELECT COUNT(*) as total, COUNT(CASE WHEN url LIKE '%localhost:9000%' THEN 1 END) as correct FROM image;"
```

Both counts should match ✅

---

## 3. Admin Panel
Open: http://localhost:3001

- [ ] Can access admin panel
- [ ] Try upload an image
- [ ] Check browser console for errors
- [ ] Image should have correct URL (localhost:9000)

---

## 4. Storefront
Open: http://localhost:3000

- [ ] Can access storefront
- [ ] Images should display (they come from localhost:9000)
- [ ] No 404 errors in Network tab
- [ ] No CORS errors in console

---

## 5. If Something is Wrong

**Reset everything:**
```bash
# Kill backend
pkill -f "npm run dev"

# Rebuild backend
cd /Users/User/daw-store/backend
npm run build

# Restart backend
npm run dev

# If database is still wrong, fix it:
cd /Users/User/daw-store
node fix-image-urls.js
```

---

## Quick Test
```bash
# All in one test
echo "1. Backend health:" && \
curl -s http://localhost:9000/store/products \
  -H "x-publishable-api-key: pk_bf6072f5426ed41b53c4063eac9b5fed998db622e66695ee719d453d95c15c36" | jq '.products | length' && \
echo "2. Database:" && \
export PGPASSWORD=medusa && \
psql -h localhost -p 5433 -U medusa -d medusa_db -c \
  "SELECT url FROM image LIMIT 1;" && \
echo "✅ All good!"
```

---

## Summary

**Everything should work with:**
- Backend: http://localhost:9000 ✅
- Admin: http://localhost:3001 ✅
- Storefront: http://localhost:3000 ✅
- DB Images: All pointing to localhost:9000 ✅
