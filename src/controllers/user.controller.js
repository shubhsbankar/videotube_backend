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
   
   const existedUser = User.findOne(
    {
        $or: [{ email }, { username }]
    }
   );

   if (existedUser){
    throw ApiError(409, "user is already exist with email or username");
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0].path

   if (!avatarLocalPath){
    throw ApiError(400,"Avatar image is required");
   }
   const avatar = await uploadOnClodinary(avatarLocalPath);
   const coverImage = await uploadOnClodinary(coverImageLocalPath);
   if (!avatar){
    throw ApiError(500,"Avatar image is upload failed");
   }
   const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowercase()

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