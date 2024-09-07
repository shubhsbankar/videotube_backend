import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary= async ( localFilePath) => {
    try {
        console.log("File to upload on clodinary : ",localFilePath);
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
               resource_type: "auto"
            }
        );
        console.log("File is uploaded on cloudinary successfully : ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error){
        console.log("Failed to upload on cloudinary : ", error);
        fs.unlinkSync(localFilePath);
        return null;
    }

}

const deleteFromCloudinary = async(publicId) => {
    try {
        console.log("publicId is :", publicId);
        if (!publicId) return null;
        return await cloudinary.uploader.destroy(publicId, function (err, res) {
            if (err) {
                console.log("Failed to delete file on cloudinary : ", err);
              }
        });

        
    } catch (error) {
        console.log("Failed to delete file on cloudinary : ", error);
        throw ApiError(500,error?.message || "Failed to delete file on cloudinary");
    }

}

export { uploadOnCloudinary,
    deleteFromCloudinary
 };