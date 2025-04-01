import dotenv from 'dotenv'
dotenv.config({
  path:"./.env"
})

import mongoose from 'mongoose'

const connectDB = async()=>{

  try{
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}`)

    console.log(conn.connection.host)
  }
  catch(error){
    console.log(`MongoDB connection Failed`, error)
    process.exit(1)

  }
}

export {connectDB}