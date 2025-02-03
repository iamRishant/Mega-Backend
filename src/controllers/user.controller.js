import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"



const generateAccessAndRefreshToken= async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken =await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        // tokens to generate hogya now we want to save refresh token in database
        //we have out user object we can simply update it and save it in monogdb
        // but kyuki jab yha  save kar rhe hai so we dont need validation ki password hai ya nhi wo sb 
        //so we will use validateBeforeSave =false; 
        user.refreshToken=refreshToken;//updating
        await user.save({validateBeforeSave:false});//mongodb method 

        return {accessToken,refreshToken};
        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access token")
    }
}



const registerUser=asyncHandler(async (req,res)=>{
    // get user  details from frontend
    // validation -non empty
    //check if user already exists: both username and password
    //check for images
    //check for avatar
    //upload to cloudinary then get the url
    //create user object
    //then create entry in db after creation it will return the saved object as response
    //remove password and refresh token from response 
    //check for user creation then return response

    const {email,username,password,fullname} = req.body;
    // checking empty fields like a pro
    if(
        [email,username,password,fullname].some((field)=>  field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");
    }


    // we will check if username or email exist or not
    // to find one we can simply check User.findOne({username})
    const existedUser=await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser) throw new ApiError(409,"User with username or email already exist");

    //kyuki multer use kiye hai middleware me to req.body ki trh sara file req.files me hoga 

    const avatarLocalPath=req.files?.avatar[0]?.path//ye yha se hmko file path mil jaega kyuki hm aise hi save kiye hai later cloudinary me help krega save krne me 
    //try to console.log(req.files)
    // const coverImageLocalPath=req.files?.coverImage[0]?.path
    // since coverImage is not mandatory there may be chances of undefined there fore

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) throw new ApiError(400,"Avatar file is required");

    // now upload to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    

    if(!avatar) throw new ApiError(400,"Avatar file is required");

    // now create object and put in database
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username:username.toLowerCase(),
        password
    })
    // now here we want to check if user is there is user is there then we need to remove password and refreshtoken 
    // we can do both things manually or we can use a trick mongo db adds _id in each doc by itself 
    const createdUser=await User.findOne(user._id).select(
        //now here we will give that paramerter which we dont want from this user
        "-password -refreshToken"
    )

    if(!createdUser) throw new ApiError(500,"Something went wrong while registering the user");

    // we can already sent .json({createdUser})
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )

    
    
    
})

const logInUser=asyncHandler(async(req,res)=>{
    //data nikalo req.body
    //validate kro data ko(empty hai ya nhi)
    //find the user by username or email
    //password check
    //access and refresh token generate 
    //send secure cookies 
    //and send response that user logged in

    const {email,username,password}=req.body;
    if(!(username || email)) throw new ApiError(400,"Username or Email is required");

    //it will return a user which will find a user based on username or email
    const user=await User.findOne({
        $or:[{email},{username}],
    })
    if(!user) throw new ApiError(404,"User does not exist");
    // since we created a custorm method in User in User model to check password we can use that

    // we will not use User(capital U) coz this is mongoose isme humara custom wala method nhi hoga
    //humara custom method jab database se response aaega n wo user me hoga(line 97)

    const validatePassword= await user.isPasswordCorrect(password);
    if(!validatePassword) throw new ApiError(401,"Invalid Password");

    //we will generate access token and refresh token
    //we created a custom fxn for this above

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id);
    // since user update hua hai access token save kiye hai then we need user object again
    const loggedInUser=await User.findOne(user._id).select(
        "-password -refreshToken"
    );
    // ab loggedin user me sb hoga par passwrd and refresh token nhi hoga kyuki wo hm select krke remove kar diye hai   
    // now we will send cookies
    const options={
        httpOnly:true,//it wont allow anyone from front end to modify the cookie only server can modify
        secure:true,
    }
    // we can send cookie using res.cookie
    // note this cookie is coming from middle ware cookie-parser
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResponse(
        200,
        {
            user:loggedInUser,
            accessToken,refreshToken
            //we are sending access and refresh as data coz storing in local database
        },
        "User Logged In Successfully"
    ))
    
})

const logOutUser=asyncHandler(async(req,res)=>{
    //clear cookies
    //remove refresh token from database
    //send response that user logged out

    // we dont have access to userId how we will logout then 
    //we need middleware

    await User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },
    {new:true})
    const options={
        httpOnly:true,//it wont allow anyone from front end to modify the cookie only server can modify
        secure:true,
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User Logged Out Successfully"))
    
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    //this is for refreshing token
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken) throw new Error(401,"unauthorized request ");

    // now we need to verify incoming token 
   try {
     const decodedToken=await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
     const user=User.findById(decodedToken?._id);
 
     if(!user) throw new Error(401,"Invalid refresh token")
 
         // now we have to match incoming token and token present in the database
         if(incomingRefreshToken!==user?.refreshToken){
             throw new Error(401,"Refresh token in invalid or used");
         }
         // agar match kar gyaa then generate new access token and return the user
         const options={
             https:true,
             secure:true
         }
         const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id); 
 
         return res.status(200).cookie("accessToken",accessToken).cookie("refreshToken",newRefreshToken).json(new ApiResponse(200,
             {
                 accessToken,refreshToken:newRefreshToken
             },"Access Token Refreshed"));
   } catch (error) {
    throw new Error(401,error?.message || "Invalid refresh token");
    
   }
    
})

export {registerUser,logInUser,logOutUser,refreshAccessToken};