import { Router } from "express";
const router = Router();
import {
  logOut,
  loginUser,
  refreshAccessToken,
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
// verifyJWT is a middleware
router.route("/logOut").post(verifyJWT, logOut);



router.route("/refresh-token").post(refreshAccessToken)
export { router };

