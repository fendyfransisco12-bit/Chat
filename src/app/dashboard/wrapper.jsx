"use client";

import dynamic from "next/dynamic";

const DashboardContent = dynamic(
  () => import("@/components/dashboard-content"),
  { ssr: false }
);

export default function DashboardWrapper() {
  return <DashboardContent />;
}
