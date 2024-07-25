import jsonwebtoken from "jsonwebtoken";

const secret = process.env.JWT_SECRET_KEY;

export const generateToken = (payload) => {
  return jsonwebtoken.sign(payload, secret, {
    expiresIn: "2d",
  });
};

export const verifyToken = (token) => {
  return jsonwebtoken.verify(token, secret, {
    maxAge: "2d",
  });
};
