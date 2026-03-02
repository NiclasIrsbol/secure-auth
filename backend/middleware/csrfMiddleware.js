const TinyCSRF = require('tiny-csrf')
const crypto = require('crypto')

const rawSecret = process.env.CSRF_SECRET
if (!rawSecret) {
  throw new Error('CSRF_SECRET environment variable is missing')
}
if (rawSecret.length < 32) {
  throw new Error(`CSRF_SECRET must be at least 32 characters long (got ${rawSecret.length})`)
}

const csrfSecret32 =
  rawSecret.length === 32
    ? rawSecret
    : crypto.createHash('sha256').update(rawSecret, 'utf8').digest('hex').slice(0, 32)

const csrfMiddleware = TinyCSRF(csrfSecret32, ['POST', 'PUT', 'DELETE', 'PATCH'])

const csrfTokenRoute = (req, res) => {
  const csrfToken = req.csrfToken()
  return res.json({ csrfToken })
}

module.exports = { csrfMiddleware, csrfTokenRoute }