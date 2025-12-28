# Backend-Frontend Integration Test Guide

## Kiểm tra tích hợp Menu System

### 1. Backend Setup
Đảm bảo backend đang chạy với seed data:

```bash
cd server
npm run seed  # Chạy seed data
npm run dev   # Start server
```

### 2. Frontend Setup  
Đảm bảo frontend đang chạy:

```bash
cd client
npm run dev   # Start client
```

### 3. Test Cases

#### A. Test QR Code Integration
1. **Access with QR Token:**
   - Backend sẽ generate QR code với token trong seed data
   - URL: `http://localhost:5173/table?token=<qr_token>`
   - Kết quả mong đợi: Hiển thị thông tin table và menu

2. **Access with Legacy Parameters:**
   - URL: `http://localhost:5173/menu?table_id=<table_id>&restaurant_id=<restaurant_id>`
   - Kết quả mong đợi: Hiển thị menu với table info

#### B. Test Menu Features

1. **Load Menu Items:**
   - Truy cập: `http://localhost:5173/menu`
   - Kết quả mong đợi: 
     - Load categories (Appetizers, Main Dishes, Drinks, Desserts)
     - Load menu items từ seed data
     - Display loading state correctly

2. **Search Functionality:**
   - Tìm kiếm: "salmon"
   - Kết quả mong đợi: Hiển thị Grilled Salmon

3. **Category Filter:**
   - Click category "Main Dishes"
   - Kết quả mong đợi: Chỉ hiển thị main dishes

4. **Sort Functionality:**
   - Sort by price (ascending)
   - Kết quả mong đợi: Items sắp xếp theo giá

5. **Add to Order:**
   - Click "Add to Order" (cần QR access)
   - Kết quả mong đợi: Item được add vào order

### 4. API Endpoints Testing

```bash
# Get menu items
curl "http://localhost:5000/api/menu-items"

# Get categories  
curl "http://localhost:5000/api/categories"

# Search menu items
curl "http://localhost:5000/api/menu-items?search=salmon"

# Filter by category
curl "http://localhost:5000/api/menu-items?categoryId=<category_id>"

# Sort by price
curl "http://localhost:5000/api/menu-items?sortBy=price&order=asc"

# Verify QR token
curl "http://localhost:5000/api/tables/verify-qr/<token>"
```

### 5. Expected Data Structure

#### Menu Item Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Grilled Salmon", 
      "description": "Fresh Atlantic salmon...",
      "price": 18,
      "categoryId": {
        "_id": "...",
        "name": "Main Dishes"
      },
      "status": "available",
      "isRecommended": true,
      "prepTime": 15,
      "allergens": ["Fish", "Dairy"]
    }
  ]
}
```

#### Category Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Appetizers",
      "description": "Start your meal right"
    }
  ]
}
```

### 6. Troubleshooting

#### Common Issues:
1. **CORS Error:** Đảm bảo backend có cấu hình CORS
2. **404 Not Found:** Kiểm tra API routes
3. **Empty Data:** Chạy lại seed script
4. **QR Token Invalid:** Kiểm tra JWT secret và token generation

#### Debug Steps:
1. Check browser console for errors
2. Check network tab for API calls
3. Verify backend logs
4. Check MongoDB data with MongoDB Compass

### 7. Demo Credentials từ Seed Data:

```
Admin: admin@restaurant.com / Admin123
Waiter: waiter@restaurant.com / Waiter123  
Kitchen: kitchen@restaurant.com / Kitchen123
Customer: customer@example.com / Customer123
```

### 8. Sample QR URLs từ Seed Data:

Tables 1-8 sẽ được tạo với QR tokens. Kiểm tra database để lấy actual tokens hoặc check console khi chạy seed.

### 9. Production Checklist:

- [ ] Environment variables đúng
- [ ] API base URL configuration
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsive
- [ ] Performance optimization
- [ ] Security (HTTPS, proper tokens)