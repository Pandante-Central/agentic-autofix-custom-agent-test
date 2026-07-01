import { NextFunction, Request, Response } from 'express';

// VULN: A10 Mishandling of Exceptional Conditions - CWE-209 Generation of
// Error Message Containing Sensitive Information
// The full error (including stack trace) is serialized back to the client,
// leaking internal implementation details that aid further attacks.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
}
