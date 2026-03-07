import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Media Campaigns - Saleszium",
  description:
    "Manage your social media campaigns across LinkedIn and other platforms.",
};

export default function SocialMediaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
