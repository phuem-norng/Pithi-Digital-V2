/**
 * JWT Payload interface
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: 'USER' | 'ADMIN';
  iat?: number;
  exp?: number;
}

/**
 * Authorization request with user info
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
