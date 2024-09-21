import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    console.log("page",page);
    console.log("limit",limit);
    console.log("query",query);
    console.log("sortBy",sortBy);
    console.log("sortType",sortType);
    console.log("userId",userId);
    console.log("getAllVideos");
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    let filter = {};
    if (query){
        filter = { title: { $regex: query, $options: "i"}};
    }
     if (userId){
        filter._id = userId;
     }
     const sortOption = {};
    sortOption[sortBy] = sortType === "asc" ? 1: -1;
    try {
    const videos = await Video
    .find(filter)
    .sort(sortOption)
    .skip((pageNumber -1) * limitNumber)
    .limit(limitNumber);
    }
    catch(error){

    }
    return res.status(200).json(new ApiResponse(200,{},"Got all videos"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}