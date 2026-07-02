const User = require("../models/User")
const generateToken = require("../utils/jwtGenerator")

const register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  try {

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json(
        {
          message: "Email already in use"
        }
      )
    }

    const user = await User.create({ firstName, lastName, email, password });

    const token = generateToken({ id: user._id });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    })
  } catch (error) {
    console.log(error);
    next(error);
  }

}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password since we set select: false in schema
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken({ id: user._id });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    console.log(user.id);
    res.status(200).json({ user });
  } catch(error) {
    next(error);
  }
}

module.exports = { register, login , me}