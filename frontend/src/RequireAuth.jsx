import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function RequireAuth({ children }) {
  const location = useLocation()
  const [status, setStatus] = useState('loading') // loading | authed | unauthed

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('http://localhost:3000/me', {
          credentials: 'include',
        })
        if (cancelled) return

        if (res.ok) setStatus('authed')
        else setStatus('unauthed')
      } catch {
        if (!cancelled) setStatus('unauthed')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') return null

  if (status === 'unauthed') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
