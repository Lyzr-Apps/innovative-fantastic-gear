/**
 * MAIN PAGE - Build your UI here!
 *
 * FILE STRUCTURE (DO NOT CHANGE):
 * - app/page.tsx       ← YOU ARE HERE - main page
 * - app/layout.tsx     ← root layout (pre-configured)
 * - app/error.tsx      ← error boundary (pre-configured)
 * - app/not-found.tsx  ← 404 page (pre-configured)
 * - app/loading.tsx    ← loading state (pre-configured)
 * - app/api/           ← API routes
 * - src/components/ui/ ← shadcn/ui components
 * - src/lib/utils.ts   ← cn() helper
 *
 * ⚠️ NEVER create src/app/ - files go in app/ directly!
 * ⚠️ NEVER create error.tsx, not-found.tsx - use the ones here!
 * ⚠️ NEVER import from 'next/document' - App Router doesn't use it!
 */

'use client'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Ready to Build Something Amazing!
        </h1>
        <p className="text-gray-300 text-lg">
          Next.js + TypeScript + Tailwind CSS
        </p>
      </div>
    </div>
  )
}
