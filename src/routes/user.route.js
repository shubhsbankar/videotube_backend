import { Router } from "express";
import { getCurrentUser, logInUser, logOutUser, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, updateUserPassword, userRefreshToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

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

export default router;