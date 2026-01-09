# Quick Start Guide - DAW Store

## 🚀 5-Minute Setup

### Step 1: Start Services (2 minutes)
```bash
cd ~/daw-store
docker-compose up -d
```

Check if running:
```bash
docker-compose ps
```

### Step 2: Open 3 Terminals

#### Terminal 1 - Backend
```bash
cd ~/daw-store/backend
npm run dev
# Runs on http://localhost:9000
```

#### Terminal 2 - Admin Dashboard  
```bash
cd ~/daw-store/admin
npm run dev
# Runs on http://localhost:3001
```

#### Terminal 3 - Customer Storefront
```bash
cd ~/daw-store/storefront
npm run dev
# Runs on http://localhost:3000
```

---

## 🔗 Access Your E-Commerce Platform

| Component | URL | Credentials |
|-----------|-----|-------------|
| **Customer Store** | http://localhost:3000 | Sign up or login |
| **Admin Dashboard** | http://localhost:3001 | admin@example.com / password |
| **Backend API** | http://localhost:9000 | N/A |
| **Database** | localhost:5432 | medusa / medusa |
| **Redis** | localhost:6379 | N/A |

---

## 📋 What You Can Do

### On the **Customer Storefront** (localhost:3000)
1. Browse featured products on home page
2. Click "Shop Now" to see all products
3. Filter by category, search, sort by price
4. Add products to cart
5. **Sign Up** to create an account
6. **Login** with your account
7. View cart and checkout details
8. View your order history

### In the **Admin Dashboard** (localhost:3001)
1. **Login** with: admin@example.com / password
2. **Dashboard** - View overview stats
3. **Products** - Add/Edit/Delete products
4. **Orders** - Manage and accept/reject orders
5. **Customers** - View customer list
6. **Settings** - Configure:
   - Store logo
   - Store name & description
   - Contact details (phone, email, address)
   - Business hours
   - Social media links

---

## 🧪 Test the System

### Test Admin Features
1. Go to http://localhost:3001/login
2. Login with: `admin@example.com` / `password`
3. Go to Products → Add Product
4. Fill in details and click "Add Product"
5. Go to Orders → select an order → Update Status

### Test Customer Features
1. Go to http://localhost:3000
2. Click "Shop Now" or browse products
3. Click "Add to Cart" on any product
4. Go to "Cart" to see your items
5. Click "Sign Up"
6. Create account with your email
7. After login, you can see your profile

---

## 📊 Database

All data is stored in PostgreSQL (running in Docker):
- **Host**: localhost
- **Port**: 5432
- **Username**: medusa
- **Password**: medusa
- **Database**: medusa_db

Connect with any PostgreSQL client:
```bash
psql -h localhost -U medusa -d medusa_db
```

---

## 🛑 Stopping Services

When done, stop everything:
```bash
# Stop Docker services
docker-compose down

# Stop Node servers
# Press Ctrl+C in each terminal
```

To remove data and start fresh:
```bash
docker-compose down -v
docker-compose up -d
```

---

## 📝 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Customers (Web Browsers)                 │
└────────────┬──────────────────────┬──────────────┘
             │                      │
      ┌──────▼────────┐    ┌────────▼─────────┐
      │  Storefront   │    │ Admin Dashboard  │
      │ (Next.js 16)  │    │  (Next.js 16)    │
      │ Port: 3000    │    │  Port: 3001      │
      └──────┬────────┘    └────────┬─────────┘
             │                      │
             └──────────┬───────────┘
                        │
                 ┌──────▼──────┐
                 │   Backend   │
                 │   Medusa    │
                 │ Port: 9000  │
                 └──────┬──────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   ┌────▼───┐      ┌────▼────┐    ┌─────▼──┐
   │ Postgres│     │  Redis  │    │ Storage │
   │ 5432    │     │ 6379    │    │         │
   └─────────┘     └─────────┘    └─────────┘
```

---

## 🎯 Main Features Checklist

### ✅ Admin Dashboard
- [x] Dashboard with stats
- [x] Product management (add, edit, delete)
- [x] Order management with status updates
- [x] Customer management
- [x] Store branding (logo, name)
- [x] Contact details
- [x] Authentication

### ✅ Customer Storefront
- [x] Product browsing
- [x] Search & filters
- [x] Shopping cart
- [x] User registration
- [x] User login
- [x] Order history
- [x] Responsive design

---

## 💡 Tips

1. **Demo Data**: Products and orders are pre-loaded in the UI
2. **Local Storage**: Cart data is saved in browser's localStorage
3. **No Real Payments**: Payment integration requires Stripe/PayPal setup
4. **Responsive**: Works on desktop, tablet, and mobile

---

## ❓ Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Docker Services Not Starting
```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs

# Restart services
docker-compose restart
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/learn
- **Medusa**: https://docs.medusajs.com
- **Tailwind**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 📞 Need Help?

Check the main [README.md](./README.md) for:
- Detailed feature documentation
- Technology stack details
- Customization guide
- Deployment instructions

---

**Enjoy your new e-commerce platform! 🚀**
