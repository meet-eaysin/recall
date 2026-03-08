/**
 * Shared types for ESM libraries to resolve ESM/CJS compatibility issues.
 * Using inline import types via 'import()' is the recommended way to reference ESM types
 * in a CommonJS environment without triggering 'require' calls that cause TS1479 errors
 * in strict environments like Vercel.
 */

/* eslint-disable @typescript-eslint/consistent-type-imports */

/**
 * Bridge for the 'jose' library types.
 */
export type JWTPayload = import('jose').JWTPayload;

/**
 * Bridge for the 'openid-client' library types.
 */
export type OpenIdClientModule = typeof import('openid-client');
