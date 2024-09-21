import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
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

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        if (!userId) return null;

        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        console.log("accessToken ",accessToken);
        console.log("refreshToken ",refreshToken);
        return {accessToken, refreshToken};
        
    } catch (error) {

        console.log("Token generation is failed ", error);
        throw new ApiError(500, "Something went wrong while generating the tokens");
    }
}

const logInUser = asyncHandler( async (req, res) => {
    // get data from req
    // check the email or username is present
    // validate password
    // generate refersh and access tokens 
    // send the cookie

    const {username, email, password} = req.body;

    if ( !username && !email ){
        throw new ApiError(400, "Useranme or email is required");
    }
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    });

    if (!user){
        throw new ApiError(404,"User is not registered");
    }

    const isPasswordCorrect = user.isPasswordCorrect(password);

    if (!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user : loggedInUser, refreshToken, accessToken
        }, "User logged in successfully"
    )
    );
});


const logOutUser = asyncHandler( async (req, res) => {

    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken : 1
            }
        },
        {
            new : true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User Logged Out")
    );

});

const userRefreshToken = asyncHandler(async (req, res) => {
    // get the refresh token from req
    // check the token 
    // decode token
    // get user from token
    // validate saved token and incoming token
    // generate new acccessToken and refreshtoken

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if ( !incomingRefreshToken){
        throw new ApiError(401,"refreshToken is required");
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id);

    if (!user){
        throw new ApiError(401,"Invalid Refresh Token");
    }

    if (user.refreshToken !== incomingRefreshToken){
        throw new ApiError(401,"Refresh Token is expired or already used");
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken
            },
            "Access token refreshed"
        )
    );

});

const updateUserPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body

    if ( !oldPassword || !newPassword){
        throw new ApiError(400, "Old and new password are required");
    }

    const user = await User.findById(req.user?._id);
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    
    user.password = newPassword;
    user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password updated successfully")
    );

});

const getCurrentUser = asyncHandler ( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"Retrived current user successfully")
    );
});

const updateAccountDetails  = asyncHandler( async (req, res) => {
    const {fullName, email} = req.body;
    if ( !fullName || !email){
        throw new ApiError(400, "fullName and email are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"User info updated successfully")
    );


});
const extractPublicId = (url) => {
    // Split the URL by '/'
    const parts = url.split('/');
    // Find the 'upload' part of the URL
    const indexOfUpload = parts.indexOf('upload');
    if (indexOfUpload === -1) return null;
  
    // Extract the public ID part (all after 'upload/' and before the file extension)
    const publicIdWithExtension = parts.slice(indexOfUpload + 2).join('/'); // Skipping version number
    const publicId = publicIdWithExtension.split('.')[0]; // Remove extension
    return publicId;
  }
const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }



    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("avatar res: ", avatar);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
        
    }
        //TODO: delete old image - assignment
        deleteFromCloudinary(extractPublicId(req.user?.avatar));
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    );

});

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing");
    }


    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar");
        
    }

    
    //TODO: delete old image - assignment
    deleteFromCloudinary(extractPublicId(req.user?.coverImage));

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    );
});

const getUserChannelProfille = asyncHandler(async (req,res) => {

    const {username} = req.params;

    if (!username?.trim()){
        throw new ApiError(400,"Missing username");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                foreignField: "channel",
                localField: "_id",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                foreignField: "subscriber",
                localField: "_id",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSuscribed:{
                    $cond:{
                        if:{ $in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                username: 1,
                fullName: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSuscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }

    ]);

    if (!channel?.length){
        throw new ApiError(404,"Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    );

});

const getUserWatchHistory = asyncHandler( async (req, res) => {

    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                foreignField: "_id",
                localField: "watchHistory",
                as: "history",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Watch history fectched successfully")
    );

})

export {
    registerUser,
    logInUser,
    logOutUser,
    userRefreshToken,
    updateUserPassword,
    getCurrentUser,
    updateAccountDetails ,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfille,
    getUserWatchHistory
};