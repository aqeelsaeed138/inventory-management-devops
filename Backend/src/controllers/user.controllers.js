import { ApiErrors } from "../utils/ApiErrors.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"
import crypto from "crypto"
import nodemailer from "nodemailer"


const generateAccessAndRefreshToken = async (_id)=> {
    const user = await User.findById(_id)
    if (!user) {
        throw new ApiErrors(500, "Error ocuur in generating tokens")
    }
    const refreshToken = await user.generateRefreshToken()
    const accessToken = await user.generateAccessToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return { accessToken, refreshToken }

}
const registerUser = asyncHandler(async (req, res)=> {
    if (!req.body) {
        throw new ApiErrors(400, "Request body is required..")
    }

    const {workEmail, username, fullName, password, profilePic } = req.body

    if (
        [workEmail, username, fullName, password].some((field) => {
            return field?.trim() === "" || !field
        })
    ) {
        throw new ApiErrors(400, "All fields are required to register new user")
    }

    const alreadyExistedUser = await User.findOne({workEmail, username})

    if (alreadyExistedUser) {
        throw new ApiErrors(400, "This User is already registered. Please login")
    }

    //  handle profile pic

    const user = await User.create({
        workEmail,
        username,
        fullName,
        password,
        profilePic
    })

    const createdUser = await User.findById(user._id)

    if (!createdUser) {
        throw new ApiErrors(500, "User can't registered. Some internal server error occur")
    }
    return res.status(200)
    .json(
        new ApiResponse(201, createdUser, "Registered new User")
    )
})
const loginUser = asyncHandler(async (req, res) => {
     if (!req.body) {
        throw new ApiErrors(400, "Request body is required..")
    }

    const {workEmail, password} = req.body

    if (!(workEmail && password)) {
        throw new ApiErrors(400, "All fields are required")
    }

    const existedUser = await User.findOne({workEmail})

    if (!existedUser) {
        throw new ApiErrors(400, "This User is not registered.. First register this user")
    }

    const isPasswordValid = await existedUser.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiErrors(400, "Password is incorrect")
    }

    const { accessToken, refreshToken} = await generateAccessAndRefreshToken(existedUser._id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: existedUser,
            accessToken,
            refreshToken
        }, "User login successfully")
    )
})
const logoutUser = asyncHandler( async (req, res) => {
    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logout successfully")
    )
})
const refreshAccessToken = asyncHandler( async (req, res) => {
    const token = req.cookies?.refreshToken || req.params.refreshToken || "";
    if (token === "") {
        throw new ApiErrors(400, "Error occurs in fetching refresh token from your request")
    }
    const decodeToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodeToken._id)
    if (!user) {
        throw new ApiErrors(400, "Your refresh token is expired or invalid")
    }
    if (user.refreshToken !== token) {
        throw new ApiErrors(400, "Your refresh token is used or expired")
    }
    const { accessToken, refreshToken} = generateAccessAndRefreshToken(user._id)
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
       new ApiResponse(201, { accessToken, refreshToken}, "new access token is assigned")
    )
})
const changePassword = asyncHandler( async (req, res) => {

    if (!req.body) {
        throw new ApiErrors(400, "Request body is required")
    }
    const { workEmail } = req.body
    if (!workEmail) {
    throw new ApiErrors(400, "Email is required")
    }
    const user = await User.findOne({workEmail})
    if (!user) {
        return res.status(200)
        .json(
        new ApiResponse(200, {}, "If email exists, reset link has been sent")
        )
    }

    try {
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
        user.passwordResetToken = resetTokenHash
        user.passwordResetExpires = Date.now() + (15 * 60 * 1000)  // 15 mints
        await user.save()

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
        await sendPasswordResetEmail(workEmail, resetUrl)

        return res.status(200)
        .json(
            new ApiResponse(200, {}, "If email exists, reset link has been sent")
        )
    } catch (error) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save()
        throw new ApiErrors(500, error.message || "Failed to send password reset email", error)
    }
})
const sendPasswordResetEmail = async (email, resetURL) => {
    
    // Create email transporter (using Gmail)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.MY_Gmail, 
            pass: process.env.GMAIL_PASS  
        }
    })
    
    // Email content
    const receiver = {
        from: `"${process.env.COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - Inventory System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333;">${process.env.COMPANY_NAME || 'Inventory System'}</h1>
                </div>
                
                <h2 style="color: #333;">Password Reset Request</h2>
                
                <p>Hello,</p>
                <p>You are receiving this email because a password reset was requested for your work email account.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Account:</strong> ${email}</p>
                </div>
                
                <p>Please click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" 
                       style="background-color: #007bff; color: white; padding: 15px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;
                              font-weight: bold;">
                        Reset My Password
                    </a>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; 
                           border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
                    <ul style="margin: 5px 0;">
                        <li>This link will expire in <strong>15 minutes</strong></li>
                        <li>The link can only be used once</li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">${resetURL}</p>
                
                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    This is an automated email from ${process.env.COMPANY_NAME || 'Inventory Management System'}
                </p>
            </div>
        `
    }
    
    // Send email
    await transporter.sendMail(receiver)
}
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params // from URL: /reset-password/abc123xyz
    const { newPassword, confirmPassword } = req.body
    
    if (!newPassword || !confirmPassword) {
        throw new ApiErrors(400, "New password and confirm password are required")
    }
    
    if (newPassword !== confirmPassword) {
        throw new ApiErrors(400, "Passwords do not match")
    }
    
    if (newPassword.length < 6) {
        throw new ApiErrors(400, "Password must be at least 6 characters long")
    }
    
    // Hash the token to match what's stored in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() } // Token not expired
    })
    
    if (!user) {
        throw new ApiErrors(400, "Password reset token is invalid or has expired")
    }
    
    user.password = newPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.refreshToken = undefined
    await user.save()
    
    res.status(200).json(
        new ApiResponse(200, {}, "Password has been reset successfully. Please login with your new password.")
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, resetPassword } 




