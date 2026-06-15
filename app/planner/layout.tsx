import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Demo",
  description:
    "Try the Travel OS planner: build an itinerary, track your budget, and tick off your packing list. Your changes save automatically.",
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
