import { Router } from "express";
import { 
    getCurrentUser, 
    getUserChannelProfille, 
    getUserWatchHistory, 
    logInUser, 
    logOutUser, 
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    updateUserPassword, 
    userRefreshToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getAllVideos } from "../controllers/video.controller.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route("/login").post(logInUser);
router.route("/refresh-token").post(userRefreshToken);

router.route("/logout").post(verifyJwt, logOutUser);
router.route("/get-user").get(verifyJwt, getCurrentUser);
router.route("/change-password").patch(verifyJwt, updateUserPassword);
router.route("/change-userdetails").patch(verifyJwt, updateAccountDetails);
router.route("/change-avatar").patch(verifyJwt,upload.single("avatar"), updateUserAvatar);
router.route("/change-coverimage").patch(verifyJwt,upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:username").get(verifyJwt,getUserChannelProfille);
router.route("/watch-history").get(verifyJwt,getUserWatchHistory);

router.route("/get-videos").get(verifyJwt,getAllVideos);

export default router;