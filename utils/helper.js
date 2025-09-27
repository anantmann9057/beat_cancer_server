import { ApiErrorResponse } from "./ApiErrorResponse.js";
import { User } from "../models/users.models.js";
const extractInput = (req, keys) => {
  const input = {};
  keys.forEach((key) => {
    input[key] = req.body[key] || req.query[key] || req.params[key];
    if (!input[key])
      throw new ApiErrorResponse(400, `Missing or invalid ${key}`);
  });
  return input;
};
// Generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiErrorResponse(404, "User not found");

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export { extractInput, generateAccessAndRefreshToken };
