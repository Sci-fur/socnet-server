const { sign } = require("jsonwebtoken")
const dotenv = require("dotenv");

dotenv.config();

const generateToken = (payload) => {
    try {
        return sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

module.exports = generateToken;