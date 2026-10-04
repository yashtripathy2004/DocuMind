import { ApiError } from './api-error.js';

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequiredFields(body: Record<string, any>, fields: string[]): void {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw ApiError.badRequest(`Missing required field: '${field}'`);
    }
  }
}
