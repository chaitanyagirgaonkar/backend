import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "Likes"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "Subscribers"
            }
        },
        {
            $group: {
                _id: null,
                TotalVideos: { $sum: 1 },
                TotalViews: { $sum: "$views" },
                TotalSubscribers: { $first: { $size: "$Subscribers" } },
                TotalLikes: { $first: { $size: "$Likes" } }
            }
        },
        {
            $project: {
                _id: 0,
                TotalSubscribers: 1,
                TotalLikes: 1,
                TotalVideos: 1,
                TotalViews: 1
            }
        }
    ])

    if (!channelStats) {
        throw new ApiError(404, "channel stats not found")
    }

    return res.status(200)
        .json(new ApiResponse(200, channelStats, "channel status fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const video = await Video.find({
        owner: req.user._id
    })

    if (!video) {
        throw new ApiError(404, "failed to find users videos")
    }

    return res.status(200)
        .json(new ApiResponse(200, video, "all videos fetched successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}