import { useState } from "react"
import { useNavigate } from "react-router-dom"

import './signup.css'

function signup() {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmpassword, setConfirmPassword] = useState('')  
  
    const navigate = useNavigate()

    function gotoLogin() {
        navigate("/login")
    }

    function validatePasswordLength(minLength) {
      return password.length>=minLength
    }

    async function submit() {
    const minLength = 6

    if (validatePasswordLength(minLength)) {
        try {
          const csrfRes = await fetch('http://localhost:3000/csrf-token', {
            credentials: 'include',
          })
          const csrfData = await csrfRes.json()
          const csrfToken = csrfData?.csrfToken

          const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username.trim(),
              password: password.trim(),
              confirmpassword: confirmpassword.trim(),
              _csrf: csrfToken,
            })
          })

          const data = await response.json()
          if (response.ok) {
            navigate('/homepage', {
              state: { username: username }
            })
          }
        } catch (e) {
          console.error(e)
        }
  } else {
    alert("Please enter a password with more than " + minLength + " characters")
  }
  }

    return(
    <div className='screen'>
      <div className='form'>
      <h1>Signup</h1>
      <input id="username" type='text' value={username} placeholder='Enter username' onChange={(e) => setUsername(e.target.value)}></input>
      <input id="password" type="password" value={password} placeholder='Enter password' onChange={(e) => setPassword(e.target.value)}></input>
      <input id="confirmpassword" type="password" value={confirmpassword} placeholder='Confirm password' onChange={(e) => setConfirmPassword(e.target.value)}></input>
      <button id="btn" onClick={submit}>Signup</button>
      <button id="login" onClick={gotoLogin}>Already a user? Login</button>
      </div>
    </div>
    )
}

export default signup