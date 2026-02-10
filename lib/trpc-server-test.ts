// Simple tRPC client for server-side testing
import { appRouter } from '../server/routers';
import type { Request, Response } from 'express';

// Create a mock context for testing
function createMockContext() {
  const req = {
    headers: {},
    cookies: {},
  } as unknown as Request;

  const res = {
    cookie: () => {},
    clearCookie: () => {},
  } as unknown as Response;

  return { req, res, user: null };
}

// Create a caller that can invoke tRPC procedures directly
export const trpc = appRouter.createCaller(createMockContext());
