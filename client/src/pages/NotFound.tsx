const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <h1 className="text-6xl font-bold text-gray-700">404</h1>
    <p className="text-xl text-gray-500 mt-2">Page not found</p>
    <a
      href="/"
      className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-blue-900 transition-all duration-200 hover:scale-105 hover:shadow-2xl transform"
    >
      Go Home
    </a>
  </div>
);

export default NotFound;
