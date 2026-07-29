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
            <span>
              {usage.remaining.analyses} analysis{usage.remaining.analyses === 1 ? '' : 'es'} left today
            </span>
            <span className="usage-divider">·</span>
            <span>
              {usage.remaining.tutorMessages} tutor message{usage.remaining.tutorMessages === 1 ? '' : 's'} left
            </span>
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
