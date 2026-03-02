import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Homepage() {
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('http://localhost:3000/me', {
          credentials: 'include',
        })

        if (res.status === 401 || res.status === 403) {
          navigate('/login', { replace: true })
          return
        }

        if (res.ok) {
          const data = await res.json()
          setUsername(data?.username || '')
        }
      } catch {
        navigate('/login', { replace: true })
      }
    })()
  }, [navigate])

  async function logout() {
    try {
      const csrfRes = await fetch('http://localhost:3000/csrf-token', {
        credentials: 'include',
      })
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData?.csrfToken

      await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _csrf: csrfToken }),
      })
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="screen">
      <h1>Welcome {username}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default Homepage