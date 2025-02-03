import mongoose, { mongo } from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema= mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true,//for searching process
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,// cloudinary url
        required:true,
    },
    coverImage:{
      type:String,// cloudinary url
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"Password is required"],
    },
    refreshToken:{
        type:String
    }



},{
    timestamps:true
})

// we dont want to save our password directly we want to saved hashed password
// so for that we will use bcrypt and just before saving in mongo db mongoose give us a middle ware with that we can make changes to our data just before saving

userSchema.pre("save",async function (next){
//note we will not use arrow fxn here coz uske paas this ka reference nhi hota hai (current context nhi milega)
// and async isiliye ki encryption  me time lgta hai

// check if password field is modified or not
if(this.isModified("password")){// isModified is provided by thik hook only
    this.password= await bcrypt.hash(this.password,10)//10 is number of rounds 
}
next(); 
})

// we also need to validate password so we will create custom method isPasswordCorrect

userSchema.methods.isPasswordCorrect= async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
}

// we will create token for user

userSchema.methods.generateAccessToken= function(){
    // we will generate token
    //first is payload
    //second is access token(we generate it)
    //third is expiry
    return jwt.sign({
        _id:this.id,
        email:this.email,
        username:this.username,
        fullName:this.fullname
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })

    // it will return the access token for current payload
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign({
        _id:this.id,
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}    

export const User=mongoose.model('User',userSchema);    
// export default User;