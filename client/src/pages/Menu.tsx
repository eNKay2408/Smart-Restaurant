function Menu() {
    const menuItems = [
        { id: 1, name: "Grilled Salmon", category: "Main Course", price: "$24.99", emoji: "🐟" },
        { id: 2, name: "Caesar Salad", category: "Appetizer", price: "$12.99", emoji: "🥗" },
        { id: 3, name: "Beef Steak", category: "Main Course", price: "$32.99", emoji: "🥩" },
        { id: 4, name: "Pasta Carbonara", category: "Main Course", price: "$18.99", emoji: "🍝" },
        { id: 5, name: "Chocolate Cake", category: "Dessert", price: "$8.99", emoji: "🍰" },
        { id: 6, name: "Fresh Juice", category: "Beverage", price: "$5.99", emoji: "🧃" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
            <div className="container mx-auto px-4 py-16">
                <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Our Menu
                </h1>
                <p className="text-center text-gray-700 mb-12 text-lg">
                    Delicious dishes prepared with love and care
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                        >
                            <div className="text-5xl mb-4 text-center">{item.emoji}</div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">
                                {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3 text-center">{item.category}</p>
                            <p className="text-2xl font-bold text-orange-600 text-center">{item.price}</p>
                            <button className="mt-4 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded-lg hover:shadow-lg transition-shadow duration-200">
                                Add to Order
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Menu;
