import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { comparePassword } from "../validation/passwordValidation.js";
import { generateToken, refreshToken, verifyToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

// const oauth2Client = new OAuth2Client({
//   clientId: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   redirectUri: process.env.GOOGLE_REDIRECT_URI,
// });
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

export const test = async (req, res, next) => {
  const user = await prisma.user.findMany();
  return res.json({ user });
};

export const getUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
  if (!token) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Insert a Token",
    });
  }
  const user = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });
  try {
    const verified = verifyToken(token);
    if (verified) {
      if (user) {
        return res.status(200).json({
          status: true,
          statusCode: 200,
          message: "Success Get Users",
          data: verified,
        });
      } else {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          message: "User Not Found",
          data: {},
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Invalid Token",
        data: {},
      });
    }
  } catch (error) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Invalid Token",
      data: {},
    });
  }
  next();
};

export const updateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
  if (!token) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Insert a Token",
    });
  }
  const user = verifyToken(token);
  if (user) {
    const { name, email, phone, address } = req.body;
    const updateUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
        email,
        phone,
        address,
      },
    });
    if (updateUser) {
      delete updateUser.password;
      res.cookie("jwt", "", { maxAge: 0 });
      res.clearCookie("jwt");
      const refresh = refreshToken(updateUser);
      res.cookie("jwt", refresh, {
        httpOnly: true,
        maxAge: 2 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Success Update User",
        data: updateUser,
      });
    } else {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User Not Found",
        data: {},
      });
    }
  }
};

export const updateUserImage = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
  if (!token) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Insert a Token",
    });
  }
  const user = verifyToken(token);
  if (user) {
    const image = req.file.destination + "/" + req.file.filename;
    const updateUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        image,
      },
    });
    if (updateUser) {
      delete updateUser.password;
      res.cookie("jwt", "", { maxAge: 0 });
      res.clearCookie("jwt");
      const refresh = refreshToken(updateUser);
      res.cookie("jwt", refresh, {
        httpOnly: true,
        maxAge: 2 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Success Update User",
        data: updateUser,
      });
    } else {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User Not Found",
        data: {},
      });
    }
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      password: true,
    },
    where: {
      email: email,
    },
  });
  const result = comparePassword(password, user.password);
  if (result) {
    delete user.password;

    const token = generateToken(user);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Login Success",
      data: user,
    });
  } else {
    res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Login Failed",
      data: {},
    });
  }
};

export const loginWithGoogle = async (req, res, next) => {
  const { code } = req.query;
  console.log("Authorization Code:", code);

  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  if (!user) {
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        image: data.picture,
      },
    });

    delete newUser.password;
    const token = generateToken(newUser);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Login Success",
      data: newUser,
    });
  }
  if (user.image == null) {
    const updatedUser = await prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        image: data.picture,
      },
    });
    delete updatedUser.password;
    const token = generateToken(updatedUser);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Login Success",
      data: updatedUser,
    });
  }
  delete user.password;
  const token = generateToken(user);

  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 2 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Login Success",
    data: user,
  });
};

export const register = async (req, res, next) => {
  const { name, email, password, phone, address } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      phone: phone,
      address,
    },
  });
  if (user) {
    delete user.password;
    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Register Success",
      data: user,
    });
  } else {
    res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Register Failed",
    });
  }
};

export const logout = (req, res, next) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.clearCookie("jwt");
  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Logout Success",
    data: {},
  });
};

export const getCart = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
  if (!token) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Insert a Token",
    });
  }
  const user = verifyToken(token);
  if (user) {
    const cart = await prisma.cart.findMany({
      where: {
        userId: user.id,
      },
    });
    const product = await prisma.product.findMany({
      where: {
        id: {
          in: cart.map((item) => item.productId),
        },
      },
    });

    for (let i = 0; i < product.length; i++) {
      for (let j = 0; j < cart.length; j++) {
        if (product[i].id === cart[j].productId) {
          product[i].quantity = cart[j].quantity;
        }
      }
    }
    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Success Get Cart",
      data: product,
    });
  }
};

export const insertCart = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
  if (!token) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Insert a Token",
    });
  }
  const user = verifyToken(token);
  if (user) {
    const product = await prisma.product.findUnique({
      where: {
        id: req.body.product_id,
      },
    });

    if (parseInt(product.stock) < req.body.quantity) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Quantity Not Available",
      });
    }

    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
        productId: req.body.product_id,
        quantity: req.body.quantity,
      },
    });
    if (cart) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Success Insert Cart",
        data: cart,
      });
    }
  }
};
