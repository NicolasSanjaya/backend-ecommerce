import { prisma } from "../utils/prisma.js";

export const getAllProducts = async (req, res) => {
  const data = await prisma.product.findMany();
  return res.json({
    status: true,
    statusCode: 200,
    data: data,
  });
};

export const getProductById = (req, res) => {
  const { id } = req.params;
  return res.json({
    name: "Indomie 3",
    price: 9000,
  });
};

export const createProduct = async (req, res) => {
  const { name, price, stock } = req.body;
  const image = req.file.destination + "/" + req.file.filename;
  const data = await prisma.product.create({
    data: {
      name,
      price,
      stock,
      image,
    },
  });
  res.status(200).json(data);
};

export const updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  return res.json({
    id,
    name,
    price,
  });
};

export const deleteProduct = async (req, res) => {
  const { id } = req.query;
  const data = await prisma.product.delete({
    where: {
      id,
    },
  });
  console.log(data);
  res.status(200).json({
    status: true,
    statusCode: 200,
    message: "Success Delete Data",
  });
};
