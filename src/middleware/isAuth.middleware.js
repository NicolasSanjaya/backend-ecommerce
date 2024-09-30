import { verifyToken } from "../utils/jwt.js";

export const isAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
  if (!token) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Insert a Token",
    });
  }
  const verified = verifyToken(token);
  if (verified) {
    res.verified = verified;
    next();
  } else {
    res.status(401).json({
      status: false,
      statusCode: 401,
      message: "Unauthorized",
    });
  }
};
