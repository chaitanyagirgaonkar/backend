import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!content){
        throw new ApiError(400,"Content is required..")
    }
    const tweet = await Tweet.create(
        {
            content : content,
            owner:req.user?._id
        }
    )
    if(!tweet){
        throw new ApiError(400,"tweet is not found...")
    }
    return res
    .status(200)
    .json(new ApiResponse(200 , tweet , "tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"user id not found")
    }
    const user = await User.findById(userId)
    
    if(!user){
        throw new ApiError(404,"user not found .")
    }
   
    const tweet  = await Tweet.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(userId)
            }
        }
    ])
    console.log(tweet)

    res.status(200)
    .json( new ApiResponse(200,tweet,"Tweet fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"tweet Id is not found")
    }

    const {content} = req.body

    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content
            }
        },{new:true})

    if(!tweet){
        throw new ApiError(404,"tweet is not found")
    }    
    res
    .status(200)
    .json(new ApiResponse (200,tweet,"tweet updates successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"tweet Id is not found")
    }
    
    const tweet = await Tweet.findByIdAndDelete(tweetId) 
    if(!tweet){
        throw new ApiError(404,"tweet not exist")
    }

    res
    .status(200)
    .json(new ApiResponse(200,{deletedTweet :  tweet},"tweet delete successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
