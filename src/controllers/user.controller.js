import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnClodinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req,res)=> {

   // take request 
   const {fullName, email, password, username} = req.body;

   console.log("email: ", email);
   console.log("fullName: ", fullName);
   console.log("password: ", password);
   console.log("username: ", username);

   if ([fullName, email, password, username].some(
    (field) => field?.trim() === ""
   )){
     throw new ApiError(400, "All fields are required");
   }
   
   const existedUser = await User.findOne(
    {
        $or: [{ email }, { username }]
    }
   );

   if (existedUser){
    throw new ApiError(409, "user is already exist with email or username");
   }
   console.log(req.files)
   let avatarLocalPath;
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
    avatarLocalPath = req.files.avatar[0].path;
   }
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
   }
   
   if (!avatarLocalPath){
    throw new ApiError(400,"Avatar image is required");
   }
   const avatar = await uploadOnClodinary(avatarLocalPath);
   const coverImage = await uploadOnClodinary(coverImageLocalPath);
   if (!avatar){
    throw new ApiError(500,"Avatar image upload is failed");
   }
   const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password

   });

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   );

   if (!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user");
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User register successfully")
   );

});

export {registerUser};