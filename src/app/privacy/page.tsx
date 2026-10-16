"use client";

import { useLanguage } from "@/components/LanguageContext";
import { AlertTriangle, FileText, Lock, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  const { language } = useLanguage();

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <div className="inline-flex items-center space-x-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {language === "mr"
              ? "अखिल आगरी समाज परिषद • कायदेशीर व गोपनीयता धोरण"
              : "Akhil Agri Samaj Parishad • Legal & Privacy Policy"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "गोपनीयता धोरण व वापर अटी"
            : "Privacy Policy & Terms of Use"}
        </h1>
        <p className="text-xs text-slate-600">
          {language === "mr"
            ? "अंतिम अद्यतन: ऑक्टोबर २०२६"
            : "Last updated: October 2026"}
        </p>
      </div>

      <div className="bg-white p-5 sm:p-7 rounded-xl border border-slate-200 shadow-sm space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-navy-950 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>
              १. माहिती संकलन व उद्योजक सहमती (Data Collection & Consent)
            </span>
          </h2>
          <p>
            {language === "mr"
              ? "आगरी समाज डिजिटल व्यासपीठावर व्यवसाय नोंदणी करताना उद्योजकांकडून संकलित केलेली माहिती केवळ अधिकृत व्यावसायिक डिरेक्टरीमध्ये प्रसिद्ध करण्यासाठी आणि B2B संपर्कासाठी वापरली जाते. उद्योजकांच्या स्पष्ट सहमतीशिवाय वैयक्तिक व संवेदनशील माहिती सार्वजनिक केली जात नाही."
              : "Data submitted during business registration is processed solely for public directory publication and authentic B2B networking with the entrepreneur’s explicit informed consent. Confidential operational details are protected."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-navy-950 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              २. समुदाय जनगणना व संशोधन डेटा संरक्षण (Census & Research Privacy)
            </span>
          </h2>
          <p>
            {language === "mr"
              ? 'ऐतिहासिक कागदपत्रांमध्ये नमूद असलेली "आगरी समाज जनगणना मोहीम" ही संशोधन आणि सामाजिक सांख्यिकीसाठी होती. चालू डिजिटल पोर्टलवर कोणत्याही कुटुंबाची वैयक्तिक नावे, खाजगी पत्ते किंवा गोपनीय समुदाय माहिती कधीही सार्वजनिक केली जाणार नाही. जनगणना ट्रॅकर मॉड्यूल केवळ अधिकृत प्रगणकांसाठी आणि सांख्यिकी सारांशापुरते मर्यादित आहे.'
              : "The Census campaign referenced in historical archives is intended for statistical and socio-economic research. Under no circumstances are individual family names, residential addresses, or private demographic identities published publicly. The restricted census tracker is limited to authorized enumerators for tally purposes only."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-navy-950 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>
              ३. माहिती सुधारणा व हटविण्याचा अधिकार (Right to Rectification &
              Deletion)
            </span>
          </h2>
          <p>
            {language === "mr"
              ? "नोंदणीकृत उद्योजक आपल्या प्रोफाइलमधील माहिती कधीही स्वतःच्या डॅशबोर्डवरून अद्ययावत करू शकतात किंवा डिरेक्टरीतून प्रोफाइल हटविण्यासाठी आमच्या मध्यवर्ती कार्यालयाशी संपर्क साधू शकतात."
              : "Registered entrepreneurs retain the right to update, modify, or request deletion of their business listing at any time through their member dashboard or by contacting the central office."}
          </p>
        </section>
      </div>
    </div>
  );
}
