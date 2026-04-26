import { redirect } from "next/navigation";
import { getDashboardSession, getFirstAccessibleModuleHref } from "@/lib/auth/guards";

export default async function HomePage() {
  const auth = await getDashboardSession();
  if (!auth) redirect("/login");
  const href = getFirstAccessibleModuleHref(auth.profile, auth.permissions);
  redirect(href ?? "/access-denied");
}
