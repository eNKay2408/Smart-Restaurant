# 🍽️ Smart Restaurant - Backend Week 1

## 📋 Tổng Quan

Backend API cho hệ thống đặt món qua QR code của nhà hàng thông minh.

**Công nghệ**: Node.js + Express.js + MongoDB + JWT + Swagger UI

---

## ✅ Đã Hoàn Thành

### 🔐 Authentication System
- Đăng ký, đăng nhập với JWT
- Quản lý profile, đổi password
- Role-based authorization (5 roles: superadmin, admin, waiter, kitchen, customer)
- Password hashing với bcrypt

### 📁 Category Management
- CRUD đầy đủ cho danh mục món ăn
- Chỉ admin mới được thao tác

### 🍽️ Menu Item Management
- CRUD đầy đủ cho món ăn
- **Advanced features**:
  - Tìm kiếm text (search)
  - Lọc theo category, giá, trạng thái
  - Sắp xếp (sort)
  - Phân trang (pagination)
  - Hỗ trợ modifiers (size, topping, etc.)

### 🪑 Table Management & QR Code
- CRUD đầy đủ cho bàn ăn
- **QR Code generation** với JWT signing
- Verify QR code
- Regenerate QR code

### 📚 Swagger UI Documentation
- Interactive API docs tại `/api/docs`
- Test API trực tiếp trong browser
- Không cần Postman!

### 🗄️ Database Models (7 models)
- User, Restaurant, Category, MenuItem, Table, Order, Review

### 🔒 Security
- Helmet, CORS, Rate Limiting
- Input validation
- Error handling

---

## 🚀 Cách Chạy

### Bước 1: Cài đặt
```bash
cd server
npm install
```

### Bước 2: Cấu hình MongoDB

**Option A: MongoDB Local**
```bash
# Cài MongoDB Community Server
# https://www.mongodb.com/try/download/community

# Chạy MongoDB
mongod
```

**Option B: MongoDB Atlas (Khuyến nghị)**
1. Tạo tài khoản miễn phí: https://www.mongodb.com/cloud/atlas
2. Tạo cluster (FREE tier)
3. Tạo user: `smartrestaurant` / `SmartRestaurant123`
4. Whitelist IP: Allow from anywhere (0.0.0.0/0)
5. Lấy connection string

### Bước 3: Cấu hình .env

Tạo file `.env` trong folder `server/`:

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/smart-restaurant
# Hoặc dùng Atlas:
# MONGODB_URI=mongodb+srv://smartrestaurant:SmartRestaurant123@cluster0.xxxxx.mongodb.net/smart-restaurant

# JWT - QUAN TRỌNG!
JWT_SECRET=smart-restaurant-super-secret-jwt-key-2024
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=smart-restaurant-refresh-token-secret-2024
JWT_REFRESH_EXPIRE=30d

# QR Code
QR_CODE_BASE_URL=http://localhost:5173/table
QR_CODE_SECRET=smart-restaurant-qr-signing-secret-2024

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Bước 4: Seed Database
```bash
npm run seed
```

Kết quả:
```
✅ Created Super Admin
✅ Created Admin
✅ Created Waiter
✅ Created Kitchen Staff
✅ Created Customer
✅ Created Categories (4)
✅ Created Menu Items (9)
✅ Created Tables with QR Codes (8)
```

### Bước 5: Chạy Server
```bash
npm run dev
```

Server chạy tại: **http://localhost:5000**

---

## 🧪 Cách Test API

### 1. Swagger UI (Khuyến nghị)

Mở: **http://localhost:5000/api/docs**

**Workflow:**

1. **Login** để lấy token:
   - Tìm `POST /api/auth/login`
   - Click "Try it out"
   - Nhập:
     ```json
     {
       "email": "admin@restaurant.com",
       "password": "Admin123"
     }
     ```
   - Click "Execute"
   - **Copy `accessToken`**

2. **Authorize**:
   - Click nút "Authorize" (góc trên, icon khóa 🔒)
   - Nhập: `Bearer YOUR_ACCESS_TOKEN`
   - Click "Authorize" → "Close"

3. **Test endpoints**:
   - Bây giờ có thể test tất cả endpoints!
   - Ví dụ: `GET /api/auth/me`, `GET /api/menu-items`, `POST /api/menu-items`

### 2. Test Accounts

```
Admin:    admin@restaurant.com / Admin123
Waiter:   waiter@restaurant.com / Waiter123
Kitchen:  kitchen@restaurant.com / Kitchen123
Customer: customer@example.com / Customer123
```

