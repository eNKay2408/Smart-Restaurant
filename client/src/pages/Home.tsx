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
