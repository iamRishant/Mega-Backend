import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
// middleware to accept
app.use(express.json({limit:"16kb"}));
// url se param aata hai usko decode krne ke liye coz alag alga jgh se alg type ka params
app.use(express.urlencoded({extended:true}));
// to access public assets folder name lega jo local me hai
app.use(express.static("public"))
//to do curd operation on cookies 
app.use(cookieParser());


// routes import
// we can use any name if we export default
import userRouter from './routes/user.routes.js'


// routes declaration
app.use("/api/v1/users",userRouter)

export {app};