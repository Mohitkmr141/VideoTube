import { Router } from "express";
const router = Router();
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelDetails,
  getUserWatchHistory,
  logOut,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
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

router.route("/refresh-token").post(refreshAccessToken);

// change Password

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-account").post(verifyJWT, updateAccountDetails);

router
  .route("change-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/cover-image")
  .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelDetails);

router.route("/watchHistory").get(verifyJWT, getUserWatchHistory);
export { router };