### 3. Test với curl

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"Admin123"}'

# Get menu items
curl http://localhost:5000/api/menu-items

# Get menu items với filters
curl "http://localhost:5000/api/menu-items?search=salmon&minPrice=10&maxPrice=50&sort=-price"
```

---

## 📊 API Endpoints (30+)

### Authentication (9 endpoints)
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` 🔒 - Thông tin user hiện tại
- `PUT /api/auth/profile` 🔒 - Cập nhật profile
- `PUT /api/auth/password` 🔒 - Đổi password
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify-email/:token` - Xác thực email
- `GET /api/auth/check-email/:email` - Kiểm tra email

### Categories (5 endpoints)
- `GET /api/categories` - Lấy tất cả
- `GET /api/categories/:id` - Lấy 1 category
- `POST /api/categories` 🔒 - Tạo mới (Admin)
- `PUT /api/categories/:id` 🔒 - Cập nhật (Admin)
- `DELETE /api/categories/:id` 🔒 - Xóa (Admin)

### Menu Items (6 endpoints)
- `GET /api/menu-items` - Lấy tất cả (có filters)
  - Query params: `search`, `categoryId`, `minPrice`, `maxPrice`, `isAvailable`, `sort`, `page`, `limit`
- `GET /api/menu-items/:id` - Lấy 1 món
- `POST /api/menu-items` 🔒 - Tạo món (Admin)
- `PUT /api/menu-items/:id` 🔒 - Cập nhật (Admin)
- `PATCH /api/menu-items/:id/status` 🔒 - Đổi trạng thái (Admin)
- `DELETE /api/menu-items/:id` 🔒 - Xóa (Admin)

### Tables (7 endpoints)
- `GET /api/tables` 🔒 - Lấy tất cả (Admin/Waiter)
- `GET /api/tables/:id` - Lấy 1 bàn
- `POST /api/tables` 🔒 - Tạo bàn (Admin)
- `PUT /api/tables/:id` 🔒 - Cập nhật (Admin)
- `POST /api/tables/:id/regenerate-qr` 🔒 - Tạo lại QR (Admin)
- `DELETE /api/tables/:id` 🔒 - Xóa (Admin)
- `GET /api/tables/verify-qr/:token` - Verify QR code

🔒 = Cần authentication

**Chi tiết đầy đủ**: http://localhost:5000/api/docs

---

## 🐛 Troubleshooting

### Lỗi: MongoDB Connection
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix**: 
- Chạy `mongod` (nếu dùng local)
- Hoặc dùng MongoDB Atlas

### Lỗi: Port 5000 đã được dùng
```
Error: listen EADDRINUSE :::5000
```
**Fix**:
```bash
npx kill-port 5000
```

### Lỗi: JWT Secret
```
secretOrPrivateKey must have a value
```
**Fix**: Kiểm tra file `.env` có đầy đủ:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `QR_CODE_SECRET`

### Server không start
1. Kiểm tra MongoDB đang chạy
2. Kiểm tra file `.env`
3. Chạy `npm install` lại
4. Xem error logs trong terminal

---

## 📁 Cấu Trúc Project

```
server/
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   ├── jwt.js           # JWT utilities
│   │   └── swagger.js       # Swagger config
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── menuItemController.js
│   │   └── tableController.js
│   ├── middlewares/         # Custom middleware
│   │   ├── auth.js          # JWT auth & authorization
│   │   ├── errorHandler.js  # Error handling
│   │   └── validator.js     # Input validation
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── Category.js
│   │   ├── MenuItem.js
│   │   ├── Table.js
│   │   ├── Order.js
│   │   └── Review.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── menuItemRoutes.js
│   │   └── tableRoutes.js
│   ├── scripts/
│   │   └── seed.js          # Database seeding
│   └── app.js               # Express app
├── .env                     # Environment variables
├── .env.example             # Template
├── package.json
└── README.md                # This file
```

---

## 🎯 Thống Kê

- **API Endpoints**: 30+
- **Database Models**: 7
- **Lines of Code**: 2000+
- **Dependencies**: 30+
- **Test Accounts**: 5
- **Seed Data**: 4 categories, 9 menu items, 8 tables

---

## 🔜 Week 2 (Kế hoạch)

- [ ] Order creation API
- [ ] Payment integration (Stripe)
- [ ] Socket.IO real-time
- [ ] Email service
- [ ] File upload (Cloudinary)

---

## 📞 Support

- **Swagger UI**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health
- **GitHub**: [Repository URL]

---

**Status**: ✅ Week 1 Complete  
**Last Updated**: December 2024
