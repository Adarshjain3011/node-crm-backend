import jwt from "jsonwebtoken";
import responseHandler from "../utils/responseHandler.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Try to get the token from cookies
    let token = req.cookies.token;

    // 2. If not in cookies, check the Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]; // Extract the token
      }
    }

    // 3. If not in header, check the query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }

    console.log("token at the auth middleware ",token);

    // If token not found in any location
    if (!token) {
      return responseHandler(res, 401, false, "Unauthorized: No token provided");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user data to request

    console.log("decoded value of the token is ",decoded);

    next();
  } catch (error) {
    console.log("Auth Middleware Error:", error);
    return responseHandler(res, 401, false, "Unauthorized: Invalid token", null, error);
  }
};


