import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Every /admin page: one sign-in, the admin top bar and the section sidebar. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
