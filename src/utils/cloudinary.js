import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary= async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        // file has been uploaded successfully
        console.log("File uploaded successfully on cloudinary :",response.url);
        return response;
        
        
    } catch (error) {
        //agar file upload nhi hua then we have to unlink or delete from it our local server (locallly saved temporary file)    
        fs.unlinkSync(localFilePath);
        console.log("Error while uploading file on cloudinary :",error);
        return null;
        
    }
}
export {uploadOnCloudinary};
