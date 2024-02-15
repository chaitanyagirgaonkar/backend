import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const isUserOwner = async (videoId, req) => {
    const video = await Video.findById(videoId);

    if (video?.owner.toString() !== req.user?._id.toString()) {
        return false;
    }

    return true;

}

const getAllVideos = asyncHandler(async (req, res) => {
    const {

        page = 1,
        limit = 10,
        query = `/^video/`,
        sortBy = "createdAt",
        sortType = 1,
        userId = req.user._id } = req.query

    // find user in db
    const user = await User.findById(
        {
            _id: userId
        }
    )

    if (!user) {
        throw new ApiError(404, "user not found")
    }

    const getAllVideosAggregate = await Video.aggregate([
        {
            $match: {
                videoOwner: new mongoose.Types.ObjectId(userId),
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        },
        {
            $sort: {
                [sortBy]: sortType
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }

    ])

    Video.aggregatePaginate(getAllVideosAggregate, { page, limit })
        .then((result) => {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        result,
                        "fetched all videos successfully !!"
                    )
                )
        })
        .catch((error) => {
            console.log("getting error while fetching all videos:", error)
            throw error
        })


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title) {
        throw new ApiError(404, "Title is required")
    }
    if (!description) {
        throw new ApiError(404, "description is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    // console.log(`video local path ${videoLocalPath}`)
    // console.log(`thumnail local path ${thumbnailLocalPath}`)

    if (!videoLocalPath) {
        throw new ApiError(404, "video file is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(404, "thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    // console.log(`video  ${videoFile}`)
    // console.log(`thumnail ${thumbnail}`)

    if (!videoFile) {
        throw new ApiError(404, "video is required")
    }
    if (!thumbnail) {
        throw new ApiError(404, "thumnail is required")
    }

    const video = await Video.create({
        videoFile: {
            public_id: videoFile?.public_id,
            url: videoFile?.url
        },
        thumbnail: {
            public_id: thumbnail?.public_id,
            url: thumbnail?.url
        },
        title,
        description,
        duration: videoFile?.duration,
        isPublished: true,
        owner: req.user?._id
    })
    if (!video) {
        throw new ApiError(404, "video is not created.")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(404, "videoId is Required")
    }
    const video = await Video.findById(videoId)

    const authorized = isUserOwner(videoId, req)
    if (!authorized) {
        throw new ApiError(404, "user is not authorized")
    }
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "video ID is not correct")
    }
    if (!title || !description) {
        throw new ApiError(404, "title is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(404, "thumnail file is required")
    }

    const authorized = await isUserOwner(videoId, req)

    if (!authorized) {
        throw new ApiError(300, "Unauthorized Access")
    }

    const previousVideo = await Video.findOne(
        {
            _id: videoId
        }
    )

    if (!previousVideo) {
        throw new ApiError(404, "previous video not found")
    }

    // console.log(`public id ${previousVideo.thumbnail?.public_id}`)
    let thumbnail;
    if (thumbnailLocalPath) {
        await deleteOnCloudinary(previousVideo.thumbnail?.public_id)

        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(404, "thumnail is required")
        }

    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail?.public_id,
                    url: thumbnail?.url
                },
            }
        },
        { new: true })

    if (!updateVideo) {
        throw new ApiError(404, "video is not update")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "video Id is not correct")
    }
    const authorized = await isUserOwner(videoId, req)
    if (!authorized) {
        throw new ApiError(404, "user is not authorize")
    }

    const video = await Video.findById(videoId)
    console.log(`video : ${video}`)
    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if (video.videoFile) {
        console.log(`videofile public id : ${video.videoFile.public_id}`)
        await deleteOnCloudinary(video.videoFile.public_id, "video")
    }

    if (video.thumbnail) {
        console.log(`thumbnail public id : ${video.thumbnail.public_id}`)
        await deleteOnCloudinary(video.thumbnail.public_id)
    }

    const deleteResponse = await Video.findByIdAndDelete(videoId)

    if (!deleteResponse) {
        throw new ApiError(500, "something went wrong while deleting video !!")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "video deleted successfully!!"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "video id is not correct")
    }
    const authorized = isUserOwner(videoId, req)
    if (!authorized) {
        throw new ApiError(404, "user not authorized")
    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video is not found")
    }
    video.isPublished = !video.isPublished

    await video.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, "video status is changed successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
