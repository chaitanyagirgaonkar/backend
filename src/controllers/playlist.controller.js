import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const isUserOwnerOfPlaylist = async (playlistId, req) => {
    const playlist = await Playlist.findById(playlistId);

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        return false;
    }

    return true;

}

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist

    if (!name) {
        throw new ApiError(404, "name is required")
    }
    if (!description) {
        throw new ApiError(404, "description is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })
    if (!playlist) {
        throw new ApiError(404, "playlist required")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist is created"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "user not found")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
            }
        },
        {
            $addFields: {
                playlist: {
                    $first: "$videos"
                }
            }
        }
    ])
    if (!playlists) {
        throw new ApiError(404, "something went wrong while fetching playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist ID is not found")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "playlist is not found")
    }

    return res.status(200)
        .json(new ApiResponse(200, playlist, "playlist fetch successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
        throw new ApiError(400, "playlist id and video id is not correct")
    }
    const authorize = isUserOwnerOfPlaylist(playlistId, req)
    if (!authorize) {
        throw new ApiError(400, "user is not authorize")
    }
    const playlist = await Playlist.findById(playlistId)

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(404, "video already exist in playlist")
    }
    const addToPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $push: {
                videos: videoId
            }
        }, { new: true })

    if (!addToPlaylist) {
        throw new ApiError(404, "video is not added into playlist")
    }

    return res.status(200)
        .json(new ApiResponse(200, addToPlaylist, "video added successfully into playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
        throw new ApiError(404, "playlist and video ID is not correct")
    }

    const authorized = isUserOwnerOfPlaylist(playlistId, req)
    if (!authorized) {
        throw new ApiError(404, "user is unauthorize")
    }

    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: {
                videos: videoId
            }
        }, { new: true })

    if (!removeVideoFromPlaylist) {
        throw new ApiError(404, "video not removed from playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, removeVideoFromPlaylist, "video successfully remove from playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist id is not correct")
    }

    const authorized = isUserOwnerOfPlaylist(playlistId, req)
    if (!authorized) {
        throw new ApiError(404, "user is not Authorized")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletePlaylist) {
        throw new ApiError(404, "playlist not deleted ")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletePlaylist, "playlist deleted successfully."))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist Id is not correct")
    }
    if (!name && !description) {
        throw new ApiError(404, "name and description is required")
    }
    const authorized = isUserOwnerOfPlaylist(playlistId, req)
    if (!authorized) {
        throw new ApiError(404, "user is not authorized")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name,
                description
            }
        }, { new: true })

    if (!updatedPlaylist) {
        throw new ApiError(404, "failed to update playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
