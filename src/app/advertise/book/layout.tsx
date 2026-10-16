import AccessGate from "@/components/AccessGate";
import { Suspense } from "react";
export default function BookingLayout({
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
      <AccessGate>{children}</AccessGate>
    </Suspense>
  );
}
