import {User}   from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js'
import jwt from "jsonwebtoken"



const verifyJWT = asyncHandler(async(req,res,next)=>{

try {
    //  req and response dono me cookie hoga coz of cookie-parser
    // mobile me cookies nhi hoga
    // note res.send jab kar rhe the cookie tha par jab req se chahiye to cookies ho jaega
    // req side se cookies hua to thik( mobile me nhi milega) nhi to header me token mil jaega  like this Authorization: Bearer <token>
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");//we replaced the bearer with empty string to get token
        if(!token) throw new ApiError(401,"Unauthorized request")
            // agar token hai then jwt se puchna pdega ki sahi hai ya nhi token
        //we need to decode the token
        // token decode wohi kar paega jisko paas secret key hoga
        const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
        if(!user) throw new ApiError(401,"Invalid Access Token");
        
        req.user=user;
        next();
    } catch (error) {
    
    throw new ApiError(401,error?.message ||"Invalid Access Token");
    
}
});
export default verifyJWT;