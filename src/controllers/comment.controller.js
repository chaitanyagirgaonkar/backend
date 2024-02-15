import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from '../models/video.model.js'
const isUserOwnerOfComment = async (commentId, req) => {
    const comment = await Comment.findById(commentId);

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        return false;
    }

    return true;

}

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is required!!");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        // If the video doesn't exist, delete all comments associated with the video ID
        await Comment.deleteMany({ video: videoId });
        throw new ApiError(400, "There is no such Video. All associated comments have been deleted.");
    }
    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                owner: {
                    $first: "$owner",
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                },
                isLiked: 1
            },
        },
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    if (!comments || comments.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No commments in this video!!"))
    }
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments of the video fetched Successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content) {
        throw new ApiError(404, "content is required.")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "In valid video ID")
    }

    const comment = await Comment.create(
        {
            content,
            video: videoId,
            owner: req.user?._id
        }
    )
    if (!comment) {
        throw new ApiError(404, "failed to create comment")
    }
    return res.status(200)
        .json(new ApiResponse(200, comment, "comment create successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content) {
        throw new ApiError(404, "content is required.")
    }
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "In valid comment ID")
    }
    const authorized = isUserOwnerOfComment(commentId, req)
    if (!authorized) {
        throw new ApiError(404, "In valid User")
    }
    const update = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content
            }
        }, { new: true })

    if (!update) {
        throw new ApiError(404, "failed ti update comment.")
    }
    return res.status(200)
        .json(new ApiResponse(200, update, "comment updated successfully."))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "comment Id is Invalid")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)

    if (!deleteComment) {
        throw new ApiError(404, "failed to delete comment")
    }

    return res.status(200)
        .json(new ApiResponse(200, deleteComment, "comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
