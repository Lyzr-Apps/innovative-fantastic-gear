'use client'

import { useEffect, useState } from 'react'

/**
 * GLOBAL ERROR BOUNDARY - Handles root layout errors with "Fix with AI" support
 * This catches errors that error.tsx cannot (root layout errors)
 * Note: Cannot import from @/components because this replaces the entire HTML
 */

interface ErrorDetails {
  type: 'react_error' | 'api_error' | 'parse_error' | 'network_error' | 'unknown'
  message: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
}

// Inline utilities since we can't import in global-error
const isInIframe = (): boolean => {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

const sendErrorToParent = (error: ErrorDetails): void => {
  if (!isInIframe()) return
  try {
    window.parent.postMessage(
      { type: 'CHILD_APP_ERROR', source: 'architect-child-app', payload: error },
      '*'
    )
  } catch (e) {
    console.error('Failed to send error to parent:', e)
  }
}

const generateFixPrompt = (error: ErrorDetails): string => {
  let prompt = `Fix the following CRITICAL error in the child application:\n\n`
  prompt += `**Error Type:** ${error.type}\n`
  prompt += `**Error Message:** ${error.message}\n`
  if (error.stack) {
    prompt += `**Stack Trace:** \`\`\`\n${error.stack.substring(0, 500)}\n\`\`\`\n`
  }
  prompt += `\n**Instructions:** This is a root layout error that crashed the entire app. Analyze and fix the code.`
  return prompt
}

const requestFixFromParent = (error: ErrorDetails): void => {
  if (!isInIframe()) return
  try {
    window.parent.postMessage(
      {
        type: 'FIX_ERROR_REQUEST',
        source: 'architect-child-app',
        payload: { ...error, action: 'fix', fixPrompt: generateFixPrompt(error) },
      },
      '*'
    )
  } catch (e) {
    console.error('Failed to send fix request:', e)
  }
}

export default function GlobalError({
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

    const errorDetails: ErrorDetails = {
      type: 'react_error',
      message: error.message || 'A critical error occurred',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    }

    if (isInIframe()) {
      sendErrorToParent(errorDetails)
    }
  }, [error])

  const handleFix = () => {
    const errorDetails: ErrorDetails = {
      type: 'react_error',
      message: error.message || 'A critical error occurred',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    requestFixFromParent(errorDetails)
    setFixRequested(true)
  }

  // global-error must include html and body tags
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ maxWidth: '32rem', width: '100%', margin: '0 1rem' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ backgroundColor: '#ef4444', padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', margin: 0 }}>
                    Critical Error!
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ backgroundColor: '#f3f4f6', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#111827', margin: 0, wordBreak: 'break-word' }}>
                    {error.message || 'A critical error occurred in the application'}
                  </p>
                </div>

                {fixRequested && (
                  <div style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    padding: '0.75rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#1d4ed8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⏳ Fix request sent to AI agent...
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                borderTop: '1px solid #e5e7eb',
                padding: '1rem 1.5rem',
                backgroundColor: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  {inIframe ? 'Running in iframe' : 'Standalone mode'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={reset}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#374151',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    Try again
                  </button>
                  {inIframe && !fixRequested && (
                    <button
                      onClick={handleFix}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'white',
                        backgroundColor: '#2563eb',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      ⚡ Fix with AI
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
