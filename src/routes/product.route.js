import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controller/product.controller.js";
import multer from "multer";
import { imageValidation } from "../validation/imageValidation.js";
import { upload } from "../utils/uploadFile.js";
import { handleUploadCloudinary } from "../lib/cloudinary.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload/products");
  },
  filename: function (req, file, cb) {
    const type = file.mimetype.split("/")[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + type);
  },
});

const FILE_SIZE = 1000000; //1MB;

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
};

const router = Router();

router.get("/products", getAllProducts);
router.get("/product/:id", getProductById);
router.post(
  "/product",
  upload.single("image"),
  handleUploadCloudinary,
  createProduct
);
router.put(
  "/product/:id",
  upload.single("image"),
  handleUploadCloudinary,
  updateProduct
);
router.delete("/product", deleteProduct);

export default router;
