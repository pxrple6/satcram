// Auth is intentionally not wired up yet — src/pages/Login.jsx just
// navigates straight into the app on submit. Drop real logic in here when
// you're ready, then call it from Login.jsx's handleSubmit.
//
// A simple approach:
//   1. Stand up backend endpoints (e.g. POST /api/login, POST /api/signup)
//      that check credentials against your user store and return a session
//      token or set an httpOnly cookie.
//   2. Implement login()/signup() below to call those endpoints.
//   3. Wrap <App /> in an AuthProvider (React context) that tracks the
//      current user and exposes it the same way useMistakeStore.js exposes
//      the mistake data — then gate the "/app" routes behind it if you want
//      accounts to be required rather than optional.
//
// Popular options if you don't want to hand-roll it: Clerk, Auth0,
// Supabase Auth, or Firebase Auth all have React SDKs that drop in here
// with only a few lines of change to this file and Login.jsx.

export async function login({ email, password }) {
  throw new Error('login() is not implemented yet — see the comment at the top of authClient.js')
}

export async function signup({ email, password }) {
  throw new Error('signup() is not implemented yet — see the comment at the top of authClient.js')
}

export async function logout() {
  throw new Error('logout() is not implemented yet — see the comment at the top of authClient.js')
}
