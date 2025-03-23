import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import {app} from './app.js'
import { connectDB } from "./db/index.js";
connectDB()

.then(()=>{
  app.on('dbConnected', () => {
    console.log('Custom dbConnected event fired!');
});

  app.on('dbError', (err) => {
    console.log('Handling error event:', err);
});

  app.listen(process.env.PORT , ()=>{
    console.log(`Server is at http://localhost:${process.env.PORT}`)
  })
})


.catch((error)=>{
  console.log(`MongoDB connection Failed` , error)
  process.exit(1)
})
