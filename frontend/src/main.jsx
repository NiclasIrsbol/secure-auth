import {StrictMode} from 'react'
import { createRoot } from 'react-dom/client'
import Login from './login.jsx'
import Signup from './signup.jsx'
import Homepage from './homepage.jsx'
import RequireAuth from './RequireAuth.jsx'
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login></Login>}></Route>
      <Route path="/signup" element={<Signup></Signup>}></Route>
      <Route path="/homepage" element={<RequireAuth><Homepage></Homepage></RequireAuth>}></Route>
    </Routes>
    </BrowserRouter>
  </StrictMode>,
)
