'use client'

import { useEffect } from 'react'
import { installAgentInterceptor } from '@/lib/agent-fetch-interceptor'

/**
 * Provider that installs the global fetch interceptor for /api/agent calls.
 * Auto-detects parse failures and sends "Fix with AI" requests to parent.
 *
 * Add this to your layout.tsx to enable auto-fix for ALL agent calls.
 */
export function AgentInterceptorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Install interceptor on mount
    installAgentInterceptor()

    // Note: We don't uninstall on unmount because this provider
    // should be at the root and persist for the app lifetime
  }, [])

  return <>{children}</>
}

export default AgentInterceptorProvider
