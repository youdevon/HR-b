import { redirect } from "next/navigation";
import { RECORD_KEEPING_UI_ENABLED } from "@/lib/features/record-keeping-ui";

export default function RecordsModuleLayout({ children }: { children: React.ReactNode }) {
  if (!RECORD_KEEPING_UI_ENABLED) {
    redirect("/dashboard");
  }
  return children;
}
