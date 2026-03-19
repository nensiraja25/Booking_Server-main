import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import Ride from "../models/Ride.js";
import Category from "../models/Category.js";
import Feedback from "../models/Feedback.js";

export const getStats = async (req, res) => {
  const [
    users,
    pendingRegistrations,
    categories,
    openFeedback,
    ridesSearching,
    ridesActive,
    ridesCompleted,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "rider", registrationStatus: "PENDING" }),
    Category.countDocuments({}),
    Feedback.countDocuments({ status: { $in: ["OPEN", "IN_PROGRESS"] } }),
    Ride.countDocuments({ status: "SEARCHING_FOR_RIDER" }),
    Ride.countDocuments({ status: { $in: ["START", "ARRIVED"] } }),
    Ride.countDocuments({ status: "COMPLETED" }),
  ]);

  res.status(StatusCodes.OK).json({
    users,
    pendingRegistrations,
    categories,
    openFeedback,
    rides: {
      searching: ridesSearching,
      active: ridesActive,
      completed: ridesCompleted,
    },
  });
};

export const listUsers = async (req, res) => {
  const { role, phone } = req.query;
  const query = {};
  if (role) query.role = role;
  if (phone) query.phone = String(phone);

  const users = await User.find(query).sort({ createdAt: -1 }).limit(200);
  res.status(StatusCodes.OK).json({ count: users.length, users });
};

export const listRides = async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const rides = await Ride.find(query)
    .populate("customer", "phone role")
    .populate("rider", "phone role")
    .sort({ createdAt: -1 })
    .limit(200);

  res.status(StatusCodes.OK).json({ count: rides.length, rides });
};

// Categories (Manage category)
export const listCategories = async (req, res) => {
  const categories = await Category.find({}).sort({ createdAt: -1 }).limit(200);
  res.status(StatusCodes.OK).json({ count: categories.length, categories });
};

export const createCategory = async (req, res) => {
  const { code, name, description, isActive } = req.body;
  const category = await Category.create({
    code,
    name,
    description: description || "",
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });
  res.status(StatusCodes.CREATED).json({ category });
};

export const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { code, name, description, isActive } = req.body;
  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      ...(code !== undefined ? { code } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
    { new: true }
  );
  res.status(StatusCodes.OK).json({ category });
};

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  await Category.findByIdAndDelete(categoryId);
  res.status(StatusCodes.OK).json({ message: "Category deleted" });
};

// Registrations (Manage registration) - approve/reject responders
export const listRegistrations = async (req, res) => {
  const { status } = req.query;
  const query = { role: "rider" };
  if (status) query.registrationStatus = status;

  const users = await User.find(query).sort({ createdAt: -1 }).limit(200);
  res.status(StatusCodes.OK).json({ count: users.length, users });
};

export const updateRegistrationStatus = async (req, res) => {
  const { userId } = req.params;
  const { registrationStatus, isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      ...(registrationStatus ? { registrationStatus } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
    { new: true }
  );

  res.status(StatusCodes.OK).json({ user });
};

// Feedback (Review feedback)
export const listFeedback = async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const feedback = await Feedback.find(query)
    .populate("createdBy", "phone role")
    .populate("ride")
    .sort({ createdAt: -1 })
    .limit(200);

  res.status(StatusCodes.OK).json({ count: feedback.length, feedback });
};

export const updateFeedbackStatus = async (req, res) => {
  const { feedbackId } = req.params;
  const { status } = req.body;
  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { status },
    { new: true }
  );
  res.status(StatusCodes.OK).json({ feedback });
};

// Reports / diagrams (aggregations)
export const getReports = async (req, res) => {
  const byService = await Ride.aggregate([
    { $group: { _id: "$vehicle", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const byStatus = await Ride.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(StatusCodes.OK).json({ byService, byStatus });
};

