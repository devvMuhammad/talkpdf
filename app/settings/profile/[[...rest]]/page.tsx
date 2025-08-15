import { UserProfile } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile information and account details for TalkPDF.",
};

export default function ProfilePage() {
  return <UserProfile />
}
