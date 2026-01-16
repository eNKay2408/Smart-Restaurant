import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RestaurantProvider } from './contexts/RestaurantContext';
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import WaiterOrders from "./pages/waiter/Orders";
import WaiterBill from "./pages/waiter/Bill";
import PendingPayments from "./pages/waiter/PendingPayments";
import KDS from "./pages/kitchen/KDS";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMenuManagement from "./pages/admin/MenuManagement";
import AdminMenuItemForm from "./pages/admin/MenuItemForm";
import AdminTableManagement from "./pages/admin/TableManagement";
import AdminKDS from "./pages/admin/KDS";
import AdminOrders from "./pages/admin/Orders";
import AdminReports from "./pages/admin/Reports";
import AdminCategoryManagement from "./pages/admin/CategoryManagement";
import AdminModifierManagement from "./pages/admin/ModifierManagement";
import AdminUserManagement from "./pages/admin/UserManagement";
import AdminPromotionManagement from "./pages/admin/PromotionManagement";
import AdminProfile from "./pages/admin/Profile";

// Customer Pages
import MenuItemDetail from "./pages/customer/MenuItemDetail";
import Cart from "./pages/customer/Cart";
import OrderStatus from "./pages/customer/OrderStatus";
import Payment from "./pages/customer/Payment";
import OrderHistory from "./pages/customer/OrderHistory";
import ReviewOrder from "./pages/customer/ReviewOrder";
import Profile from "./pages/customer/Profile";

function App() {
	const location = useLocation();

	// Don't show navbar on admin pages or customer detail pages
	const isAdminPage = location.pathname.startsWith("/admin");
	const isCustomerDetailPage = [
		"/item/",
		"/cart",
		"/order-status",
		"/payment",
	].some((path) => location.pathname.includes(path));

	return (
		<RestaurantProvider>
			<div>
				{!isAdminPage && !isCustomerDetailPage}
				<ToastContainer
					position="top-right"
					autoClose={3000}
					hideProgressBar={false}
					newestOnTop
					closeOnClick
					rtl={false}
					pauseOnFocusLoss
					draggable
					pauseOnHover
				/>
				<Routes>
					{/* Public Routes */}
					<Route path="/" element={<Login />} />
					<Route path="/menu" element={<Menu />} />
					<Route path="/menu/table/:tableId" element={<Menu />} />
					<Route path="/table" element={<Menu />} /> {/* For QR token access */}
					<Route path="/about" element={<About />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/forgot-password" element={<ForgotPassword />} />
					<Route path="/reset-password/:token" element={<ResetPassword />} />
					<Route path="/verify-email/:token" element={<VerifyEmail />} />
					{/* Customer Routes */}
					<Route path="/item/:itemId" element={<MenuItemDetail />} />
					<Route path="/cart" element={<Cart />} />
					<Route path="/order-status" element={<OrderStatus />} />
					<Route path="/order-status/:orderId" element={<OrderStatus />} />
					<Route path="/order-history" element={<OrderHistory />} />
					<Route path="/review/:orderId" element={<ReviewOrder />} />
					<Route path="/profile" element={<Profile />} />
					<Route path="/payment" element={<Payment />} />
					{/* Staff Routes */}
					<Route
						path="/waiter/orders"
						element={
							<ProtectedRoute requiredRole="waiter">
								<WaiterOrders />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/waiter/bill/:orderId"
						element={
							<ProtectedRoute requiredRole="waiter">
								<WaiterBill />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/waiter/pending-payments"
						element={
							<ProtectedRoute requiredRole="waiter">
								<PendingPayments />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/kitchen/kds"
						element={
							<ProtectedRoute requiredRole="kitchen">
								<KDS />
							</ProtectedRoute>
						}
					/>
					{/* Admin Routes */}
					<Route
						path="/admin/dashboard"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminDashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/menu"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminMenuManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/menu/add"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminMenuItemForm />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/menu/edit/:id"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminMenuItemForm />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/tables"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminTableManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/orders"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminOrders />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/kds"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminKDS />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/reports"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminReports />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/categories"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminCategoryManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/modifiers"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminModifierManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/promotions"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminPromotionManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/users"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminUserManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/profile"
						element={
							<ProtectedRoute requiredRole="admin">
								<AdminProfile />
							</ProtectedRoute>
						}
					/>
					{/* Catch all */}
					<Route path="*" element={<NotFound />} />
				</Routes>
			</div>
		</RestaurantProvider>
	);
}

export default App;
