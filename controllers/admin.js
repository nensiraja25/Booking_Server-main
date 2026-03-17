import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import Ride from "../models/Ride.js";

export const getStats = async (req, res) => {
  const [users, ridesSearching, ridesActive, ridesCompleted] = await Promise.all([
    User.countDocuments({}),
    Ride.countDocuments({ status: "SEARCHING_FOR_RIDER" }),
    Ride.countDocuments({ status: { $in: ["START", "ARRIVED"] } }),
    Ride.countDocuments({ status: "COMPLETED" }),
  ]);

  res.status(StatusCodes.OK).json({
    users,
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

