import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, isWaiter, isKitchen } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Define menu items based on user role
    const getMenuItems = () => {
        if (isWaiter) {
            return [
                {
                    path: '/waiter/orders',
                    name: 'Orders',
                    icon: '📋'
                }
            ];
        }

        if (isKitchen) {
            return [
                {
                    path: '/kitchen/kds',
                    name: 'Kitchen',
                    icon: '👨‍🍳'
                }
            ];
        }

        // Default admin menu items
        return [
            {
                path: '/admin/dashboard',
                name: 'Dashboard',
                icon: '📊'
            },
            {
                path: '/admin/menu',
                name: 'Menu',
                icon: '🍽️',
                submenu: [
                    { path: '/admin/menu', name: 'Items' },
                    { path: '/admin/categories', name: 'Categories' },
                    { path: '/admin/modifiers', name: 'Modifiers' },
                ]
            },
            {
                path: '/admin/tables',
                name: 'Tables',
                icon: '🪑'
            },
            {
                path: '/admin/orders',
                name: 'Orders',
                icon: '📋'
            },
            {
                path: '/admin/users',
                name: 'Users',
                icon: '👥'
            },
            {
                path: '/admin/reports',
                name: 'Reports',
                icon: '📈'
            }
        ];
    };

    const menuItems = getMenuItems();

    const isActivePath = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        {/* Logo and Title */}
                        <div className="flex items-center space-x-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Smart Restaurant</h1>
                                <p className="text-sm text-gray-600">
                                    {isAdmin ? 'Admin Panel' :
                                        isWaiter ? 'Waiter Panel' :
                                            isKitchen ? 'Kitchen Panel' : 'Staff Panel'}
                                </p>
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                    {user?.fullName?.charAt(0) || 'A'}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-700">{user?.fullName || 'Admin'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* User Menu Dropdown */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <Link
                                        to="/admin/profile"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </Link>
                                    <hr className="my-1 border-gray-200" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Horizontal Navigation */}
                    <nav className="flex flex-wrap gap-1">
                        {menuItems.map((item, index) => (
                            <div key={index} className="relative group">
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${isActivePath(item.path)
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="text-lg mr-2">{item.icon}</span>
                                    <span className="font-medium">{item.name}</span>
                                </Link>

                                {/* Submenu Dropdown */}
                                {item.submenu && (
                                    <div className="absolute left-0 top-full mt-1 min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        {item.submenu.map((subItem, subIndex) => (
                                            <Link
                                                key={subIndex}
                                                to={subItem.path}
                                                className={`block px-4 py-2 text-sm transition-colors ${location.pathname === subItem.path
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {subItem.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Page Content */}
            <main className="p-6">
                {children}
            </main>

            {/* Click outside to close user menu */}
            {showUserMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;