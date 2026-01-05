/**
 * NOT FOUND PAGE - Pre-configured, DO NOT MODIFY!
 * This handles 404 errors.
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">404</h2>
        <p className="text-gray-600 mb-6">Page not found</p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
