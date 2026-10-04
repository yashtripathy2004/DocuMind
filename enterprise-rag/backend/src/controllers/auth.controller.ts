import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { validateEmail, validateRequiredFields } from '../utils/validators.js';
import { User } from '../types/index.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequiredFields(req.body, ['email', 'password']);
      const { email, password } = req.body;

      if (!validateEmail(email)) {
        throw ApiError.badRequest('Invalid email address format');
      }

      if (password.length < 8) {
        throw ApiError.badRequest('Password must be at least 8 characters in length');
      }

      const existingUsers = await query<User>('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUsers.length > 0) {
        throw ApiError.badRequest('A user with this email address already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const [newUser] = await query<User>(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, passwordHash]
      );

      const token = jwt.sign({ id: newUser.id, email: newUser.email }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as any,
      });

      res.status(201).json({
        success: true,
        data: { user: { id: newUser.id, email: newUser.email }, token },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequiredFields(req.body, ['email', 'password']);
      const { email, password } = req.body;

      const users = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
      if (users.length === 0) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      const user = users[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      
      if (!valid) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as any,
      });

      res.status(200).json({
        success: true,
        data: { user: { id: user.id, email: user.email }, token },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProfile(req: any, res: Response, next: NextFunction) {
    try {
      const users = await query<User>('SELECT id, email, created_at FROM users WHERE id = $1', [
        req.user.id,
      ]);

      if (users.length === 0) {
        throw ApiError.notFound('User not found');
      }

      res.status(200).json({ success: true, data: { user: users[0] } });
    } catch (error) {
      next(error);
    }
  }
}
