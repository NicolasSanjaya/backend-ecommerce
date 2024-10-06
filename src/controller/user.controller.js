import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { comparePassword } from "../validation/passwordValidation.js";
import { generateToken, refreshToken } from "../utils/jwt.js";
import { google } from "googleapis";
import { deleteImageCloudinary } from "../lib/cloudinary.js";

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
  const user = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      type: true,
      address: true,
    },
  });
  // const address = await prisma.address.findMany({
  //   where: { id: user.addressId },
  // });
  // console.log(address.length);

  // for (let i = 0; i < user.length; i++) {
  //   for (let j = 0; j < address.length; j++) {
  //     console.log(address[j]);

  //     if (user[i].id === address[j].user[i].id) {
  //       user[i].address = address[j];
  //     }
  //   }
  // }
  // user.address = address;
  return res.json({ user });
};

export const getUser = async (req, res, next) => {
  const { verified } = res;

  try {
    const user = await prisma.user.findUnique({
      where: { email: verified.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        type: true,
        address: true,
      },
    });
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
  } catch (error) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Invalid Token",
      data: {},
    });
  }
};

export const updateUser = async (req, res, next) => {
  const { verified } = res;
  if (verified) {
    const { name, email, phone } = req.body;
    const updateUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
        email,
        phone,
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
        sameSite: "none",
        secure: true,
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
  const { verified } = res;
  if (verified) {
    const image = verified.image;
    const imageDelete = image
      .split("/")
      [image.split("/").length - 1].split(".")[0];

    const deleteResult = await deleteImageCloudinary(
      `ecommerce/${imageDelete}`
    );

    const updateUser = await prisma.user.update({
      where: {
        id: verified.id,
      },
      data: {
        image: res.data.secure_url,
        type: null,
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
        sameSite: "none",
        secure: true,
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
      image: true,
      phone: true,
      address: true,
      password: true,
      type: true,
    },
    where: {
      email: email,
    },
  });

  if (user.type && user.type === "google") {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Login Failed, Please Login with Google",
      data: {},
    });
  }
  const result = comparePassword(password, user.password);
  if (result) {
    delete user.password;

    const token = generateToken(user);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Login Success",
      data: user,
    });
  } else {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Login Failed",
      data: {},
    });
  }
};

export const loginWithGoogle = async (req, res, next) => {
  const { code } = req.query;

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
        type: "google",
      },
    });

    delete newUser.password;
    const token = generateToken(newUser);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    return res.redirect(process.env.FRONTEND_URL);
  }
  if (user.image === null) {
    const updatedUser = await prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        image: data.picture,
        type: "google",
      },
    });
    delete updatedUser.password;
    const token = generateToken(updatedUser);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    return res.redirect(process.env.FRONTEND_URL);
  }
  delete user.password;
  const token = generateToken(user);

  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 2 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
  });
  return res.redirect(process.env.FRONTEND_URL);
};

export const getUserAddress = async (req, res, next) => {
  const { verified } = res;

  const user = await prisma.user.findUnique({
    where: {
      id: verified.id,
    },
    include: {
      address: true,
    },
  });

  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Get Address Success",
    data: user.address,
  });
};

export const addUserAddress = async (req, res, next) => {
  const { verified } = res;

  const { recipient, phone, address } = req.body;
  const updatedUser = await prisma.user.update({
    where: {
      id: verified.id,
    },
    data: {
      address: {
        create: {
          recipient,
          phone,
          address,
        },
      },
    },
    include: {
      address: true,
    },
  });

  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Update Address Success",
    data: updatedUser.address,
  });
};
export const updateUserAddressIsMain = async (req, res, next) => {
  const { verified } = res;

  const { id } = req.query;
  const updatedUserFalse = await prisma.address.updateMany({
    data: {
      isMain: false,
    },
  });

  const updatedUserTrue = await prisma.address.update({
    where: {
      id: id,
    },
    data: {
      isMain: true,
    },
  });

  const updatedUser = await prisma.address.findMany();

  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Update Address Success",
    data: updatedUser,
  });
};

export const deleteUserAddress = async (req, res, next) => {
  const { verified } = res;
  const { id } = req.query;

  const updatedAddress = await prisma.address.delete({
    where: {
      id: id,
    },
    include: {
      User: true,
    },
  });

  if (!updatedAddress) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Delete Address Failed",
    });
  }

  const updatedUser = await prisma.user.findMany();

  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Delete Address Success",
    data: updatedAddress,
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
  // res.cookie("jwt", "", { maxAge: 0 });
  res.clearCookie("jwt", {
    sameSite: "none",
    secure: true,
    path: "/",
    httpOnly: true,
  });
  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Logout Success",
    data: {},
  });
};

export const getCart = async (req, res, next) => {
  const { verified } = res;
  if (verified) {
    const cart = await prisma.cart.findMany({
      where: {
        userId: verified.id,
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
  const { verified } = res;
  if (verified) {
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
