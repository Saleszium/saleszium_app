import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saleszium - Your One Stop Solution",
  description:
    "Saleszium is your one-stop solution for all your business needs, offering a wide range of services to help you succeed.",
};

export default function AutomateLayout({
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
