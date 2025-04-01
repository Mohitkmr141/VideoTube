import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()

app.use(express.json({
    limit:"100kb"
}))

app.use(express.urlencoded({
    extended:true,
    limit:"100kb"

}))
app.use(cors({
    origin:process.env.CORS_ORIGIN, 
    credentials:true
    
}))

app.use(cookieParser())
app.use(express.static("public"))

import { router } from './routes/user.route.js'
app.use("/api/v1/user" , router)

export {app}