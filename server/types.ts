import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    guestUserId?: number;
    role?: string;
  }
}