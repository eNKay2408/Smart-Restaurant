import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import WaiterOrders from "./pages/waiter/Orders";
import KDS from "./pages/kitchen/KDS";

function App() {
	return (
		<div>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/menu" element={<Menu />} />
				<Route path="/menu/table/:tableId" element={<Menu />} />
				<Route path="/table" element={<Menu />} /> {/* For QR token access */}
				<Route path="/about" element={<About />} />
				<Route path="/login" element={<Login />} />
				<Route path="/waiter/orders" element={<WaiterOrders />} />
				<Route path="/kitchen/kds" element={<KDS />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</div>
	);
}

export default App;
