import dotenv from 'dotenv'
dotenv.config({
  path:"./.env"
})

import mongoose from 'mongoose'
import {DB_NAME} from '../constants.js'
const connectDB = async()=>{

  try{
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_NAME}`)

    console.log(conn.connection.host)
  }
  catch(error){
    console.log(`MongoDB connection Failed`, error)
    process.exit(1)

  }
}

export {connectDB}