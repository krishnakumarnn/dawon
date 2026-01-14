# 🎨 Visual Problem & Solution Guide

## THE PROBLEM - Before Fix ❌

### What Was Happening
```
┌─────────────────────────────────────────────────────────┐
│  ADMIN UPLOADS IMAGE                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │   Backend (9000)  │
         │  Saves image to:  │
         │  storefront/      │
         │  public/uploads/  │
         └────────┬──────────┘
                  │
                  ▼
    ┌────────────────────────────┐
    │  Database stores URL:      │
    │  /uploads/image.jpg        │ ⚠️ RELATIVE URL (missing host:port)
    └────────────────────────────┘
                  │
                  ▼
    ┌────────────────────────────┐
    │  Storefront tries to load: │
    │  GET /uploads/image.jpg    │
    └──────────┬─────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │  Browser resolves to:            │
    │  http://localhost:3000/          │
    │  uploads/image.jpg               │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │  Port 3000 = Storefront Frontend │
    │  Does NOT serve images!          │
    └──────────┬───────────────────────┘
               │
               ▼
         ❌ 404 NOT FOUND
         Image fails to load
```

---

## THE SOLUTION - After Fix ✅

### What Happens Now
```
┌─────────────────────────────────────────────────────────┐
│  ADMIN UPLOADS IMAGE                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │   Backend (9000)  │
         │  Saves image to:  │
         │  storefront/      │
         │  public/uploads/  │
         └────────┬──────────┘
                  │
                  ▼
    ┌────────────────────────────────────────┐
    │  Backend returns full URL:             │
    │  http://localhost:9000/uploads/...    │ ✅ ABSOLUTE URL (includes host:port)
    └────────────────────────────────────────┘
                  │
                  ▼
    ┌────────────────────────────────────────┐
    │  Database stores:                      │
    │  http://localhost:9000/uploads/...    │ ✅ Correct endpoint
    └────────────────────────────────────────┘
                  │
                  ▼
    ┌────────────────────────────────────────┐
    │  Storefront loads image from:          │
    │  http://localhost:9000/uploads/...    │
    └──────────┬────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │  Port 9000 = Backend API             │
    │  HAS image serving endpoint!          │
    └──────────┬───────────────────────────┘
               │
               ▼
         ✅ 200 OK
         Image loads successfully!
```

---

## ARCHITECTURE - Local Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL MACHINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Browser                                                      │
│  │                                                            │
│  ├─ http://localhost:3001 (Admin Panel)                     │
│  │  │                                                        │
│  │  └──→ Upload Image                                        │
│  │                                                            │
│  └─ http://localhost:3000 (Storefront)                      │
│     │                                                        │
│     └──→ Display Images                                      │
│          Request: GET http://localhost:9000/uploads/...      │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  Backend Server - Port 9000                     │        │
│  │  ┌─────────────────────────────────────────────┐│       │
│  │  │ Endpoints:                                  ││       │
│  │  │  • POST /store/admin-upload-image           ││       │
│  │  │    └─→ Saves file to: storefront/public/    ││       │
│  │  │    └─→ Returns: http://localhost:9000/...   ││       │
│  │  │                                             ││       │
│  │  │  • GET /uploads/{filename}                  ││       │
│  │  │    └─→ Serves image from: storefront/public/││       │
│  │  │    └─→ Returns: Image file + headers        ││       │
│  │  └─────────────────────────────────────────────┘│       │
│  │                                                 │        │
│  │  Environment: API_URL=http://localhost:9000   │        │
│  └─────────────────────────────────────────────────┘        │
│           │                                                  │
│           └──→ Reads/Writes                                 │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  PostgreSQL Database - Port 5433               │        │
│  │  ┌─────────────────────────────────────────────┐│       │
│  │  │ image table:                                ││       │
│  │  │ ┌─────────────────────────────────────────┐││       │
│  │  │ │ id │ url                              ││││       │
│  │  │ ├────┼──────────────────────────────────┤││        │
│  │  │ │ 1  │ http://localhost:9000/uploads/.. ││││       │
│  │  │ │ 2  │ http://localhost:9000/uploads/.. ││││       │
│  │  │ │ 3  │ http://localhost:9000/uploads/.. ││││       │
│  │  │ └─────────────────────────────────────────┘││       │
│  │  │                                             ││       │
│  │  │ Database: medusa_db                        ││       │
│  │  │ User: medusa / medusa                      ││       │
│  │  └─────────────────────────────────────────────┘│       │
│  └─────────────────────────────────────────────────┘        │
│           │                                                  │
│           └──→ Persists Data                                │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  File System                                    │        │
│  │  /Users/User/daw-store/storefront/public/      │        │
│  │  uploads/                                       │        │
│  │  ├─ 1234567890_abc123_image1.jpg              │        │
│  │  ├─ 1234567890_xyz789_image2.png              │        │
│  │  └─ ...                                        │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ARCHITECTURE - VM Environment

