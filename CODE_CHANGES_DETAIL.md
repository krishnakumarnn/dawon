# 🔍 Code Changes Summary

## File 1: Backend Upload Handler
**Path:** `backend/src/api/store/admin-upload-image/route.ts`

### Before ❌
```typescript
res.status(200).json({ url: `/uploads/${fileName}` });
// Returns: /uploads/1234567890_abc123_image.jpg
```

### After ✅
```typescript
const apiUrl = process.env.API_URL || `http://localhost:9000`;
const fullImageUrl = `${apiUrl}/uploads/${fileName}`;
res.status(200).json({ url: fullImageUrl });
// Returns: http://localhost:9000/uploads/1234567890_abc123_image.jpg
```

---

## File 2: Environment Configuration
**Path:** `backend/.env`

### Before ❌
```env
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
STORE_CORS=...
DATABASE_URL=...
```

### After ✅
```env
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
API_URL=http://localhost:9000                    # ← NEW LINE
STORE_CORS=...
DATABASE_URL=...
```

---

## File 3: Image Serving Endpoint
**Path:** `backend/src/api/uploads/[...path]/route.ts`

### New File (Created) ✨
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import fs from "fs/promises";
import path from "path";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { path: filePath } = req.params;
  
  // Security: prevent directory traversal
  const uploadsDir = path.resolve(process.cwd(), "../storefront/public/uploads");
  const requestedPath = path.join(uploadsDir, filePath);
  
  if (!requestedPath.startsWith(uploadsDir)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Serve image with proper headers
  const fileContent = await fs.readFile(requestedPath);
  const ext = path.extname(requestedPath).slice(1).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";
  
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.status(200).send(fileContent);
}
```

**Purpose:** Allows backend to serve images at `GET /uploads/{filename}`

---

## File 4: Database Migration Script
**Path:** `fix-image-urls.js`

### New File (Created) ✨
```javascript
const { Client } = require('pg');

async function fixImageUrls() {
  const apiUrl = 'http://localhost:9000';
  const client = new Client({ connectionString: databaseUrl });
  
  await client.connect();
  
  // Fix relative URLs
  await client.query(`
    UPDATE image 
    SET url = $1 || url
    WHERE url LIKE '/uploads/%' 
    AND url NOT LIKE 'http%'
  `, [apiUrl]);
  
  // Fix localhost:3000 URLs
  await client.query(`
    UPDATE image 
    SET url = REPLACE(url, 'http://localhost:3000', $1)
    WHERE url LIKE '%localhost:3000%'
  `, [apiUrl]);
  
  await client.end();
}
```

**Purpose:** Updates database image URLs to correct endpoint

---

## File 5: VM Environment Configuration
**Path:** `.env.vm`

### New File (Created) ✨
```env
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
API_URL=http://158.180.37.41:9000              # ← Different from local!
STORE_CORS=http://158.180.37.41:3000,http://158.180.37.41:3001,...
ADMIN_CORS=http://158.180.37.41:3001,...
AUTH_CORS=http://158.180.37.41:3000,http://158.180.37.41:3001,...
DATABASE_URL=postgresql://medusa:medusa@localhost:5433/medusa_db
REDIS_URL=redis://localhost:6380
...
```

**Purpose:** Backend config for VM deployment with correct IP addresses

---

## File 6: Deployment Automation
**Path:** `deploy-to-vm.sh`

### New File (Created) ✨
```bash
#!/bin/bash

VM_IP="158.180.37.41"
VM_USER="ubuntu"
VM_PATH="/home/ubuntu/dawon"

# Sync backend with VM .env
rsync -avz /Users/User/daw-store/backend/ \
  $VM_USER@$VM_IP:$VM_PATH/backend/

# Sync other services
rsync -avz /Users/User/daw-store/admin/ \
  $VM_USER@$VM_IP:$VM_PATH/admin/

rsync -avz /Users/User/daw-store/storefront/ \
  $VM_USER@$VM_IP:$VM_PATH/storefront/

# Configure .env files for VM
ssh $VM_USER@$VM_IP << 'EOF'
  # Create .env.local files with correct API_URL
  cat > $VM_PATH/admin/.env.local << EEOF
  NEXT_PUBLIC_API_URL=http://158.180.37.41:9000
  EEOF
EOF
```

**Purpose:** Automates entire VM deployment process

---

## Summary of Changes

| Change | Type | Benefit |
|--------|------|---------|
| Upload handler returns full URLs | Code | Images stored with correct endpoint |
| Image serving endpoint | Code | Backend can serve images |
| API_URL environment var | Config | Easily change endpoint per environment |
| Database migration script | Script | Fix existing image URLs |
| VM environment file | Config | Support VM deployment |
| Deployment automation | Script | Quick VM setup |

---

## Configuration by Environment

### Local Development
```
Frontend (3000/3001) ←→ Backend (9000) ←→ Database (5433)
                              ↓
                        /uploads/* 
                        http://localhost:9000
```

### Production (VM)
```
Frontend (3000/3001) ←→ Backend (9000) ←→ Database (5433)
  158.180.37.41            158.180.37.41
                              ↓
                        /uploads/* 
                        http://158.180.37.41:9000
```

---

## API Endpoints

### Upload Image
```
POST /store/admin-upload-image
Content-Type: application/json

{
  "dataUrl": "data:image/png;base64,iVBORw0KG...",
  "filename": "my-image.png"
}

Response:
{
  "url": "http://localhost:9000/uploads/1234567890_abc123_my-image.png"
}
```

### Serve Image
```
GET /uploads/1234567890_abc123_my-image.png

Response:
[Binary image data]
Headers:
  Content-Type: image/png
  Cache-Control: public, max-age=31536000
```

---

## Before vs After Data Flow

### BEFORE (Broken) ❌
```
1. Admin uploads image
2. Backend saves to: storefront/public/uploads/image.jpg
3. Database stores: "/uploads/image.jpg" (relative)
4. Frontend request: GET "http://localhost:3000/uploads/image.jpg"
5. Port 3000 (Storefront) doesn't serve images
6. Result: 404 Not Found ❌
```

### AFTER (Fixed) ✅
```
1. Admin uploads image
2. Backend saves to: storefront/public/uploads/image.jpg
3. Database stores: "http://localhost:9000/uploads/image.jpg" (absolute)
4. Frontend request: GET "http://localhost:9000/uploads/image.jpg"
5. Port 9000 (Backend API) serves images
6. Result: 200 OK + Image Data ✅
```

---

## Key Points

1. **Relative vs Absolute URLs**
   - Before: `/uploads/file.jpg` (no protocol/host)
   - After: `http://localhost:9000/uploads/file.jpg` (complete URL)

2. **Wrong Port**
   - Before: Images pointed to port 3000 (frontend)
   - After: Images point to port 9000 (backend API)

3. **Environment-Specific**
   - Local: `http://localhost:9000`
   - VM: `http://158.180.37.41:9000`

4. **Database Must Be Updated**
   - Existing relative URLs need fixing
   - Existing wrong-port URLs need correcting
   - Script handles both automatically
