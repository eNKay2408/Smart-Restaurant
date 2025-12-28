import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "../services/authService";
import type { User } from "../types/auth.types";

function Navbar() {
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const currentUser = authService.getCurrentUser();
		setUser(currentUser);
		
		// Listen for storage changes (login/logout in other tabs)
		const handleStorageChange = () => {
			const currentUser = authService.getCurrentUser();
			setUser(currentUser);
		};
		
		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	const handleLogout = () => {
		authService.logout();
		setUser(null);
	};
	return (
		<nav className="bg-white shadow-lg sticky top-0 z-50">
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					<NavLink
						to="/"
						className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
					>
						🍽️ Smart Restaurant
					</NavLink>

					<div className="flex items-center space-x-1">
						<NavLink
							to="/"
							className={({ isActive }) =>
								`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
									isActive
										? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
										: "text-gray-700 hover:bg-gray-100"
								}`
							}
						>
							Home
						</NavLink>
						<NavLink
							to="/menu"
							className={({ isActive }) =>
								`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
									isActive
										? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md"
										: "text-gray-700 hover:bg-gray-100"
								}`
							}
						>
							Menu
						</NavLink>

						{/* Show role-based navigation only when logged in */}
						{user && (
							<>
								{user.role === 'waiter' && (
									<NavLink
										to="/waiter/orders"
										className={({ isActive }) =>
											`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
												isActive
													? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md"
													: "text-gray-700 hover:bg-gray-100"
											}`
										}
									>
										👔 Orders
									</NavLink>
								)}
								{user.role === 'kitchen' && (
									<NavLink
										to="/kitchen/kds"
										className={({ isActive }) =>
											`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
												isActive
													? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md"
													: "text-gray-700 hover:bg-gray-100"
											}`
										}
									>
										🍳 Kitchen
									</NavLink>
								)}
							</>
						)}

						<NavLink
							to="/about"
							className={({ isActive }) =>
								`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
									isActive
										? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md"
										: "text-gray-700 hover:bg-gray-100"
								}`
							}
						>
							About
						</NavLink>

						{/* User status section */}
						{user ? (
							<div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-300">
								<span className="text-sm text-gray-600">
									👋 {user.fullName || user.email} ({user.role})
								</span>
								<button
									onClick={handleLogout}
									className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
								>
									Logout
								</button>
							</div>
						) : (
							<NavLink
								to="/login"
								className="ml-4 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
							>
								Login
							</NavLink>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
