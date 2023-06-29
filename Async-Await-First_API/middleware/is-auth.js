const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let authHeader = req.get("Authorization");
  //-----------------If i cant fetch the Autherization header from frontend------------------
  if (!authHeader) {
    const error = new Error("Not Authenticated");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  //---------------------Varify the Token------------------------------------
  try {
    decodedToken = jwt.verify(token, "MY_SECRET_TOKEN_GENERATED");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  //-----------------Check if it exist---------------------------------------
  if (!decodedToken) {
    const error = new Error("Not Authenticated");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
