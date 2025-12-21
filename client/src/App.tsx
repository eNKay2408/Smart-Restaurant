import { useState } from 'react'

function App() {
    const [count, setCount] = useState(0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Smart Restaurant
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Vite + React + TailwindCSS
                </p>

                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={() => setCount((count) => count + 1)}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Count is {count}
                    </button>

                    <p className="text-gray-500 text-sm text-center">
                        Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.tsx</code> to get started
                    </p>
                </div>
            </div>
        </div>
    )
}

export default App
