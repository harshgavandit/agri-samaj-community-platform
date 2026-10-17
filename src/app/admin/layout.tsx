import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };
import AccessGate from "@/components/AccessGate";
import AdminNavigation from "@/components/AdminNavigation";
import { Suspense } from "react";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-8" role="status">
          Loading…
        </p>
      }
    >
      <AccessGate roles={["ADMIN"]}>
        <AdminNavigation />
        {children}
      </AccessGate>
    </Suspense>
  );
}
