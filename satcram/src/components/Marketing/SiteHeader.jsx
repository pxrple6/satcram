import React from 'react'
import { Link } from 'react-router-dom'
import { Show, SignInButton, SignUpButton } from '@clerk/react'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="logo">
        <h1>SATcram</h1>
      </Link>
      <nav>
        <a href="/#how-it-works" className="hide-mobile">
          How it works
        </a>
        <a href="/#features" className="hide-mobile">
          Features
        </a>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button type="button" className="btn btn-ghost btn-sm">
              Log in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="btn btn-sm">
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Link to="/app" className="btn btn-sm">
            Open app
          </Link>
        </Show>
      </nav>
    </header>
  )
}
