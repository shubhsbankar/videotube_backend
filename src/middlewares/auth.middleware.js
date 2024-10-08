import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

const verifyJwt = async (req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token){
            throw new ApiError(401, "Unauthorized request");
        }
        const decodedUser = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedUser._id).select("-password -refreshToken");
        
        if (!user){
            throw new ApiError(401,"Invalid Access Token");
        }
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
        
    }

}

export { verifyJwt };