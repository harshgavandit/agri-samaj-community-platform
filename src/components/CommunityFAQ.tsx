"use client";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";
export default function CommunityFAQ() {
  const { language } = useLanguage();
  const mr = language === "mr";
  const questions = [
    [
      "व्यवसाय शोधण्यासाठी खाते आवश्यक आहे का?",
      "Do I need an account to find a business?",
      "नाही. प्रकाशित व्यवसाय यादी पाहणे आणि शोधणे सर्वांसाठी खुले आहे. व्यवसाय नोंदणी व स्वतःच्या नोंदी व्यवस्थापित करण्यासाठी खाते आवश्यक आहे.",
      "No. Anyone can browse and search published listings. An account is needed to register a business and manage your own applications.",
    ],
    [
      "माझा व्यवसाय यादीत कसा येईल?",
      "How can I add my business?",
      "खाते तयार करा, व्यवसाय नोंदणी अर्ज भरा आणि तपासणीसाठी पाठवा. मसुदा जतन करून नंतर पूर्ण करता येतो. प्रशासकाच्या मंजुरीनंतरच नोंद सार्वजनिक होते.",
      "Create an account, complete the business registration form and submit it for review. You can save a draft and return later. A listing becomes public after administrator approval.",
    ],
    [
      "शिष्यवृत्ती किंवा नोकरीसाठी येथे अर्ज करता येतो का?",
      "Can I apply for scholarships or jobs here?",
      "आम्ही अधिकृत सार्वजनिक साधनांचे संदर्भ देतो. अर्ज संबंधित अधिकृत संकेतस्थळावर करावा. कोणतीही शिष्यवृत्ती, नोकरी किंवा आर्थिक सहाय्य मिळण्याची हमी दिली जात नाही.",
      "We link to official public resources. Apply through the responsible authority’s website. Listing a resource does not guarantee a scholarship, job or financial assistance.",
    ],
    [
      "परंपरा, यशोगाथा किंवा कार्यक्रम कसा सुचवू?",
      "How can I suggest a tradition, achievement or event?",
      "संपर्क फॉर्मद्वारे माहिती, विश्वासार्ह स्रोत आणि प्रकाशनाची परवानगी पाठवा. वैयक्तिक किंवा संवेदनशील कागदपत्रे संदेशात पाठवू नका.",
      "Use the contact form to share details, supporting sources and publication permission. Do not include private or sensitive documents in your message.",
    ],
  ];
  return (
    <section className="faq-section">
      <div>
        <span className="eyebrow">
          {mr ? "सुरुवात इथून करा" : "A HELPFUL PLACE TO START"}
        </span>
        <h2>
          {mr ? "तुमचे प्रश्न, सोपी उत्तरे." : "Your questions, answered."}
        </h2>
        <p>
          {mr ? "आणखी मदत हवी आहे?" : "Need a little more help?"}{" "}
          <Link href="/contact">
            {mr ? "आमच्याशी संपर्क साधा" : "Get in touch"}
          </Link>
        </p>
      </div>
      <div>
        {questions.map(([qm, qe, am, ae]) => (
          <details key={qe}>
            <summary>{mr ? qm : qe}</summary>
            <p>{mr ? am : ae}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
