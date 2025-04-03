import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken'
import { asyncHandlerPromise } from "../utils/asyncHandlerPromise.js";
import { ApiError } from "../utils/ApiError.js";

const verifyJWT = asyncHandlerPromise(async(req , _ , next)=>{
 try {
     const token =  await req.cookies?.accessToken || req.header("Authorization")?.replace(" ")
   
     if(!token){
       throw new ApiError(401 , "Invalid Token")
     }
   
      const decodedToken =  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
   
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken ")
   
      if(!user){
       throw new ApiError(401 , "Invalid Access Token")
      }
   
      req.user = user
      next()
   
   
   
   
 } catch (error) {
    
    throw new ApiError(401 , error?.message  || "Invalid Access Token")
 }
})

export {verifyJWT}

