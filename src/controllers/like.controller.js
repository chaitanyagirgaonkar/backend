import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video Id")
    }
    const alreadyLike = await Like.findOne(
        {
            video: videoId
        }
    )
    let like;
    let unlike;
    if (alreadyLike) {
        // delete like(unlike)

        unlike = await Like.deleteOne({
            video: videoId
        })

        if (!unlike) {
            throw new ApiError(404, "failed to unlike video")
        }

        return res.status(200)
            .json(new ApiResponse(200, unlike, "unlike video successfully"))
    } else {
        like = await Like.create(
            {
                video: videoId,
                likedBy: req.user?._id
            }
        )
        if (!like) {
            throw new ApiError(404, "failed to like video")
        }
        return res.status(200)
            .json(new ApiResponse(200, like, "like video successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid comment Id")
    }
    const alreadyLike = await Like.findOne(
        {
            comment: commentId
        }
    )
    let like;
    let unlike;
    if (alreadyLike) {
        // delete like(unlike)

        unlike = await Like.deleteOne({
            comment: commentId
        })

        if (!unlike) {
            throw new ApiError(404, "failed to unlike comment")
        }

        return res.status(200)
            .json(new ApiResponse(200, unlike, "unlike comment successfully"))
    } else {
        like = await Like.create(
            {
                comment: commentId,
                likedBy: req.user?._id
            }
        )
        if (!like) {
            throw new ApiError(404, "failed to like comment")
        }
        return res.status(200)
            .json(new ApiResponse(200, like, "like comment successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweet Id")
    }
    const alreadyLike = await Like.findOne(
        {
            tweet: tweetId
        }
    )
    let like;
    let unlike;
    if (alreadyLike) {
        // delete like(unlike)

        unlike = await Like.deleteOne({
            tweet: tweetId
        })

        if (!unlike) {
            throw new ApiError(404, "failed to unlike tweet")
        }

        return res.status(200)
            .json(new ApiResponse(200, unlike, "unlike tweet successfully"))
    } else {
        like = await Like.create(
            {
                tweet: tweetId,
                likedBy: req.user?._id
            }
        )
        if (!like) {
            throw new ApiError(404, "failed to like tweet")
        }
        return res.status(200)
            .json(new ApiResponse(200, like, "like tweet successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likeVideos = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $arrayElemAt: ["$owner", 0]
                            }
                        }
                    }
                ]
            }
        },

    ])

    return res.status(200)
        .json(new ApiResponse(
            200,
            likeVideos[2].likedVideos,
            " fetched Liked videos successfully !!"
        ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}