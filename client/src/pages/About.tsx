function About() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        About Us
                    </h1>
                    <p className="text-center text-gray-700 mb-12 text-lg">
                        Your trusted partner in modern restaurant management
                    </p>

                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <h2 className="text-3xl font-semibold mb-4 text-gray-800">Our Story</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Smart Restaurant was founded with a vision to revolutionize the dining experience
                            through technology. We combine traditional hospitality with cutting-edge digital
                            solutions to create seamless experiences for both restaurant owners and customers.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            Our platform helps restaurants manage their operations efficiently while providing
                            customers with a modern, intuitive way to explore menus, place orders, and enjoy
                            their dining experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-2xl font-semibold mb-3 text-green-600">Our Mission</h3>
                            <p className="text-gray-600">
                                To empower restaurants with intelligent tools that enhance efficiency,
                                improve customer satisfaction, and drive business growth.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-2xl font-semibold mb-3 text-teal-600">Our Vision</h3>
                            <p className="text-gray-600">
                                To become the leading restaurant management platform, trusted by thousands
                                of establishments worldwide.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;
