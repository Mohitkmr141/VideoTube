import dotenv from 'dotenv'
dotenv.config({
    path:"./.env"
})
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const uploadOnCloudinary = async(localFilePath)=>{
    try{
        if(!localFilePath){
            return null;
        }
        const  response = await cloudinary.uploader.upload(localFilePath , {
            resource_type:'auto'
        })
        // file has been uplaoded successfully .
         
        console.log(response.url , response.original_filename)
        return response;
    }
    catch(error){

        // remove the locally saved temporary file as the operation got failed
        fs.unlinkSync(localFilePath) 

    }
  }


  export {uploadOnCloudinary}