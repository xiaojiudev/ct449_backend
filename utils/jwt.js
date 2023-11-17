const jwt = require("jsonwebtoken")

const createJWT = ({payload}) => {
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME })
  return token
}

// Verify the token
const isTokenValid = ({ token }) => jwt.verify(token, process.env.JWT_SECRET)

const attachCookiesToResponse = ({ res, user }) => {
  const token = createJWT({ payload: user })
  const oneDay = 1000 * 60 * 60 * 24
  //   res.cookie('name', value, [option]), option = httpOnly, expires
  res.cookie("token", token, {
    httpOnly: false,
    expires: new Date(Date.now() + oneDay),
    // secure: process.env.NODE_ENV === "production" ? true : false,
    secure: false,
    signed: true,
    sameSite: false,
  })
}

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
}
