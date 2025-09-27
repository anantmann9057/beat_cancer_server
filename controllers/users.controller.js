import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Address } from "../models/address.models.js";
import { extractInput } from "../utils/helper.js";
import { User } from "../models/users.models.js";

const updateAddress = asyncHandler(async (req, res) => {
  const { state, city, street, postalCode } = extractInput(req, [
    "state",
    "city",
    "street",
    "postalCode",
  ]);
  let user = await User.findById(req.user._id);

  if (!user) throw new ApiErrorResponse(400, "user not found");

  let updateAddress = await Address.create({
    user: req.user._id,
    city: city,
    state: state,
    street: street,
    postalCode: postalCode,
  });

  if (!updateAddress) throw new ApiErrorResponse(400, "something went wrong");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Address updated Successfully"));
});
const userDetails = asyncHandler(async (req, res) => {
  let user = await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        refreshToken: 1,
      },
    },
    {
      $lookup: {
        from: "addresses",
        localField: "_id",
        foreignField: "user",
        as: "address",
      },
    },
  ]);

  if (!user) throw new ApiErrorResponse(400, "Something went wrong");

  return res.status(200).json(new ApiResponse(200, user[0], "Success"));
});
export { updateAddress, userDetails };
