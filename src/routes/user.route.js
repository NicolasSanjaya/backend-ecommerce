import { Router } from "express";
import {
  getUser,
  login,
  logout,
  register,
  test,
} from "../controller/user.controller.js";

const router = Router();

router.get("/user/test", test);
router.get("/users", getUser);
router.post("/user/login", login);
router.post("/user/register", register);
router.post("/user/logout", logout);

export default router;
