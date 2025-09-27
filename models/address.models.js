import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    street: {
      type: String,
      required: [true, "street is Required"],
      lowercase: true,
    },
    city: {
      type: String,
      required: [true, "city is Required"],
      lowercase: true,
    },
    state: {
      type: String,
      required: [true, "state is Required"],
      lowercase: true,
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is Required"],
    },
    country: { type: String, default: "India" },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);
export const Address = mongoose.model("Address", addressSchema);
