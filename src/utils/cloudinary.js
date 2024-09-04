import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

const date = new Date
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
         // check if localFilePath is null
        if (!localFilePath) return null;
        
        // upload the file to cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "chai-aur-code",
            public_id: date.toJSON(),  // set public filename to cloudinary
             
        })
        // file has been uploaded to cloudinary
        // console.log("File has been uploaded to cloudinary", 
        // response.url);
        // console.log(localFilePath)
        // console.log(response)
        fs.unlinkSync(localFilePath); //remove file from local server
        return response;

    } catch (error) {
        /** remove the locally saved temporary file 
         *  as upload got failed
        */ 
       console.log("Error:", error)
       fs.unlinkSync(localFilePath);
       return null;        
    }
}

export {uploadOnCloudinary}