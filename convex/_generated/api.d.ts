/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts_d from "../accounts/d.js";
import type * as accounts_m from "../accounts/m.js";
import type * as accounts_q from "../accounts/q.js";
import type * as admin_d from "../admin/d.js";
import type * as admin_q from "../admin/q.js";
import type * as events_d from "../events/d.js";
import type * as history_d from "../history/d.js";
import type * as history_m from "../history/m.js";
import type * as history_q from "../history/q.js";
import type * as leagues_d from "../leagues/d.js";
import type * as leagues_q from "../leagues/q.js";
import type * as orders_d from "../orders/d.js";
import type * as orders_m from "../orders/m.js";
import type * as orders_q from "../orders/q.js";
import type * as paymentMethods_d from "../paymentMethods/d.js";
import type * as paymentMethods_m from "../paymentMethods/m.js";
import type * as paymentMethods_q from "../paymentMethods/q.js";
import type * as podiumAwards_d from "../podiumAwards/d.js";
import type * as podiumAwards_m from "../podiumAwards/m.js";
import type * as podiumAwards_q from "../podiumAwards/q.js";
import type * as registrations_d from "../registrations/d.js";
import type * as registrations_m from "../registrations/m.js";
import type * as registrations_q from "../registrations/q.js";
import type * as sponsorLeads_d from "../sponsorLeads/d.js";
import type * as sponsorLeads_m from "../sponsorLeads/m.js";
import type * as sponsorLeads_q from "../sponsorLeads/q.js";
import type * as subscriptions_d from "../subscriptions/d.js";
import type * as subscriptions_m from "../subscriptions/m.js";
import type * as subscriptions_policy from "../subscriptions/policy.js";
import type * as subscriptions_q from "../subscriptions/q.js";
import type * as tournaments_d from "../tournaments/d.js";
import type * as tournaments_m from "../tournaments/m.js";
import type * as tournaments_q from "../tournaments/q.js";
import type * as txns_d from "../txns/d.js";
import type * as txns_m from "../txns/m.js";
import type * as txns_q from "../txns/q.js";
import type * as users_d from "../users/d.js";
import type * as users_m from "../users/m.js";
import type * as users_q from "../users/q.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "accounts/d": typeof accounts_d;
  "accounts/m": typeof accounts_m;
  "accounts/q": typeof accounts_q;
  "admin/d": typeof admin_d;
  "admin/q": typeof admin_q;
  "events/d": typeof events_d;
  "history/d": typeof history_d;
  "history/m": typeof history_m;
  "history/q": typeof history_q;
  "leagues/d": typeof leagues_d;
  "leagues/q": typeof leagues_q;
  "orders/d": typeof orders_d;
  "orders/m": typeof orders_m;
  "orders/q": typeof orders_q;
  "paymentMethods/d": typeof paymentMethods_d;
  "paymentMethods/m": typeof paymentMethods_m;
  "paymentMethods/q": typeof paymentMethods_q;
  "podiumAwards/d": typeof podiumAwards_d;
  "podiumAwards/m": typeof podiumAwards_m;
  "podiumAwards/q": typeof podiumAwards_q;
  "registrations/d": typeof registrations_d;
  "registrations/m": typeof registrations_m;
  "registrations/q": typeof registrations_q;
  "sponsorLeads/d": typeof sponsorLeads_d;
  "sponsorLeads/m": typeof sponsorLeads_m;
  "sponsorLeads/q": typeof sponsorLeads_q;
  "subscriptions/d": typeof subscriptions_d;
  "subscriptions/m": typeof subscriptions_m;
  "subscriptions/policy": typeof subscriptions_policy;
  "subscriptions/q": typeof subscriptions_q;
  "tournaments/d": typeof tournaments_d;
  "tournaments/m": typeof tournaments_m;
  "tournaments/q": typeof tournaments_q;
  "txns/d": typeof txns_d;
  "txns/m": typeof txns_m;
  "txns/q": typeof txns_q;
  "users/d": typeof users_d;
  "users/m": typeof users_m;
  "users/q": typeof users_q;
  utils: typeof utils;
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
