***(30 Ngày | 3 Intern | Săn Điểm Tối Đa)***

### **1. Tech Stack (Chốt)**

| **Layer**     | **Công nghệ**              | **Lý do (Gen Z Style)**                               |
| ------------- | -------------------------- | ----------------------------------------------------- |
| **Backend**   | Node.js (Express)          | Code nhanh, nhiều package, dễ handle async.           |
| **Database**  | MongoDB                    | Dễ handle Menu/Modifiers (JSON) phức tạp hơn SQL.     |
| **Frontend**  | React (Vite) + TailwindCSS | Setup nhanh hơn Next.js, UI đẹp, code nhanh như chớp. |
| **Real-time** | Socket.IO                  | Bắt buộc phải có để lấy 0.5 điểm Real-time.           |
| **Payment**   | Stripe Sandbox             | Chuẩn quốc tế, dễ tích hợp nhất cho demo.             |

### **2. Phân Công Chi Tiết (Role Based)**

| **Thành viên** | **Role**                           | **Trách nhiệm chính (Phần cứng)**                                                    | **Tối đa hóa điểm**                               |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 🧑‍💻 **Member 1** | **Frontend Lead (The Beautifier)** | Giao diện Khách hàng (Mobile-first) & Admin Dashboard UI. Logic Cart, Search/Filter. | User-centered design (-5 điểm nếu làm xấu).       |
| 🧑‍💻 **Member 2** | **Backend Lead (The Architect)**   | Toàn bộ API, Auth (JWT), Database, Stripe Integration, Logic QR.                     | Database Structure, Security, Payment (0.5 điểm). |
| 🧑‍💻 **Member 3** | **Fullstack/Real-time (The Glue)** | Waiter UI, KDS UI (Bếp), Toàn bộ logic Socket.IO, Xử lý trạng thái Order.            | Real-time Update (0.5 điểm), Waiter/KDS Flow.     |

### **3. Roadmap 4 Tuần (Sprints)**

| **Tuần** | **Mục tiêu chính**    | **Member 1 (FE Customer/Admin)**                                                    | **Member 2 (BE Core/Data)**                                                         | **Member 3 (Realtime/KDS)**                                                                                |
| -------- | --------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **W1**   | **Foundation & Menu** | Layout: Login, Register, Menu (list, detail), Cart.                                 | Setup Project, DB, Auth API. API CRUD Menu/Category/Table.                          | Setup Socket.IO Server. Layout Waiter/KDS cơ bản.                                                          |
| **W2**   | **Order Flow & Cart** | Logic: Thêm vào Cart, Tích hợp API Submit Order. Giao diện Order Tracking (status). | API Order (Create, Gộp đơn), API Payment Placeholder. Logic Generate QR Code (URL). | Waiter Logic: Load đơn pending, Nút Accept/Reject (dùng API).                                              |
| **W3**   | **Real-time & KDS**   | UI: Cập nhật trạng thái đơn realtime. Giao diện "Request Bill".                     | Fix Bugs API, Hỗ trợ Socket Data. API Export Report (data thô).                     | **Heavy:** Logic Socket (New Order -> Waiter -> KDS). Nút Chuyển Trạng thái (Pending -> Cooking -> Ready). |
| **W4**   | **Polish & Về Đích**  | UI: Bill, Profile, Fix Bugs nhỏ. Tích hợp Stripe Sandbox UI.                        | Hoàn thiện Stripe Integration (Test Mode). Deploy lên hosting (Render/Vercel).      | Quay Video Demo (Kịch bản), Viết Documentation (Report).                                                   |

### **4. Checklist "Hack Điểm" (Bắt buộc phải làm)**

| **Tính năng**         | **Điểm liên quan**     | **Ai phụ trách?** | **Notes (Chạy nước rút)**                                                                     |
| --------------------- | ---------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| **Real-time Updates** | 0.5 điểm               | Member 3          | **BẮT BUỘC:** Waiter/KDS phải tự nhảy đơn.                                                    |
| **Waiter/KDS Flow**   | 0.5 điểm               | Member 3          | Đơn phải qua **Waiter duyệt** trước khi tới Bếp.                                              |
| **Payment (Stripe)**  | 0.5 điểm               | Member 2          | Chỉ cần Test Card, không cần luồng Production.                                                |
| **Mobile UI**         | -5 điểm (Nếu làm xấu)  | Member 1          | Phải dùng TailwindCSS để UI nhìn chuyên nghiệp.                                               |
| **Deploy Public**     | 0.25 điểm              | Member 2          | Dùng Render/Vercel/Netlify. Càng sớm càng tốt.                                                |
| **Demo Video**        | -5 điểm (Nếu không có) | All               | Kịch bản mượt: Scan -> Order -> Accept -> Cook -> Serve -> Pay. Dành 2 ngày cuối chỉ để quay. |
| **DB Design**         | Phân tích tốt          | Member 2          | Dùng MongoDB: **Menu items phải có Modifiers lồng nhau** (VD: Size, Topping).                 |