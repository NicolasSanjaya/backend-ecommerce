import { Router } from "express";
import {
  addUserAddress,
  authUrl,
  deleteUserAddress,
  getCart,
  getUser,
  getUserAddress,
  insertCart,
  login,
  loginWithGoogle,
  logout,
  register,
  test,
  updateUser,
  updateUserAddressIsMain,
  updateUserImage,
} from "../controller/user.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";
import { upload } from "../utils/uploadFile.js";
import { handleUploadCloudinary } from "../lib/cloudinary.js";

const router = Router();

// user
router.get("/user/test", test);
router.get("/user", isAuth, getUser);
router.put("/user", isAuth, updateUser);
router.put(
  "/user-image",
  isAuth,
  upload.single("image"),
  handleUploadCloudinary,
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

// address
router.get("/user-address", isAuth, getUserAddress);
router.put("/user-address", isAuth, addUserAddress);
router.delete("/user-address", isAuth, deleteUserAddress);
router.patch("/user-address-ismain", isAuth, updateUserAddressIsMain);

// cart
router.get("/cart", getCart);
router.put("/cart", insertCart);

export default router;
