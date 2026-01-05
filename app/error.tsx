'use client'

import { useEffect, useState } from 'react'
import { isInIframe, sendErrorToParent, requestFixFromParent } from '@/components/ErrorBoundary'

/**
 * ERROR BOUNDARY - Handles runtime errors with "Fix with AI" support
 * Shows "Fix with AI" button when running in iframe (parent app can auto-fix)
 */

interface ErrorDetails {
  type: 'react_error' | 'api_error' | 'parse_error' | 'network_error' | 'unknown'
  message: string
  stack?: string
  componentStack?: string
  raw_response?: string
  endpoint?: string
  timestamp: string
  userAgent: string
  url: string
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [inIframe, setInIframe] = useState(false)
  const [fixRequested, setFixRequested] = useState(false)

  useEffect(() => {
    setInIframe(isInIframe())

    // Send error to parent automatically when in iframe
    const errorDetails: ErrorDetails = {
      type: 'react_error',
      message: error.message || 'An unexpected error occurred',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    if (isInIframe()) {
      sendErrorToParent(errorDetails)
    }
  }, [error])

  const handleFix = () => {
    const errorDetails: ErrorDetails = {
      type: 'react_error',
      message: error.message || 'An unexpected error occurred',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    requestFixFromParent(errorDetails)
    setFixRequested(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-500 px-6 py-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold text-white">Something went wrong!</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Error Message */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-words">
                  {error.message || 'An unexpected error occurred'}
                </p>
              </div>

              {/* Stack trace (collapsible) */}
              {error.stack && (
                <details className="group">
                  <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                    View stack trace
                  </summary>
                  <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}

              {/* Fix requested message */}
              {fixRequested && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Fix request sent to AI agent...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {inIframe ? 'Running in iframe' : 'Standalone mode'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Try again
                </button>
                {inIframe && !fixRequested && (
                  <button
                    onClick={handleFix}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Fix with AI
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
