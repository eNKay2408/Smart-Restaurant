import { NavLink } from 'react-router-dom';

function Navbar() {
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

                    <div className="flex space-x-1">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            Home
                        </NavLink>
                        <NavLink
                            to="/menu"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            Menu
                        </NavLink>
                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            About
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
