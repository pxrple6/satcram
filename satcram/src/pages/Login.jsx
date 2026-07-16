import React from 'react'
import { SignIn } from '@clerk/react'
import SiteHeader from '../components/Marketing/SiteHeader.jsx'

export default function Login() {
  return (
    <div className="auth-shell">
      <SiteHeader />
      <div className="auth-center">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/app"
          appearance={{
            elements: {
              rootBox: 'clerk-root',
              card: 'clerk-card panel',
            },
          }}
        />
      </div>
    </div>
  )
}