```
┌──────────────────────────────────────────────────────────────┐
│              REMOTE VM: 158.180.37.41                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Browser (Access from anywhere)                               │
│  │                                                             │
│  ├─ http://158.180.37.41:3001 (Admin Panel)                 │
│  │  │                                                         │
│  │  └──→ Upload Image                                         │
│  │                                                             │
│  └─ http://158.180.37.41:3000 (Storefront)                  │
│     │                                                         │
│     └──→ Display Images                                       │
│          Request: GET http://158.180.37.41:9000/uploads/...  │
│                                                                │
│  ┌──────────────────────────────────────────────────┐        │
│  │  Backend Server - Port 9000                      │        │
│  │  ┌──────────────────────────────────────────────┐│       │
│  │  │ Endpoints (same as local):                  ││       │
│  │  │  • POST /store/admin-upload-image           ││       │
│  │  │  • GET /uploads/{filename}                  ││       │
│  │  └──────────────────────────────────────────────┘│       │
│  │                                                  │        │
│  │  Environment:                                   │        │
│  │  API_URL=http://158.180.37.41:9000            │        │
│  │  DATABASE_URL=postgresql://medusa:medusa@...  │        │
│  └──────────────────────────────────────────────────┘        │
│           │                                                   │
│           └──→ Reads/Writes                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────┐        │
│  │  PostgreSQL Database - Port 5433                │        │
│  │  (Same Docker container or separate)           │        │
│  │                                                  │        │
│  │  Stores: http://158.180.37.41:9000/uploads/.. │        │
│  └──────────────────────────────────────────────────┘        │
│           │                                                   │
│           └──→ Persists Data                                 │
│                                                                │
│  ┌──────────────────────────────────────────────────┐        │
│  │  File System                                     │        │
│  │  /home/ubuntu/dawon/storefront/public/uploads/ │        │
│  │  (Synced from local machine)                   │        │
│  └──────────────────────────────────────────────────┘        │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## REQUEST FLOW COMPARISON

### ❌ BEFORE (Broken)
```
1. Admin uploads image
   ↓
2. Backend saves: /storefront/public/uploads/image.jpg
   ↓
3. Backend returns relative URL: /uploads/image.jpg
   ↓
4. Database stores: /uploads/image.jpg
   ↓
5. Storefront requests: GET /uploads/image.jpg
   ↓
6. Browser resolves to current domain:
   http://localhost:3000/uploads/image.jpg
   ↓
7. Port 3000 (Frontend) can't serve images
   ↓
❌ RESULT: 404 NOT FOUND
```

### ✅ AFTER (Fixed)
```
1. Admin uploads image
   ↓
2. Backend saves: /storefront/public/uploads/image.jpg
   ↓
3. Backend returns absolute URL:
   http://localhost:9000/uploads/image.jpg
   ↓
4. Database stores: http://localhost:9000/uploads/image.jpg
   ↓
5. Storefront requests: GET http://localhost:9000/uploads/image.jpg
   ↓
6. Browser connects directly to specified address:
   http://localhost:9000/uploads/image.jpg
   ↓
7. Port 9000 (Backend) HAS image serving endpoint
   ↓
✅ RESULT: 200 OK + Image Data
```

---

## CODE CHANGE ILLUSTRATION

### Upload Handler Change
```typescript
// BEFORE ❌
res.status(200).json({ url: `/uploads/${fileName}` });
// Returns: /uploads/1234567890_abc_file.jpg
// Problem: Relative URL, depends on where request comes from

// AFTER ✅
const apiUrl = process.env.API_URL || 'http://localhost:9000';
const fullUrl = `${apiUrl}/uploads/${fileName}`;
res.status(200).json({ url: fullUrl });
// Returns: http://localhost:9000/uploads/1234567890_abc_file.jpg
// Solution: Absolute URL, works from anywhere
```

### Configuration Change
```env
# BEFORE ❌
# No API_URL defined

# AFTER ✅
API_URL=http://localhost:9000    # Local
# OR
API_URL=http://158.180.37.41:9000  # VM
```

### Image Serving Change
```typescript
// BEFORE ❌
// No endpoint to serve images from backend
// Frontend had to find images somewhere else (wrong port)

// AFTER ✅
// New endpoint: GET /uploads/[...path]/route.ts
// Backend serves images from: storefront/public/uploads/
// Frontend can load from: http://localhost:9000/uploads/{filename}
```

---

## PORT MAPPING REFERENCE

| Service | Port | Role | Serves |
|---------|------|------|--------|
| Admin Frontend | 3001 | Next.js App | HTML, JS, CSS |
| Storefront | 3000 | Next.js App | HTML, JS, CSS, API calls to 9000 |
| **Backend API** | **9000** | **Medusa Server** | **API endpoints + Images** |
| Database | 5433 | PostgreSQL | Data |
| Redis | 6380 | Cache | Sessions, queues |

**Key Point:** Only port 9000 (Backend) should serve images. Ports 3000/3001 (Frontend) should request images FROM port 9000.

---

## SUMMARY

| Aspect | Before ❌ | After ✅ |
|--------|-----------|----------|
| Image URL | `/uploads/file.jpg` | `http://localhost:9000/uploads/file.jpg` |
| URL Type | Relative | Absolute |
| Served By | Port 3000 (Frontend) | Port 9000 (Backend) |
| Result | 404 Error | 200 OK |
| Database | Wrong endpoint | Correct endpoint |
| VM Support | Broken | Works |

**The key change:** From relative URLs (depends on context) to absolute URLs (complete address that works everywhere).
