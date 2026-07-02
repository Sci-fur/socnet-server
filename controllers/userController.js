const { cloudinary } = require("../config/cloudinary");
const User = require("../models/User")

// GET /api/users/search?q=query
const searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q || q.trim() === '') {
            return res.status(200).json({ users: [] });
        }

        // Search by first name or last name, exclude current user
        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } },
                {
                    $or: [
                        { firstName: { $regex: q, $options: 'i' } },
                        { lastName: { $regex: q, $options: 'i' } }
                    ]
                }
            ]
        })
        .select('firstName lastName profilePicture email')
        .limit(20);

        res.status(200).json({ users });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// GET /api/users/:id
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// PATCH /api/users/:id
const updateUserProfile = async (req, res, next) => {
    try {
        // Prevent someone updating another user's profile
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: "Not allowed to update this profile" })
        }

        const { firstName, lastName, bio } = req.body || {};

        // Build update object with only provided fields
        const updateFields = {};
        if (firstName) updateFields.firstName = firstName;
        if (lastName) updateFields.lastName = lastName;
        if (bio) updateFields.bio = bio;

        // If a new image was uploaded, Cloudinary URL is in req.files
        if (req.files?.profilePicture?.[0]) {
            const pic = req.files.profilePicture[0];
            updateFields.profilePicture = pic.path;
            updateFields.profilePicturePublicId = pic.filename;
        }
        if (req.files?.coverPhoto?.[0]) {
            const cover = req.files.coverPhoto[0];
            updateFields.coverPhoto = cover.path;
            updateFields.coverPhotoPublicId = cover.filename;
        }

        const oldUser = await User.findOneAndUpdate(
            { _id: req.params.id },
            { $set: updateFields },
            {
                new: false,
                runValidators: true
            }
        ).select("-password");

        if (!oldUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (req.files?.profilePicture?.[0] && oldUser.profilePicturePublicId) {
            try {
                await cloudinary.uploader.destroy(oldUser.profilePicturePublicId)
            } catch (error) {
                console.log("Cloudinary delete failed: ", error);
            }
        }
        if (req.files?.coverPhoto?.[0] && oldUser.coverPhotoPublicId) {
            try {
                await cloudinary.uploader.destroy(oldUser.coverPhotoPublicId)
            } catch (error) {
                console.log("Cloudinary delete failed: ", error);
            }
        }
        const updatedUser = await User.findById(req.params.id).select("-password");

        res.status(200).json({ user: updatedUser })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports = { searchUsers, getUserProfile, updateUserProfile }