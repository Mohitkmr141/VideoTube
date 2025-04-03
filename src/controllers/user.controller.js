import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { asyncHandlerPromise } from "../utils/asyncHandlerPromise.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: true,
    });

    return {accessToken , refreshToken}
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating both tokens"
    );
  }
};

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
  // let coverImageLocalPath;
  // if(req.files && Array.isArray(req.file.coverImage) && req.files.coverImage.length > 0){

  //   coverImageLocalPath = req.files?.coverImage[0].path
  // }

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

  const createdUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while creating user");
  }

  return res
    .status(201)
    .json(200, new ApiResponse(200, createdUser, "User created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
   Steps for logging
   get username or email and password from postman or frontend
   check validation for email or usernane
   check for user
   if user not exists return Api Error
  if user exists - validate password and generate new access and refresh token
  and final step to return cookie response with login information
  */

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "email or username required ");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  // check for password

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }


  // generating access Token and refresh Token

  const {accessToken, refreshToken } = await generateAccessAndRefreshToken(user?._id)

const  loggedInUser =  await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly:true,
    secure:true
  }
  return res.status(200)
  .cookie(accessToken , "accessToken" , options)
  .cookie(refreshToken , "refreshToken" , options)
  .json(
    new ApiResponse(200 , {
      user:loggedInUser , accessToken , refreshToken
    } , "user logged in successfully")
  )




});

const logOut = asyncHandler(async(req , res)=>{

  await User.findByIdAndUpdate(req.user?._id , {
    $set:{
        refreshToken:undefined
    }
  },{new:true})
  const options = {
    httpOnly:true,
    secure:true
  }
  return res.status(200)
  .clearCookie("accessToken" , options)
  .clearCookie("refreshToken" , options)
})

export { registerUser, loginUser , logOut };
