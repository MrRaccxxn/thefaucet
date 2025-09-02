// Core business logic package for the multichain faucet

// tRPC exports
export { appRouter, type AppRouter } from './trpc/router';
export { createTRPCContext, type Context } from './trpc/context';
export * from './trpc';

// Core functionality exports (to be implemented)
export * from './adapters';
export * from './balance';
export * from './rate-limiting';
export * from './chains';
export * from './auth';

// Version
export const CORE_VERSION = '0.0.1';
