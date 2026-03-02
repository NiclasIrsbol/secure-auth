import {useState} from 'react'
import { useNavigate } from 'react-router-dom'

import './login.css'

function login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  const navigate = useNavigate()

  function goToSignup() {
    navigate('/signup')
  }

  function submit() {
    (async () => {
      try {
        const csrfRes = await fetch('http://localhost:3000/csrf-token', {
          credentials: 'include',
        })
        const csrfData = await csrfRes.json()
        const csrfToken = csrfData?.csrfToken

        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            _csrf: csrfToken,
          })
        })

        if (response.ok) {
          navigate('/homepage', {
            state: { username: username }
          })
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }

  return (
    <div className='screen'>
      <div className='form'>
      <h1>Login</h1>
      <input id="username" type='text' value={username} placeholder='Enter username' onChange={(e) => setUsername(e.target.value)}></input>
      <input id="password" type="password" value={password} placeholder='Enter password' onChange={(e) => setPassword(e.target.value)}></input>
      <button id="btn" onClick={submit}>Submit</button>
      <button id="signup" onClick={goToSignup}>Not a user? Signup</button>
      </div>
    </div>
  )
}

export default login