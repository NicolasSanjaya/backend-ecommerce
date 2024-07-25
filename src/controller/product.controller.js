export const getAllProducts = (req, res) => {
  return res.json({
    name: "Indomie",
    price: 3000,
  });
};

export const getProductById = (req, res) => {
  const { id } = req.params;
  return res.json({
    name: "Indomie 3",
    price: 9000,
  });
};

export const createProduct = (req, res) => {
  const { name, price } = req.body;
  return res.json({
    name,
    price,
  });
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

export const deleteProduct = (req, res) => {
  const { id } = req.params;
  return res.json({
    id,
  });
};
