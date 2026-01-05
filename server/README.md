# 🍽️ Smart Restaurant - Backend Week 2

## 📋 Tổng Quan

Backend API cho hệ thống đặt món qua QR code của nhà hàng thông minh - **Week 2 Update**

**Công nghệ**: Node.js + Express.js + MongoDB + JWT + Swagger UI + **Stripe Payment** + Socket.IO

---

## ✅ Đã Hoàn Thành Week 2

### 💳 Payment Integration (NEW!)
- ✅ **Stripe Payment Integration**
  - Create Payment Intent
  - Confirm Payment
  - Payment Status Tracking
  - Webhook Handler for real-time updates
  - Refund Support
  - Cash Payment (Manual by Waiter)
- ✅ **Payment Methods Support**
  - Card (Stripe)
  - Cash
  - Support for future: ZaloPay, Momo, VNPay
- ✅ **Payment Security**
  - Webhook signature verification
  - Payment intent validation
  - Amount verification

### 🔄 Real-time Updates (Enhanced)
- ✅ Socket.IO integration with payment events
- ✅ Real-time payment status notifications
- ✅ Order completion notifications

---

## 🚀 Cách Chạy

### Bước 1: Cài đặt
```bash
cd server
npm install
```

### Bước 2: Cấu hình .env

Thêm Stripe keys vào file `.env`:

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/smart-restaurant
# Hoặc MongoDB Atlas

# JWT
JWT_SECRET=smart-restaurant-super-secret-jwt-key-2024
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=smart-restaurant-refresh-token-secret-2024
JWT_REFRESH_EXPIRE=30d

# QR Code
QR_CODE_BASE_URL=http://localhost:5173/table
QR_CODE_SECRET=smart-restaurant-qr-signing-secret-2024

# Stripe Payment (NEW!)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Bước 3: Setup Stripe (NEW!)

1. **Tạo Stripe Account**: https://dashboard.stripe.com/register
2. **Lấy API Keys**: Developers → API Keys
3. **Copy keys** vào `.env`
4. **Test Mode**: Đảm bảo đang ở Test Mode

Chi tiết: Xem `docs/PAYMENT.md`

### Bước 4: Seed Database
```bash
npm run seed
```

### Bước 5: Chạy Server
```bash
npm run dev
```

Server chạy tại: **http://localhost:5000**

---

## 📊 API Endpoints (40+)

### Authentication (9 endpoints)
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` 🔒 - Thông tin user
- `PUT /api/auth/profile` 🔒 - Cập nhật profile
- `PUT /api/auth/password` 🔒 - Đổi password
- ... (xem README cũ)

### Categories (5 endpoints)
- `GET /api/categories` - Lấy tất cả
- `POST /api/categories` 🔒 - Tạo mới (Admin)
- ... (xem README cũ)

### Menu Items (6 endpoints)
- `GET /api/menu-items` - Lấy tất cả (có filters)
- `POST /api/menu-items` 🔒 - Tạo món (Admin)
- ... (xem README cũ)

### Tables (7 endpoints)
- `GET /api/tables` 🔒 - Lấy tất cả
- `POST /api/tables/:id/regenerate-qr` 🔒 - Tạo lại QR
- ... (xem README cũ)

### Orders (7 endpoints)
- `GET /api/orders` 🔒 - Lấy tất cả
- `POST /api/orders` - Tạo đơn
- `PATCH /api/orders/:id/accept` 🔒 - Accept (Waiter)
- `PATCH /api/orders/:id/reject` 🔒 - Reject (Waiter)
- `PATCH /api/orders/:id/status` 🔒 - Cập nhật status
- ... (xem README cũ)

### 💳 Payments (6 endpoints) - NEW!
- `POST /api/payments/create-intent` - Tạo payment intent
- `POST /api/payments/confirm` - Xác nhận thanh toán
- `GET /api/payments/status/:orderId` - Kiểm tra trạng thái
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/cash` 🔒 - Thanh toán tiền mặt (Waiter)
- `POST /api/payments/refund` 🔒 - Hoàn tiền (Admin)

🔒 = Cần authentication

**Chi tiết đầy đủ**: http://localhost:5000/api/docs

---

## 🧪 Testing Payment

### Test với Swagger UI
1. Mở: http://localhost:5000/api/docs
2. Scroll xuống section **Payments**
3. Test endpoints

### Test với curl

```bash
# Create payment intent
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "YOUR_ORDER_ID",
    "paymentMethod": "card"
  }'

# Check payment status
curl http://localhost:5000/api/payments/status/YOUR_ORDER_ID
```

### Stripe Test Cards

| Card Number         | Result    |
|---------------------|-----------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Declined |

**Chi tiết testing**: Xem `docs/PAYMENT_TESTING.md`

---

## 📁 Cấu Trúc Project (Updated)

```
server/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   ├── swagger.js
│   │   └── stripe.js          # NEW!
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── menuItemController.js
│   │   ├── tableController.js
│   │   ├── orderController.js
│   │   └── paymentController.js  # NEW!
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── menuItemRoutes.js
│   │   ├── tableRoutes.js
│   │   ├── orderRoutes.js
│   │   └── paymentRoutes.js      # NEW!
│   ├── socket/
│   │   └── index.js           # Real-time events
│   └── app.js
├── docs/                       # NEW!
│   ├── PAYMENT.md             # Payment guide
│   └── PAYMENT_TESTING.md     # Testing guide
└── README.md
```

---

## 🎯 Thống Kê

- **API Endpoints**: 40+
- **Database Models**: 7
- **Lines of Code**: 3000+
- **Dependencies**: 30+
- **Payment Methods**: 2 (Card, Cash) + 3 future (ZaloPay, Momo, VNPay)

---

## 🔜 Week 3 (Kế hoạch)

- [ ] Email service (Order confirmation, Payment receipt)
- [ ] File upload (Cloudinary for menu images)
- [ ] Advanced reporting API
- [ ] Kitchen Display System enhancements
- [ ] Performance optimization

---

## 📞 Support

- **Swagger UI**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health
- **Payment Guide**: `docs/PAYMENT.md`
- **Testing Guide**: `docs/PAYMENT_TESTING.md`

---

## 🐛 Troubleshooting

### Payment Issues

#### Error: "Invalid API Key"
```bash
# Check .env file
cat .env | grep STRIPE_SECRET_KEY
```

#### Error: "Order not found"
- Kiểm tra orderId có đúng không
- Tạo order mới để test

#### Webhook không hoạt động
```bash
# Test với Stripe CLI
stripe listen --forward-to localhost:5000/api/payments/webhook
```

### General Issues

Xem README cũ cho các lỗi khác.

---

**Status**: ✅ Week 2 Complete (Payment Integration)  
**Last Updated**: December 28, 2024  
**Next**: Week 3 - Email Service & File Upload
