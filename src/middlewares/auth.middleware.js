import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandlerPromise } from "../utils/asyncHandlerPromise.js";
import { ApiError } from "../utils/ApiError.js";

const verifyJWT = asyncHandlerPromise(async (req, _, next) => {
  try {
    console.log("Token:", req.headers.authorization);
    const token =
      await req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log("Initial Token ", token);
    if (!token) {
      throw new ApiError(401, "Invalid Token");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log(decodedToken);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken "
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

export { verifyJWT };
