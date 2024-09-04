import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        /** turn validation off while saving to DB to prevent Mongoose model kick-in() */
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get details from frontend
    // validation - chechk data is empty or not
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload to Cloudinary, chech avatar 
    // create user object - create entry in DB
    // remove password and refresh token fields from reponse
    // check for user creation
    // return response

    const { fullName, email, username, password } = req.body
    // console.log(req.body)
    // console.log({
    //     fullName,
    //     email,
    //     username,
    //     password
    // })

    /** It checks if any of the fields are empty, then returns an error */
    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }    

    /** It finds a user with username or email received from frontend */
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    /** If user already exists, then it returns an error */
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    /** provide correct local path for uploading and also to delete from local server */
    const avatarLocalPath = req.files?.avatar[0]?.destination+'/'+req.files?.avatar[0]?.originalname;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && 
    req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].destination+'/'+req.files.coverImage[0].originalname
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  // remove password and refreshToken field from response 
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")   
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
    
} )

const loginUser = asyncHandler( async (req, res) => {
    // req.body -> fetch data from frontend
    // username or email
    // find user in DB
    // check password
    // generate access token and refresh token
    // send cookies

    const { email, username, password } = req.body

    // console.log(req.body)

    /** checks if username or email is empty, then returns an error */
    if (!username && !email) {
        throw new ApiError(400, "either username or email is required")
    }

    if(!password) {
        throw new ApiError(400, "Password is required")
    }

    /** finds a user with username or email */
    const user = await User.findOne({
        $or: [{ username },{ email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken")

    /** set OPTIONS for configuring cookies 
     * (can be modifiable in server side only) 
     */
    const options = {
        httpOnly: true, // Flags the cookie to be accessible only by the web server.
        secure: true, // Marks the cookie to be used with HTTPS only.

        // path: "/", // Path for the cookie. Defaults to “/”.

        // signed: true, // Indicates if the cookie should be signed.

        // maxAge: 5 * 60 * 1000 // 5 mins 
        //Convenient option for setting the expiry time relative to the current time in milliseconds.
    }

    /** send response with cookies and statusCode */
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully !"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    // clear the cookies 
    // reset the refresh token
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    /**  set OPTIONS for configuring cookies */
    const options = {
        httpOnly: true, // Flags the cookie to be accessible only by the web server.
        secure: true, // Marks the cookie to be used with HTTPS only.

        // path: "/", // Path for the cookie. Defaults to “/”.

        // signed: true, // Indicates if the cookie should be signed.

        // maxAge: 24 * 60 * 60 * 1000 // 24 hours 
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out Successfully !")
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request 🚫")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, " Refresh token expired or user")
        }
        /**  set OPTIONS for configuring cookies */
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token refreshed Successfully !"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentUserPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.destination+'/'+req.file?.originalname;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Image updated Successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.destination+'/'+req.file?.originalname;

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated Successfully")
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}