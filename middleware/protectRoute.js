import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protectRoute = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export default protectRoute;
