import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        comment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
        },
        tweet: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tweet"
        },
        video:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ,
        likedBy:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            }
    },
    {
        timestamps: true
    });

export const Like = mongoose.model("Like",likeSchema);