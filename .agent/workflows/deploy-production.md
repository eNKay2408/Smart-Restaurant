---
description: Hướng dẫn deploy Smart Restaurant lên public host
---

# Hướng Dẫn Deploy Smart Restaurant

## Tổng Quan
Ứng dụng Smart Restaurant bao gồm:
- **Client**: React + Vite (Frontend)
- **Server**: Node.js + Express (Backend API)
- **Database**: MongoDB
- **Services**: Socket.IO, Redis, Cloudinary, Stripe

---

## 🎯 **QUICK START - Deploy với Full Seed Data**

Bạn muốn deploy với seed data đầy đủ (20 menu items, categories, orders, etc.)?

### Workflow Tóm Tắt:

1. **Deploy Backend** → Render (miễn phí)
2. **Deploy Frontend** → Vercel (miễn phí)
3. **Seed Database** → Chạy `npm run seed` trong Render Shell
4. **Upload Images** (Optional) → Chạy `npm run upload-images`

📖 **Chi tiết**: Xem [DEPLOY_README.md](../DEPLOY_README.md)

---

## 🎯 Option 1: Deploy lên Render (MIỄN PHÍ)

### Bước 1: Chuẩn bị Database - MongoDB Atlas

1. Truy cập https://www.mongodb.com/cloud/atlas/register
2. Tạo account miễn phí
3. Tạo cluster mới (chọn FREE tier M0)
4. Trong Security > Network Access: Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
5. Trong Security > Database Access: Tạo user với password
6. Lấy connection string (định dạng: `mongodb+srv://username:password@cluster.mongodb.net/smart-restaurant`)

### Bước 2: Chuẩn bị Redis (Optional - nếu dùng)

Nếu ứng dụng cần Redis:
- Dùng **Upstash Redis** (Free tier): https://upstash.com
- Hoặc comment out Redis trong code nếu không dùng

### Bước 3: Setup Services Bên Ngoài

#### Cloudinary (Upload ảnh)
1. Đăng ký tại https://cloudinary.com
2. Lấy: `CLOUD_NAME`, `API_KEY`, `API_SECRET`

#### Stripe (Payment)
1. Đăng ký tại https://stripe.com
2. Lấy `STRIPE_SECRET_KEY` và `STRIPE_PUBLISHABLE_KEY`

#### Gmail SMTP (Email verification)
1. Vào Google Account → Security → 2-Step Verification
2. Tạo App Password
3. Lấy email và app password

### Bước 4: Deploy Backend lên Render

1. **Push code lên GitHub** (nếu chưa có):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Truy cập Render**: https://render.com → Sign up/Login

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Chọn repository `Smart-Restaurant`

4. **Config Web Service**:
   - **Name**: `smart-restaurant-api`
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Environment Variables** (Add vào Render):
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-restaurant
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRE=7d
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Stripe
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   
   # Email (Gmail)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=Smart Restaurant <your-email@gmail.com>
   
   # Redis (nếu dùng Upstash)
   REDIS_URL=redis://default:password@host:port
   
   # Frontend URL (sẽ cập nhật sau)
   CLIENT_URL=https://your-frontend-url.vercel.app
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=https://smart-restaurant-api.onrender.com/api/auth/google/callback
   ```

6. **Click "Create Web Service"** → Đợi deploy (5-10 phút)

7. **Copy Backend URL**: VD: `https://smart-restaurant-api.onrender.com`

### Bước 5: Deploy Frontend lên Vercel

1. **Cập nhật API URL trong client**:
   - Tạo file `client/.env.production`:
   ```
   VITE_API_URL=https://smart-restaurant-api.onrender.com/api
   VITE_SOCKET_URL=https://smart-restaurant-api.onrender.com
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Push code mới**:
   ```bash
   git add .
   git commit -m "Add production env"
   git push
   ```

3. **Deploy lên Vercel**:
   - Truy cập https://vercel.com → Sign up/Login
   - Click "Add New" → "Project"
   - Import repository `Smart-Restaurant`
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables** (Add vào Vercel):
   ```
   VITE_API_URL=https://smart-restaurant-api.onrender.com/api
   VITE_SOCKET_URL=https://smart-restaurant-api.onrender.com
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

5. **Click Deploy** → Đợi 2-3 phút

6. **Copy Frontend URL**: VD: `https://smart-restaurant.vercel.app`

