/**
 * Server-side types that need to be shared with the client.
 * This file re-exports types from the server package without importing server code.
 */

// Re-export AppRouter type from server
// Note: This creates a type-only dependency, no runtime code is imported
export type { AppRouter } from "@awaken/server/routers";
