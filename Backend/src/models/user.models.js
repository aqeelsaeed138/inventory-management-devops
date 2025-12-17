import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { ApiErrors } from "../utils/ApiErrors.js"

const userSchema = new Schema({
    workEmail: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    lastLogin: {
        type: Date
    },
    refreshToken: {
        type: String
    },
    profilePic: {
        type: String
    },
     passwordResetToken: {
            type: String
    },
    passwordResetExpires: {
        type: Date
    }      

}, { timestamps: true })


userSchema.pre("save", async function(next){
   try {
     if (!this.isModified("password")) {
         return next();
     }
     this.password = await bcrypt.hash(this.password, 10)
     next();
   } catch (error) {
        next(error);
   }
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return bcrypt.compare(password, this.password)
}
userSchema.methods.getPublicProfile = function() {
    return {
        _id: this._id,
        username: this.username,
        fullName: this.fullName,
        createdAt: this.createdAt,
        workEmail: this.workEmail,
        profilePic: this.profilePic
    };
}
userSchema.methods.updateLastLogin = function(){
    this.lastLogin = Date.now()
    return this.save
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
           
        },
         process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateAccessToken = function() {
    const secret = process.env.ACCESS_TOKEN_SECRET
    const expiry = process.env.ACCESS_TOKEN_EXPIRY
    if (!secret) {
        throw new ApiErrors(404, "ACCESS TOKEN SECRET is not defined in environment variables")
    }
    return jwt.sign(
    {
        _id: this._id,
        email: this.email ,
    },
    secret,
    {
        expiresIn: expiry || "1h"
    }
) }

export const User = mongoose.model("User", userSchema)


// // Here the client makes requests with the token:
// Backend middleware decodes the token.
// Extracts the user role from the payload (e.g., role: "owner").
// Decides if the user is allowed to access the route.


//  write pre and post hooks whenever user is created, its password or any other field is modified
//  or reset. If some functionality occurs then write here in pre and post hooks



// write custome methods for userSchema if any you want

/* 
Minor Suggestions for Future:

Consider adding email validation regex
Add password strength requirements (min length, etc.)
Consider adding user status (active/inactive)
Add created/updated by fields for audit trail
*/

// Creates WorkEmail document with auto-generated _id
// Returns JWT token and needsBusinessInfo: true for owners
