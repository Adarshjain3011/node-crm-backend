import responseHandler from "../utils/responseHandler.js";

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return responseHandler(
        res,
        403,
        false,
        `Access denied. Required roles: ${allowedRoles.join(", ")}`
      );
    }
    next();
  };
};


