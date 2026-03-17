import mongoose from "mongoose";
import crypto from "crypto";

const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["customer", "rider", "admin"],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

otpSchema.index({ phone: 1, role: 1 }, { unique: true });

otpSchema.statics.hashCode = function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
};

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;

