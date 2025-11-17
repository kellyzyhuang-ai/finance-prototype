export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">404 - Page Not Found</h2>
        <a
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-lg inline-block"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}

