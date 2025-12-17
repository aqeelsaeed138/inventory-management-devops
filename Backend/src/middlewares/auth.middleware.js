import { User } from "../models/user.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiErrors(401, "Unauthorized request")
        }
    
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken._id)
        if (!user) {
            throw new ApiErrors(400, "Invalid access token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiErrors(400, error?.message || "Unauthorized request", error)
    }
})

export { verifyJWT }