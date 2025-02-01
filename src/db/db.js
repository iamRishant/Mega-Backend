import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB= async ()=>{
    try {
        const connectionObj=await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`Connected to DB !! DB host: ${connectionObj.connection.host}`);
        


        
    } catch (error) {
        console.log("Error connecting to Mongo: ",error);
        process.exit(1)// to stop node js
    }
}

export default connectDB;