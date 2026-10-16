"use client";

import { useLanguage } from "@/components/LanguageContext";
import { Building2, HelpCircle } from "lucide-react";

export default function InitiativesPage() {
  const { language } = useLanguage();

  const initiatives = [
    {
      titleMr: "आगरी उद्योजक डिरेक्टरी व B2B नेटवर्किंग",
      titleEn: "Agri Business Directory & B2B Synergies",
      badgeMr: "व्यावसायिक समन्वय",
      badgeEn: "Commerce & Industry",
      descMr:
        "२००६ आणि २०१२ मध्ये प्रकाशित ऐतिहासिक डिरेक्टरीचा डिजिटल विस्तार. कच्चा माल पुरवठादार, उत्पादक, वितरक आणि ग्राहकांमध्ये थेट व्यावसायिक देवाणघेवाण घडवून आणणे.",
      descEn:
        "Digital successor to the 2006 & 2012 publications, fostering direct procurement linkages among community suppliers, manufacturers, contractors, and buyers.",
    },
    {
      titleMr: 'मासिक मुखपत्र: "आगरी दर्पण"',
      titleEn: 'Monthly Journal: "Agri Darpan"',
      badgeMr: "वैचारिक प्रबोधन",
      badgeEn: "Official Media",
      descMr:
        "परिषदेचे अधिकृत मासिक मुखपत्र. समाजातील सामाजिक, शैक्षणिक, सांस्कृतिक व आर्थिक प्रश्नांवर जनजागरण आणि यशस्वी उद्योजकांच्या यशोगाथा.",
      descEn:
        "Official monthly organ dedicated to public awareness, educational guidance, cultural enrichment, and highlighting pioneer entrepreneurs.",
    },
    {
      titleMr: "आगरी समाज जनगणना मोहीम (संशोधन व अभ्यास)",
      titleEn: "Agri Samaj Census & Demographic Survey",
      badgeMr: "सामाजिक सांख्यिकी",
      badgeEn: "Research & Survey",
      descMr:
        "समाजातील कुटुंबे, व्यावसायिक, सुशिक्षित आणि बेरोजगार तरुणांची अधिकृत आकडेवारी गोळा करण्यासाठी राबविलेली व्यापक मोहीम.",
      descEn:
        "Comprehensive demographic data campaign aimed at identifying households, trade skills, educational levels, and youth employment requirements.",
    },
    {
      titleMr: "युवा उद्योग मार्गदर्शन व कौशल्य विकास",
      titleEn: "Youth Entrepreneurship Mentorship",
      badgeMr: "युवक सक्षमीकरण",
      badgeEn: "Youth Incubation",
      descMr:
        "समाजातील उच्चशिक्षित व पदवीधर तरुणांना नोकरीच्या पलीकडे जाऊन स्वतःचे उद्योग व स्टार्टअप सुरू करण्यासाठी ज्येष्ठ उद्योजकांचे थेट मार्गदर्शन.",
      descEn:
        "Workshops and incubation guidance connecting seasoned industry veterans with ambitious educated youth to build sustainable ventures.",
    },
    {
      titleMr: "प्रकल्पग्रस्त व स्थानिक विकास समन्वय",
      titleEn: "Project-Affected Communities & Economic Synergy",
      badgeMr: "सामाजिक न्याय",
      badgeEn: "Community Welfare",
      descMr:
        "सिडको, जेएनपीटी, एमआयडीसी व नवी मुंबई विमानतळ परिसरातील प्रकल्पग्रस्त स्थानिक आगरी बांधवांच्या आर्थिक व व्यावसायिक पुनर्वसनासाठी विचारमंथन.",
      descEn:
        "Advocacy and economic inclusion for project-affected landholders across CIDCO, JNPT, and industrial development corridors.",
    },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <div className="inline-flex items-center space-x-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded">
          <Building2 className="w-3.5 h-3.5" />
          <span>
            {language === "mr"
              ? "अखिल आगरी समाज परिषद • इतिहास व उपक्रम"
              : "Akhil Aagri Samaj Parishad • Heritage & Initiatives"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
          {language === "mr"
            ? "सामाजिक व आर्थिक उपक्रमांचा इतिहास"
            : "Institutional Initiatives & Heritage"}
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
          {language === "mr"
            ? "१९९३ पासून अखिल आगरी समाज परिषद समाजाच्या सर्वांगीण विकासासाठी कार्यरत आहे. शेती, व्यापार, उत्पादन आणि आधुनिक तंत्रज्ञान अशा सर्व क्षेत्रांत आगरी समाजाने घेतलेली झेप आणि संस्थेचे ऐतिहासिक योगदान येथे अधोरेखित केले आहे."
            : "Since 1993, Akhil Aagri Samaj Parishad has worked towards the holistic empowerment of the community. This portal traces historic milestones and current missions across modern industry sectors."}
        </p>
      </div>

      {/* Grid of Initiatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initiatives.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {language === "mr" ? item.badgeMr : item.badgeEn}
              </span>
              <h3 className="text-lg font-bold text-navy-950 leading-snug">
                {language === "mr" ? item.titleMr : item.titleEn}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === "mr" ? item.descMr : item.descEn}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
              <span>
                {language === "mr" ? "उपक्रम तपशील" : "Initiative Details"}
              </span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Historic Context Note */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-600">
        <h4 className="font-bold text-navy-950 flex items-center space-x-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>
            {language === "mr"
              ? "प्रशासकीय पुष्टीकरण नोंद"
              : "Institutional Relationship & Program Status Note"}
          </span>
        </h4>
        <p className="leading-relaxed">
          {language === "mr"
            ? 'ऐतिहासिक कागदपत्रांमध्ये "अखिल आगरी समाज परिषद" व "आगरी समाज जनगणना मोहीम" यांचा उल्लेख आहे. चालू अधिकृत संस्थात्मक पुनर्रचना आणि उपक्रमांच्या प्रत्यक्ष स्थितीची माहिती वेळोवेळी प्रशासकीय समितीमार्फत अद्ययावत केली जाते.'
            : "The historical records document the initiatives of Akhil Aagri Samaj Parishad and the Census Campaign. Current institutional alignment, active committee mandates, and future programs are maintained through verified administrative reviews."}
        </p>
      </div>
    </div>
  );
}
