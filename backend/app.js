const connection = require('./db.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const helmet = require('helmet');
require('dotenv').config();
const {csrfMiddleware, csrfTokenRoute} = require('./middleware/csrfMiddleware.js')
const cookieAccessVerify = require('./middleware/cookieAccessVerify.js')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express()
const port = 3000

const { requireAuth } = require("./middleware/requireAuth.js") 

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.CSRF_SECRET

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
)

const limiter = rateLimit({
  windowMs: 15*60*1000, // 15-minute window
  max: 100 // Max 100 requests in 15 minuttes
})

app.use(express.json())
app.use(cookieParser(COOKIE_SECRET))
app.use(limiter)
app.use(csrfMiddleware);
app.use(helmet());

function signAccessToken(username) {
  return jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}

function signRefreshToken(username) {
  return jwt.sign({ username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' })
}

function getRefreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  }
}

function getAccessCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  }
}

app.get('/csrf-token', csrfTokenRoute);

app.post('/signup', limiter, async (req, res) => {
  const username = (req.body.username || '').trim()
  const password = req.body.password || ''
  const confirmpassword = req.body.confirmpassword || ''

  if (!username || !password) {
    return res.status(401).json({ error: 'Please enter a valid username and password' })
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ error: 'Password and confirmpassword must be identical' })
  }

  try {
    const uniquecheck = 'SELECT 1 FROM user_table WHERE name = $1'
    const uniqueResult = await connection.query(uniquecheck, [username])
    if (uniqueResult.rowCount > 0) {
      return res.status(409).json({ message: 'Invalid username' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const insert = 'INSERT INTO user_table (name, password) VALUES ($1, $2)'
    await connection.query(insert, [username, passwordHash])
    return res.status(201).json({ message: `New user with username ${username} has been created` })
  } catch (error) {
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/login', limiter, async (req, res) => {
  const username = (req.body.username).trim()
  const password = (req.body.password).trim()

  if (!username || !password) {
    return res.status(401).json({ error: 'Please enter a valid username and password' })
  }

  try {
    const sqlString = 'SELECT password FROM user_table WHERE name = $1'
    const result = await connection.query(sqlString, [username])

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const hashedPassword = result.rows[0].password
    const isValid = await bcrypt.compare(password, hashedPassword)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const accessToken = signAccessToken(username)
    const refreshToken = signRefreshToken(username)

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
    const updateRefresh = 'UPDATE user_table SET refreshtoken = $1 WHERE name = $2'
    await connection.query(updateRefresh, [hashedRefreshToken, username])

    res.cookie('accessToken', accessToken, getAccessCookieOptions())
    res.cookie('jwt', refreshToken, getRefreshCookieOptions())
    return res.status(200).json({ username })
  } catch (error) {
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.jwt
  if (!refreshToken) return res.sendStatus(401)

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403)

    const username = decoded?.username
    if (!username) return res.sendStatus(403)

    try {
      const findUserSql = 'SELECT refreshtoken FROM user_table WHERE name = $1'
      const userResult = await connection.query(findUserSql, [username])
      if (!userResult.rowCount) return res.sendStatus(403)

      const storedHash = userResult.rows[0]?.refreshtoken
      if (!storedHash) return res.sendStatus(403)

      const match = await bcrypt.compare(refreshToken, storedHash)
      if (!match) return res.sendStatus(403)

      const newAccessToken = signAccessToken(username)
      const newRefreshToken = signRefreshToken(username)

      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10)
      const updateRefreshSql = 'UPDATE user_table SET refreshtoken = $1 WHERE name = $2'
      await connection.query(updateRefreshSql, [hashedRefreshToken, username])

      res.cookie('accessToken', newAccessToken, getAccessCookieOptions())
      res.cookie('jwt', newRefreshToken, getRefreshCookieOptions())
      return res.status(200).json({ username })
    } catch (error) {
      return res.status(500).json({ error: 'Server error' })
    }
  })
})

app.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.jwt
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
      const username = decoded?.username
      if (username) {
        const clearSql = 'UPDATE user_table SET refreshtoken = NULL WHERE name = $1'
        await connection.query(clearSql, [username])
      }
    } catch {
      console.log("An error has occurred")
    }
  }

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  })

  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  })

  return res.sendStatus(204)
})

app.get('/me', cookieAccessVerify, requireAuth, (req, res) => {
  return res.status(200).json({ username: req.user })
})

app.listen(port, () => {
    console.log("Server is listening on",port)
})