const { body, validationResult } = require("express-validator")

const registerValidation = [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
    body("password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            })
        }

        next();

    }
]

module.exports = { registerValidation }