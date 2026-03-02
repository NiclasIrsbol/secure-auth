const jwt = require('jsonwebtoken')

function cookieAccessVerify(req, res, next) {
  const token = req.cookies?.accessToken
  if (!token) {
    return res.sendStatus(401)
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403)
    req.user = decoded?.username
    next()
  })
}

module.exports = cookieAccessVerify