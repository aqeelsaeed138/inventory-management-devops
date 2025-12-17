import mongoose, { Schema } from "mongoose";

const businessInfoSchema = new Schema({
    workEmailId: {
        type: Schema.Types.ObjectId,
        ref: "WorkEmail",
        required: true,
        unique: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    businessType: {
        type: String,          
        required: true,
        enum: [
            "retail", 
            "wholesale", 
            "manufacturing", 
            "restaurant", 
            "pharmacy", 
            "electronics", 
            "clothing", 
            "grocery", 
            "other"
        ],
        default: "retail"
    },
    phoneNo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    currency: {
        type: String,
        enum: [
             "USD", "EUR", "GBP", "PKR", "INR", "CAD", "AUD", 
            "JPY", "CNY", "AED", "SAR", "QAR", "KWD", "BHD"
        ],      
        default: "PKR",
    },
    logo: {
        type: String,
         validate: {
            validator: function(v) {
                if (!v) return true; // Allow empty logo
                // Basic URL validation
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i.test(v);
            },
            message: 'Logo must be a valid image URL'
        }
    },
}, { timestamps: true })

businessInfoSchema.methods.getDisplayInfo = function(){
    return {
        id: this.workEmailId,
        name: this.businessName,
        type: this.businessType,
        phoneNo: this.phoneNo,
        currency: this.currency,
        logo: this.logo
    }
}

export const BusinessInfo = mongoose.model("BusinessInfo", businessInfoSchema)

//  for fututre if you want to increase peroformance than apply indexes for large searching fields
// and addjust currency and phone no validations according to each other



