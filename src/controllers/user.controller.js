import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { asyncHandlerPromise } from "../utils/asyncHandlerPromise.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: true,
    });

    return { accessToken, refreshToken };
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

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user?._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie(accessToken, "accessToken", options)
    .cookie(refreshToken, "refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options);
});

const refreshAccessToken = asyncHandlerPromise(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthotized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user.id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid access Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "Password not match");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }
  user.password = newPassword;
  user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched SuccessFully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  if (
    [fullName, email, username].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All field are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName: fullName, email: email, username: username },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updayed Successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error While uploading  avatar");
  }

 const newAvatar =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true }
  ).select("-password");


  return res.status(200)
  .json(new ApiResponse(200 ,newAvatar , "Avatar file change successFully" ))
});



const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;
  if (!CoverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is required");
  }

  const CoverImage = uploadOnCloudinary(CoverImageLocalPath);

  if (!CoverImage.url) {
    throw new ApiError(400, "Error While uploading  Cover Image");
  }

 const newCoverImage =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { CoverImage: CoverImage.url },
    },
    { new: true }
  ).select("-password");


  return res.status(200)
  .json(new ApiResponse(200 ,newCoverImage , "Cover Image  change successFully" ))
});

const getUserChannelDetails = asyncHandler(async(req , res)=>{

  const {username} = req?.params
  
  if(!username?.trim()){
    throw new ApiError(400 , "username is missing")
  }

 const channel = await User.aggregate(
   
   [

     {
      $match:{
        username:username?.toLowerCase()
      }
     },{
      $lookup:{
        from:"subscriptions",
        localField: "_id",
        foreignField:"channel",
        as:"subscribers"

      }
     } ,{
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
     },{
      $addFields:{
        subscriberCount:{
          $size:"$subscribers"
        },
        channelSubscribedToCount:{
          $size:"$subscribedTo"
        }
        ,isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id , "$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
     },{
      $project:{
        fullName:1 , email:1 , username:1 , avatar:1 , subscriberCount:1  , isSubscribed:1 , channelSubscribedToCount:1
      }
     }

    ]
  )

  if(!channel?.length){
    throw new ApiError(404 , "Channel does not exists")
  }
  console.log(channel , "After the Aggregation")
  

  return res
  .status(200)
  .json(
    new ApiResponse(200 , channel[0] , "User channel fetched successfully")
  )

})


export {
  registerUser,
  loginUser,
  logOut,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,updateUserCoverImage,
  getUserChannelDetails
};
