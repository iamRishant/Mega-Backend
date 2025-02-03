import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from "../utils/ApiResponse.js"

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

export {registerUser};