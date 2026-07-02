const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const dotenv = require('dotenv').config();

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        // Attach user to request object
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) {
            return res.status(401).json({ message: "User no longer exists!" });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ message: "Not authorized, invalid token" })
    }
}

module.exports = { protect };