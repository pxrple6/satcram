import React from 'react'
import { Show, SignInButton, UserButton } from '@clerk/react'
import Sidebar from './Sidebar.jsx'
import { useStore, useUsage, useProfile } from '../../App.jsx'

export default function AppLayout({ children }) {
  const store = useStore()
  const usage = useUsage()
  const { isSignedIn } = useProfile()

  return (
    <div className="app-shell">
      <Sidebar stats={store.stats} />
      <div className="app-main">
        <header className="app-topbar">
          <div className="usage-pill">
            {isSignedIn && usage.budget ? <span>${usage.budget.spentUsd.toFixed(3)} used · ${usage.budget.remainingUsd.toFixed(2)} of ${usage.budget.limitUsd.toFixed(2)} AI credit left this month</span> : isSignedIn && usage.loading ? <span>Loading AI credit…</span> : isSignedIn ? <span>AI usage temporarily unavailable</span> : <span>Sign in to use AI tutoring</span>}
            {!isSignedIn && (
              <>
                <span className="usage-divider">·</span>
                <SignInButton mode="modal">
                  <button type="button" className="usage-upgrade">
                    Sign in for higher limits
                  </button>
                </SignInButton>
              </>
            )}
          </div>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="btn btn-ghost btn-sm">
                Log in
              </button>
            </SignInButton>
          </Show>
        </header>
        <div className="main-col">
          {children}
        </div>
      </div>
    </div>
  )
}
