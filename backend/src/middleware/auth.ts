import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      id: number;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const verifyRefreshToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.body.refreshToken;

    if (!token) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "") as {
      id: number;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

export const verifyRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== requiredRole) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};
