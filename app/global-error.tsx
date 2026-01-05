'use client'

import { useEffect, useState } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [fixRequested, setFixRequested] = useState(false)

  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
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
          <div style={{ backgroundColor: '#ef4444', padding: '1rem 1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', margin: 0 }}>
              Error
            </h2>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#111827', margin: 0, wordBreak: 'break-word' }}>
                {error.message || 'An error occurred'}
              </p>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1rem 1.5rem',
            backgroundColor: '#f9fafb',
            display: 'flex',
            gap: '0.75rem'
          }}>
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
          </div>
        </div>
      </div>
    </div>
  )
}
