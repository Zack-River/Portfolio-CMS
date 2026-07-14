import { Request, Response, NextFunction } from 'express';
import prisma from '../db';

export const auditLog = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute the route handler
    next();

    // After response is sent, log the action
    res.on('finish', async () => {
      // Only log if the request was successful or we explicitly want to log failures
      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        try {
          const user = req.user as any;
          await prisma.auditHistory.create({
            data: {
              userId: user.id,
              action: action,
              details: {
                method: req.method,
                url: req.originalUrl,
                body: req.method !== 'GET' ? req.body : undefined,
              },
              ipAddress: req.ip,
            }
          });
        } catch (err) {
          console.error('Failed to save audit log', err);
        }
      }
    });
  };
};
