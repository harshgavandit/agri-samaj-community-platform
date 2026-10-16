"use client";

import { Building2, Mail, MapPin, Phone, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";

export default function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-navy-950 text-slate-300 mt-auto border-t-4 border-amber-600">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Col 1: Identity & Legal Reg */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-navy-900 border border-amber-500 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-white text-base block leading-tight">
                  {language === "mr"
                    ? "अखिल आगरी समाज परिषद"
                    : "Akhil Aagri Samaj Parishad"}
                </span>
                <span className="text-xs text-amber-400">
                  {language === "mr"
                    ? "उद्योजक व विकास विभाग"
                    : "Entrepreneur & Development Wing"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {language === "mr"
                ? "आगरी समाजातील सर्व व्यावसायिक, उत्पादक, तंत्रज्ञ आणि कंत्राटदारांचे परस्परांशी व्यावसायिक संघटन घडवून आणणारा अधिकृत डिजिटल मंच."
                : "The official digital platform fostering commercial collaboration among Agri community entrepreneurs, manufacturers, contractors, and professionals."}
            </p>

            <div className="text-[11px] bg-navy-900 p-2.5 rounded border border-navy-800 text-slate-400 space-y-1">
              <div>
                <strong className="text-slate-300">
                  {language === "mr" ? "पब्लिक ट्रस्ट:" : "Public Trust:"}
                </strong>{" "}
                {language === "mr"
                  ? "एफ १६२५७ (मुंबई) १९९३"
                  : "F-16257 (Mumbai) 1993"}
              </div>
              <div>
                <strong className="text-slate-300">
                  {language === "mr" ? "सोसायटी ॲक्ट:" : "Society Act:"}
                </strong>{" "}
                {language === "mr"
                  ? "जी.बी.बी.एस.डी. ८०६ (मुंबई) १९९३"
                  : "G.B.B.S.D. 806 (Mumbai) 1993"}
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">
              {language === "mr" ? "महत्त्वाचे दुवे" : "Quick Links"}
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/directory" className="hover:text-white transition">
                  {t.navDirectory}
                </Link>
              </li>
              <li>
                <Link
                  href="/register-business"
                  className="hover:text-amber-400 transition font-medium text-amber-300"
                >
                  {t.navRegisterBusiness}
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="hover:text-white transition">
                  {t.navAdvertising}
                </Link>
              </li>
              <li>
                <Link
                  href="/publications"
                  className="hover:text-white transition"
                >
                  {t.navPublications}
                </Link>
              </li>
              <li>
                <Link
                  href="/initiatives"
                  className="hover:text-white transition"
                >
                  {t.navInitiatives}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  {language === "mr"
                    ? "गोपनीयता धोरण व अटी"
                    : "Privacy Policy & Terms"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Central Office (Panvel) */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">
              {t.panvelOfficeTitle}
            </h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{t.panvelAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t.panvelPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>contact@agrisamaj.org</span>
              </div>
            </div>
          </div>

          {/* Col 4: Branch Office (Trombay, Mumbai) */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">
              {t.trombayOfficeTitle}
            </h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{t.trombayAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t.trombayPhone}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-navy-800">
                <div className="text-[11px] text-amber-300 font-medium">
                  {language === "mr"
                    ? "मुखपत्र: मासिक आगरी दर्पण"
                    : "Official Organ: Monthly Agri Darpan"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {language === "mr"
                    ? "वधु-वर सूचक मंडळ व समाज प्रबोधन"
                    : "Matrimonial Bureau & Community Awakening"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Community Clarification Notice */}
        <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 mb-6 text-xs text-slate-400 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">
              {language === "mr" ? "महत्त्वाची नोंद:" : "Important Notice:"}
            </strong>{" "}
            {language === "mr"
              ? "आगरी समाज हा सामाजिक समुदाय असून केवळ शेती व्यवसाय दर्शवत नाही. हे व्यासपीठ सर्व उद्योग, व्यापार, उत्पादन, तंत्रज्ञान व सेवा क्षेत्रांतील आगरी समाजातील व्यावसायिकांचे प्रतिनिधित्व करते."
              : "Agri Samaj refers to the community, not exclusively to agriculture. This platform represents entrepreneurs, community initiatives, organizations, and services across multiple modern industries."}
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>{t.copyright}</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <Link href="/privacy" className="hover:text-slate-400 transition">
              {language === "mr" ? "गोपनीयता" : "Privacy"}
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-400 transition">
              {language === "mr" ? "संपर्क" : "Contact"}
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-400 transition">
              {language === "mr" ? "प्रशासक लॉगिन" : "Admin Login"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
