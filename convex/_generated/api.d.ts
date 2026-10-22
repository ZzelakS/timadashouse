/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAccounts from "../adminAccounts.js";
import type * as applePay from "../applePay.js";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as imagekit from "../imagekit.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as seedTimada from "../seedTimada.js";
import type * as services from "../services.js";
import type * as timada from "../timada.js";
import type * as timadaCatalogState from "../timadaCatalogState.js";
import type * as timadaStripe from "../timadaStripe.js";
import type * as training from "../training.js";
import type * as walletHttp from "../walletHttp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminAccounts: typeof adminAccounts;
  applePay: typeof applePay;
  appointments: typeof appointments;
  auth: typeof auth;
  http: typeof http;
  imagekit: typeof imagekit;
  payments: typeof payments;
  products: typeof products;
  seedTimada: typeof seedTimada;
  services: typeof services;
  timada: typeof timada;
  timadaCatalogState: typeof timadaCatalogState;
  timadaStripe: typeof timadaStripe;
  training: typeof training;
  walletHttp: typeof walletHttp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
