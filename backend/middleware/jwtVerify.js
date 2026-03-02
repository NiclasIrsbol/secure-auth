const jwt = require('jsonwebtoken')

function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendStatus(401)
  }

  const token = authHeader.slice('Bearer '.length)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403)
    req.user = decoded?.username
    next()
  })
}

module.exports = verifyJWT
