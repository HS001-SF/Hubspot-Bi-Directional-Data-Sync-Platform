export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          HubSpot Bi-Directional Sync Platform
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enterprise-grade data synchronization between HubSpot CRM and PostgreSQL
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Get Started
          </button>
          <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            View Documentation
          </button>
        </div>
      </div>
    </main>
  )
}