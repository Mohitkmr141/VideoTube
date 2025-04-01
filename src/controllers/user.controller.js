import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import { asyncHandlerPromise } from "../utils/asyncHandlerPromise.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation
  //  check is user already exists
  // check for images , check for avatar and coverImage
  // upload them to cloudinary
  // create user object -create Entry in db
  // remove password and refresh Token in response
  // return res

  const { email, password, fullName, username } = req.body;

  if (
    [email, password, fullName, username].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("avatarLocalPath", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Required");
  }

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage  File is Required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is Required");
  }
  if (!coverImage) {
    throw new ApiError(400, "coverImage is Required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user?._id).select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500 , 'something went wrong while creating user')
  }

  return res.status(201).json(

    200 , new ApiResponse(200 ,createdUser ,  "User created Successfully")
  )
});
export { registerUser };
