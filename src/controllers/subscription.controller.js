import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "channel ID is not valid")
    }

    const itHasSubscribe = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })
    let unsubscribe;
    let subscribe;
    if (itHasSubscribe) {
        unsubscribe = await Subscription.findOneAndDelete(
            {
                subscriber: req.user._id,
                channel: channelId
            }
        )
        if (!unsubscribe) {
            throw new ApiError(500, "something went wrong while unsubscribe the channel")
        }
        return res
            .status(200)
            .json(new ApiResponse(200, unsubscribe, "channel unsubscribe successfully"))
    } else {
        subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        if (!subscribe) {
            throw new ApiError(500, "something went wrong while subscribe the channel")
        }
        return res
            .status(200)
            .json(new ApiResponse(200, subscribe, "channel subscribe successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(400, "channel id is invalid")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
            }
        },
        {
            $project: {
                subscribers: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, subscriber, "subscriber fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(404, "subscriber id is invalid")
    }

    const subscribed = await Subscription.aggregate([
        {
            // in this case i am a subcriber i want to find channel id so
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
            }
        },
        {
            $project: {
                subscribedChannel: {
                    username: 1,
                    avatar: 1
                }
            }
        }
    ])

    if (!subscribed) {
        throw new ApiError(404, "subscribed channel not found")
    }

    return res.status(200)
        .json(new ApiResponse(200, subscribed, "subscribed channel fetched succesfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}