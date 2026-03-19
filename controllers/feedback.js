import { StatusCodes } from "http-status-codes";
import Feedback from "../models/Feedback.js";

export const createFeedback = async (req, res) => {
  const { message, rating, rideId } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Message is required" });
  }

  const feedback = await Feedback.create({
    createdBy: req.user.id,
    message: String(message).trim(),
    rating: rating !== undefined && rating !== null ? Number(rating) : null,
    ride: rideId || null,
  });

  res.status(StatusCodes.CREATED).json({ message: "Feedback submitted", feedback });
};

export const myFeedback = async (req, res) => {
  const items = await Feedback.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .limit(200);
  res.status(StatusCodes.OK).json({ count: items.length, feedback: items });
};

