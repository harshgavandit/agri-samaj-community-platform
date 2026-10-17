"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";
export default function AdminNavigation() {
  const path = usePathname();
  const { language } = useLanguage();
  if (path === "/admin/census") return null;
  return (
    <nav
      className="admin-workspace-nav"
      aria-label={
        language === "mr" ? "प्रशासकीय विभाग" : "Administration sections"
      }
    >
      {[
        ["/admin", "आढावा", "Overview"],
        ["/admin/community", "मजकूर व संकेतस्थळ", "Content & website"],
        ["/admin/businesses", "व्यवसाय", "Businesses"],
        ["/admin/announcements", "घडामोडी", "Announcements"],
        ["/admin/publications", "प्रकाशने", "Publications"],
        ["/admin/inquiries", "संदेश", "Inquiries"],
        ["/admin/categories", "श्रेणी", "Categories"],
        ["/admin/advertisements", "जाहिराती", "Advertisements"],
      ].map(([href, mr, en]) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
        >
          {language === "mr" ? mr : en}
        </Link>
      ))}
    </nav>
  );
}
