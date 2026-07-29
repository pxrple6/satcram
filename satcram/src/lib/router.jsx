import React, { createContext, useContext, useEffect, useState } from 'react'

const RouterContext = createContext({ pathname: '/', search: '' })
const notify = () => window.dispatchEvent(new Event('satcram:navigate'))

export function BrowserRouter({ children }) {
  const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, search: window.location.search }))

  useEffect(() => {
    const update = () => setLocation({ pathname: window.location.pathname, search: window.location.search })
    window.addEventListener('popstate', update)
    window.addEventListener('satcram:navigate', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('satcram:navigate', update)
    }
  }, [])

  return <RouterContext.Provider value={location}>{children}</RouterContext.Provider>
}

export function Link({ to, href, onClick, children, ...props }) {
  const destination = to || href || '/'
  return (
    <a
      {...props}
      href={destination}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !destination.startsWith('/')) return
        event.preventDefault()
        window.history.pushState({}, '', destination)
        notify()
      }}
    >
      {children}
    </a>
  )
}

export function NavLink({ to, end = false, className, ...props }) {
  const { pathname } = useContext(RouterContext)
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  return <Link {...props} to={to} className={typeof className === 'function' ? className({ isActive }) : className} />
}

export function useLocation() {
  const { pathname, search } = useContext(RouterContext)
  return { pathname, search }
}

export function useSearchParams() {
  const { search } = useLocation()
  return [new URLSearchParams(search)]
}
