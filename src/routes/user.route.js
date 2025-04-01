import { Router } from "express";
const router = Router();
import {
  logOut,
  loginUser,
  registerUser,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
// secured routes .
router.route("/logOut").post(verifyJWT, logOut);
export { router };
