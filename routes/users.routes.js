import { Router } from "express";
import { updateAddress, userDetails } from "../controllers/users.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const userRouter = Router();

userRouter.route("/update-address").post(verifyJWT, updateAddress);
userRouter.route("/user-details").get(verifyJWT, userDetails);
export default userRouter;
