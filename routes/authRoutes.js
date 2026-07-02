const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { registerValidation } = require("../validators/authValidator");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", registerValidation, register)
router.post("/login", login);
router.get("/me", protect, me)


module.exports = router;