import jwt from "jsonwebtoken";
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js";
import { User } from "../models/users.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  if (!req.cookies.refreshToken && req.header("Authorization") === undefined) {
    throw new ApiErrorResponse(401, "Un-Authorised Login to continue");
  }
  const token =
    req.cookies.refreshToken ||
    req.header("Authorization").replace("Bearer ", "");
  let decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  if (!decodedToken) throw new ApiErrorResponse(401, "invalid token");

  var user = await User.findById(decodedToken._id).select(
    "-password -refreshToken"
  );

  if (!user) throw new ApiErrorResponse(200, "User not found please register");
  req.user = user;
  next();
});
