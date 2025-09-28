"use client";
import { usePathname } from "next/navigation";
import TopBanner from "./layout/TopBanner";
import Header from "./layout/Header";
import Footer from "./layout/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBanner />
      <Header variant={isLoginPage ? "minimal" : "default"} />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
