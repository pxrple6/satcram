import React from 'react'
import { SignUp } from '@clerk/react'
import SiteHeader from '../components/Marketing/SiteHeader.jsx'

export default function SignUpPage() {
  return (
    <div className="auth-shell">
      <SiteHeader />
      <div className="auth-center">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          afterSignUpUrl="/app"
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
