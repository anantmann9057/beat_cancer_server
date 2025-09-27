import { User } from "../models/users.models.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  extractInput,
  generateAccessAndRefreshToken,
} from "../utils/helper.js";

const registerUser = asyncHandler(async (req, res) => {
  console.log(req.query);
  const { fullName, email, password } = extractInput(req, [
    "fullName",
    "email",
    "password",
  ]);

  let doesUserExists = await User.findOne({
    email: email,
  });

  if (doesUserExists)
    throw new ApiErrorResponse(400, "User Already Exists please login");

  let createUser = await User.create({
    fullName: fullName,
    email: email,
    password: password,
  });

  if (!createUser) throw new ApiErrorResponse(400, "something went wrong!");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "You are registered successfully!"));
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = extractInput(req, ["email", "password"]);

  const existingUser = await User.findOne({
    email: email,
  });
  if (!existingUser)
    throw new ApiErrorResponse(400, "User not found, please register!");

  const isPasswordCorrect = await existingUser.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new ApiErrorResponse(403, "Wrong password!");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existingUser._id
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  const loggedInUser = await User.aggregate([
    {
      $match: {
        _id: existingUser._id,
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        refreshToken: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedInUser[0], "Login successful!"));
});
export { registerUser, loginUser };
