import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { comparePassword } from "../validation/passwordValidation.js";
import { generateToken, verifyToken } from "../utils/jwt.js";

export const test = async (req, res, next) => {
  const user = await prisma.user.findMany();
  return res.json({ user });
};

export const getUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
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
          data: user,
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
    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Login Success",
      data: user,
      token,
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

export const register = async (req, res, next) => {
  console.log(req.body);
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
      data: {},
    });
  }
};
