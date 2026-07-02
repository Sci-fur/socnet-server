const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const multer = require("multer")

cloudinary.config({
    cloud_name: process.env.COUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage engine for avatars
const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "SocNet/avatars",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill" }],
    },
})

// Storage engine for post media
const postStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: "SocNet/posts",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "avi", "mkv", "webm", "3gp", "flv"],
        resource_type: file.mimetype.startsWith("video") ? "video" : "image",
    }),
})

const upload = multer({ storage: avatarStorage });
const postUpload = multer({
    storage: postStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

module.exports = { cloudinary, upload, postUpload }