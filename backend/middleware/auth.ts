import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

// Перевіряє JWT і кладе { id, role } у req.user
export default async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const user = (await User.findByPk(decoded.id, { attributes: ['id', 'role'], raw: true })) as any;
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Auth failed: invalid token' });
  }
};
