/**
 * Client top bar (`TopbarClient`). `user` comes from the dashboard `layout`, which loads
 * auth once via `getDashboardSession` — this module does not call Supabase.
 */
export { default, type TopbarUserProps } from "./topbar-client";
