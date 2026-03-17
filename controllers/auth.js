import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").trim();
}

function generateOtpCode() {
  // 4-digit numeric OTP (matches existing UI component)
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

export const auth = async (req, res) => {
  const { phone, role } = req.body;

  if (!phone) {
    throw new BadRequestError("Phone number is required");
  }

  if (!role || !["customer", "rider", "admin"].includes(role)) {
    throw new BadRequestError("Valid role is required (customer, rider, admin)");
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    let user = await User.findOne({ phone: normalizedPhone });

    if (user) {
      if (user.role !== role) {
        throw new BadRequestError("Phone number and role do not match");
      }

      const accessToken = user.createAccessToken();
      const refreshToken = user.createRefreshToken();

      return res.status(StatusCodes.OK).json({
        message: "User logged in successfully",
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    user = new User({
      phone: normalizedPhone,
      role,
    });

    await user.save();

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const requestOtp = async (req, res) => {
  const { phone, role } = req.body;
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new BadRequestError("Valid phone number is required");
  }
  if (!role || !["customer", "rider", "admin"].includes(role)) {
    throw new BadRequestError("Valid role is required (customer, rider, admin)");
  }

  const code = generateOtpCode();
  const codeHash = Otp.hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await Otp.findOneAndUpdate(
    { phone: normalizedPhone, role },
    { phone: normalizedPhone, role, codeHash, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // In production you would send SMS here (Twilio, AWS SNS, etc).
  const isDev = process.env.NODE_ENV !== "production";

  res.status(StatusCodes.OK).json({
    message: "OTP sent",
    ...(isDev ? { dev_otp: code } : {}),
    expires_in_seconds: Math.floor(OTP_TTL_MS / 1000),
  });
};

export const verifyOtp = async (req, res) => {
  const { phone, role, code } = req.body;
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new BadRequestError("Valid phone number is required");
  }
  if (!role || !["customer", "rider", "admin"].includes(role)) {
    throw new BadRequestError("Valid role is required (customer, rider, admin)");
  }
  if (!code || String(code).trim().length < 4) {
    throw new BadRequestError("OTP code is required");
  }

  const otp = await Otp.findOne({ phone: normalizedPhone, role });
  if (!otp) {
    throw new UnauthenticatedError("OTP not found or expired");
  }
  if (otp.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: otp._id });
    throw new UnauthenticatedError("OTP expired");
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new UnauthenticatedError("Too many attempts. Request a new OTP.");
  }

  const providedHash = Otp.hashCode(String(code).trim());
  const isMatch = providedHash === otp.codeHash;
  if (!isMatch) {
    otp.attempts += 1;
    await otp.save();
    throw new UnauthenticatedError("Invalid OTP");
  }

  await Otp.deleteOne({ _id: otp._id });

  let user = await User.findOne({ phone: normalizedPhone });
  if (user && user.role !== role) {
    throw new BadRequestError("Phone number and role do not match");
  }
  if (!user) {
    user = await User.create({ phone: normalizedPhone, role });
  }

  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  res.status(StatusCodes.OK).json({
    message: "OTP verified",
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
  });
};

export const bootstrapAdmin = async (req, res) => {
  const { phone, secret } = req.body;
  const normalizedPhone = normalizePhone(phone);

  if (!process.env.ADMIN_BOOTSTRAP_SECRET) {
    throw new BadRequestError("Admin bootstrap is not configured");
  }
  if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    throw new UnauthenticatedError("Invalid bootstrap secret");
  }
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new BadRequestError("Valid phone number is required");
  }

  let user = await User.findOne({ phone: normalizedPhone });
  if (!user) {
    user = await User.create({ phone: normalizedPhone, role: "admin" });
  } else {
    user.role = "admin";
    await user.save();
  }

  res.status(StatusCodes.OK).json({
    message: "Admin bootstrapped",
    user,
  });
};

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};
