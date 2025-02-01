// require('dotenv').config({path:'./.env'});
import dotenv from 'dotenv'
dotenv.config()
import connectDB from "./db/db.js";
import {app} from './app.js'
// const app=require('./app.js')


//connectDB is a promise and it means we can write .then and .catch
connectDB().
then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log("Server listening on port " + process.env.PORT); 
    })
}).
catch((err)=>{
    console.log("MONGO ERROR: " + err);
    
})