import { deleteImageCloudinary } from "../lib/cloudinary.js";
import { prisma } from "../utils/prisma.js";

export const getAllProducts = async (req, res) => {
  try {
    const data = await prisma.product.findMany();
    return res.json({
      status: true,
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.json({
      status: false,
      statusCode: 400,
      message: "Id is required",
    });
  try {
    const data = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    return res.json({
      status: true,
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  const { name, price, stock } = req.body;

  if (!name || !price || !stock) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: "Name, Price, Stock is required",
    });
  }

  try {
    const data = await prisma.product.create({
      data: {
        name,
        price,
        stock,
        image: res.data.secure_url,
      },
    });
    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Success Create Data",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  let { name, price, stock } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });
    if (!name || !price || !stock) {
      name = product.name;
      price = product.price;
      stock = product.stock;
    }

    if (res.changeImage === true) {
      const image = product.image;
      const imageDelete = image
        .split("/")
        [image.split("/").length - 1].split(".")[0];
      const deleteResult = await deleteImageCloudinary(
        `ecommerce/${imageDelete}`
      );

      const data = await prisma.product.update({
        where: {
          id,
        },
        data: {
          name,
          price,
          stock,
          image: res.data.secure_url,
        },
      });
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Success Update Data",
        data: data,
      });
    }
    const data = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name,
        price,
        stock,
      },
    });
    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Success Update Data",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.query;
  try {
    // delete image
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    const image = product.image;
    const imageDelete = image
      .split("/")
      [image.split("/").length - 1].split(".")[0];

    const deleteResult = await deleteImageCloudinary(
      `ecommerce/${imageDelete}`
    );

    // delete data
    const data = await prisma.product.delete({
      where: {
        id,
      },
    });
    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Success Delete Data",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: error.message,
    });
  }
};
