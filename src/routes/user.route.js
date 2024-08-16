import { Router } from "express";
import {
  authUrl,
  getCart,
  getUser,
  insertCart,
  login,
  loginWithGoogle,
  logout,
  register,
  test,
  updateUser,
  updateUserImage,
} from "../controller/user.controller.js";
import multer from "multer";
import { imageValidation } from "../validation/imageValidation.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload/user");
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

// user
router.get("/user/test", test);
router.get("/user", getUser);
router.put("/user", updateUser);
router.put(
  "/user-image",
  multer({
    storage: storage,
    limits: { fileSize: FILE_SIZE },
    fileFilter,
  }).single("image"),
  imageValidation,
  updateUserImage
);
router.post("/user/login", login);

// login with google
router.get("/auth/google", (req, res) => {
  res.redirect(authUrl);
});
router.get("/auth/google/callback", loginWithGoogle);

router.post("/user/register", register);
router.post("/user/logout", logout);

// cart
router.get("/cart", getCart);
router.put("/cart", insertCart);

export default router;
