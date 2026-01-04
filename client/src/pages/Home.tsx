import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Welcome to Smart Restaurant
                    </h1>
                    <p className="text-xl text-gray-700 mb-8">
                        Experience the future of dining with our intelligent restaurant management system
                    </p>

                    {/* Quick Test Links */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">🧪 Quick Test Links</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Link 
                                to="/menu" 
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                📱 Customer Menu
                            </Link>
                            <Link 
                                to="/item/1" 
                                className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                🍽️ Item Detail
                            </Link>
                            <Link 
                                to="/cart" 
                                className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                🛒 Cart
                            </Link>
                            <Link 
                                to="/order-status" 
                                className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                📊 Order Status
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
                            <div className="text-4xl mb-4">🍽️</div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-800">Smart Menu</h3>
                            <p className="text-gray-600">Browse our digital menu with real-time availability</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-800">Fast Service</h3>
                            <p className="text-gray-600">Quick ordering and efficient table management</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
                            <div className="text-4xl mb-4">⭐</div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-800">Quality Food</h3>
                            <p className="text-gray-600">Fresh ingredients and excellent cuisine</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