### Bước 6: Cập nhật CORS và Client URL

1. **Quay lại Render** → Vào Web Service backend
2. **Update Environment Variable**:
   ```
   CLIENT_URL=https://smart-restaurant.vercel.app
   ```
3. Service sẽ tự động redeploy

### Bước 7: Seed Database (Nếu cần)

1. Vào Render Dashboard → Web Service → Shell tab
2. Chạy lệnh:
   ```bash
   npm run seed
   ```

### Bước 8: Test Ứng Dụng

1. Truy cập `https://smart-restaurant.vercel.app`
2. Test các chức năng:
   - ✅ Login/Register
   - ✅ Menu browsing
   - ✅ Add to cart
   - ✅ Place order
   - ✅ Real-time order updates (Socket.IO)
   - ✅ Payment (Stripe)
   - ✅ Admin dashboard

---

## 🎯 Option 2: Deploy lên Railway (PAID - Recommended)

### Tại sao chọn Railway?
- ⚡ Performance tốt hơn Render
- 🚀 Deploy nhanh hơn
- 🔄 Auto-deploy từ GitHub
- 💾 Database tích hợp sẵn
- 💰 Chi phí: ~$5-10/month

### Các bước deploy:

1. **Truy cập Railway**: https://railway.app → Sign up

2. **Create New Project** → Deploy from GitHub

3. **Deploy Backend**:
   - Chọn repo → Chọn folder `server`
   - Railway tự động detect Node.js
   - Add environment variables (giống Render)
   - Generate domain

4. **Add MongoDB**:
   - Click "New" → "Database" → "MongoDB"
   - Railway tự động tạo và inject `MONGO_URI`

5. **Add Redis** (optional):
   - Click "New" → "Database" → "Redis"
   - Railway tự động inject `REDIS_URL`

6. **Deploy Frontend**:
   - Same project → Add service → Select `client` folder
   - Add environment variables
   - Generate domain

---

## 🎯 Option 3: Deploy lên VPS (DigitalOcean, AWS, etc.)

### Phù hợp khi:
- Cần full control
- Scale lớn
- Custom setup

### Các bước cơ bản:

1. **Thuê VPS** (DigitalOcean, Vultr, AWS EC2)
2. **Setup server**:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MongoDB
   # Install Redis
   # Install Nginx
   # Install PM2
   ```

3. **Clone repository**
4. **Setup environment variables**
5. **Build và run với PM2**
6. **Config Nginx reverse proxy**
7. **Setup SSL với Let's Encrypt**

---

## 📝 Checklist Trước Khi Deploy

- [ ] Push code lên GitHub
- [ ] Tạo MongoDB Atlas cluster
- [ ] Setup Cloudinary account
- [ ] Setup Stripe account
- [ ] Setup email service (Gmail App Password)
- [ ] Tạo các environment variables
- [ ] Test local với production env variables
- [ ] Update CORS settings
- [ ] Remove console.logs không cần thiết
- [ ] Check security (helmet, rate limiting)

---

## 🐛 Troubleshooting

### Backend không start được
- Check logs trong Render/Railway
- Verify MongoDB connection string
- Check tất cả environment variables đã đúng

### Socket.IO không hoạt động
- Ensure `CLIENT_URL` đã set đúng trong backend
- Check CORS configuration
- Verify Socket.IO client connecting to correct URL

### Images không upload được
- Verify Cloudinary credentials
- Check multer configuration

### Payment không hoạt động
- Đổi từ test keys sang live keys
- Enable payment methods trong Stripe dashboard

---

## 💡 Tips

1. **Free Tier Limitation**:
   - Render free tier: Service sleep sau 15 phút không dùng
   - Giải pháp: Dùng cron job ping mỗi 10 phút hoặc upgrade plan

2. **Environment Variables**:
   - KHÔNG commit `.env` files
   - Dùng `.env.example` để document cần những biến gì

3. **Database Backup**:
   - MongoDB Atlas tự động backup
   - Nên export data định kỳ

4. **Monitoring**:
   - Dùng Render/Railway built-in monitoring
   - Hoặc setup Sentry cho error tracking

---

## 📞 Cần Hỗ Trợ?

Nếu gặp vấn đề trong quá trình deploy:
1. Check logs trong platform dashboard
2. Verify environment variables
3. Test API endpoints với Postman
4. Check database connection

Good luck! 🚀
