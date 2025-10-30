import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import JWTService from "../services/JWTService";
import AccessToken from "../models/accessToken";
import Admin from "../models/admin";

// Extend Express Request to include user
declare module "express" {
  export interface Request {
    user?: any;
  }
}

// Define a mapping between route segments and Mongoose models (admin in this case)
const modelMap: Record<string, mongoose.Model<any>> = {
  admin: Admin, // Only admin should access /api/* routes that require admin access
};

const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken) {
      return next({
        status: 401,
        message: "Unauthorized: No access token provided",
      });
    }

    const tokenRecord = await AccessToken.findOne({ token: accessToken });
    if (!tokenRecord) {
      return next({
        status: 401,
        message: "Your session has ended. Please log in again to continue",
      });
    }

    let payload: { _id: string };
    try {
      payload = JWTService.verifyAccessToken(accessToken) as { _id: string };
    } catch (error) {
      return next({
        status: 401,
        message: "Invalid or expired access token",
      });
    }

    const segments = req.originalUrl.split("/").filter(Boolean); // Split URL to check the route segment
    const routePath = segments[0]; // Get the first part of the path like "api"

    let model: mongoose.Model<any>;

    // Check if the route requires admin access (e.g., /api/addBlog, /api/deleteBlog)
    if (routePath === "api") {
      model = modelMap.admin; // Only admin role should be allowed for API routes like addBlog, updateBlog
    } else {
      return next({
        status: 403,
        message: "Access denied: Unrecognized role in route",
      });
    }

    if (!model) {
      return next({
        status: 403,
        message: "Access denied: Unrecognized route or role",
      });
    }

    const user = await model.findById(payload._id);
    if (!user) {
      return next({
        status: 404,
        message: "User not found for the given route",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
