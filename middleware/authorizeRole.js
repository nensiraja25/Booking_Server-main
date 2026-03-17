import UnauthenticatedError from "../errors/unauthenticated.js";

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      throw new UnauthenticatedError("Not authorized");
    }
    next();
  };
};

export default authorizeRole;

