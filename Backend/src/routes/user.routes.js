import { Router } from "express"
import {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changePassword, 
    resetPassword 
} from "../controllers/user.controllers.js"
import { verifyJWT} from "../middlewares/auth.middleware.js"

const userRouter = Router()

userRouter.route("/registerUser").post(registerUser)
userRouter.route("/loginUser").post(loginUser)
userRouter.route("/logoutUser").post(verifyJWT, logoutUser)
userRouter.route("/refreshToken").post(refreshAccessToken)
userRouter.route("/changePassword").post(changePassword)
userRouter.route("/resetPassword/:token").post(resetPassword)

export default userRouter

