const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        maxlength: [20, 'Please enter a username of 20 characters or less.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        lowercase: true,
    },
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    profileImage: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'admin'  // temporary value to demonstrate admin functions
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    favoriteSites: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CulturalSite'
    }],
    bio: {
        type: String,
        maxlength: [200, 'bio must be under 200 characters']
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;