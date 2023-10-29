const { createJWT } = require("../utils/jwt")
const createTokenUser = (user) => {

  const payload = {
    name: user.name, 
    userId: user._id, 
    role: user.role,
  }

  // const userToken = createJWT({payload});

  return payload;

}

module.exports = createTokenUser
