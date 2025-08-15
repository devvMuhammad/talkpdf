import { Metadata } from "next";
import UsagePage from "./usage";

export const metadata: Metadata = {
  title: "Usage",
  description: "View your usage and billing information for TalkPDF.",
}

export default function UsagePageWrapper() {
  return <UsagePage />
}