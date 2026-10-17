"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { useLanguage } from "./LanguageContext";
export default function Footer() {
  const { language } = useLanguage();
  const mr = language === "mr";
  const [contactEmail, setContactEmail] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings?.contactEmail)
          setContactEmail(data.settings.contactEmail);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <footer className="community-footer">
      <div className="footer-inner">
        <div className="footer-columns">
          <div>
            <Link className="brand-name" href="/">
              {mr ? "आगरी समाज" : "Aagri Samaj"}
            </Link>
            <p>
              {mr
                ? "आपली संस्कृती जपणारे, उद्योजकांना जोडणारे आणि पुढच्या पिढीसाठी उपयुक्त माहिती एकत्र आणणारे समुदाय व्यासपीठ."
                : "A community platform celebrating our heritage, connecting entrepreneurs and bringing useful information to the next generation."}
            </p>
            <span className="eyebrow">
              {mr ? "एकत्र, पुढे." : "FORWARD, TOGETHER."}
            </span>
          </div>
          <div>
            <h2>{mr ? "आपला समुदाय" : "Our community"}</h2>
            <ul>
              {[
                ["/about", "आपला समाज", "About the community"],
                ["/culture", "संस्कृती व वारसा", "Culture & heritage"],
                ["/news", "बातम्या व कार्यक्रम", "News & events"],
                ["/initiatives", "उपक्रम", "Initiatives"],
                ["/publications", "डिजिटल प्रकाशने", "Digital publications"],
              ].map(([url, a, b]) => (
                <li key={url}>
                  <Link href={url}>{mr ? a : b}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>{mr ? "उपयुक्त दुवे" : "Useful links"}</h2>
            <ul>
              {[
                ["/directory", "उद्योजक डिरेक्टरी", "Business Directory"],
                ["/register-business", "व्यवसाय नोंदणी", "Register Business"],
                ["/resources", "शिक्षण व साधने", "Education & resources"],
                [
                  "/advertise",
                  "जाहिरात व प्रायोजकत्व",
                  "Advertising & Sponsorship",
                ],
                ["/dashboard", "माझे खाते", "My dashboard"],
              ].map(([url, a, b]) => (
                <li key={url}>
                  <Link href={url}>{mr ? a : b}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>{mr ? "आपला सहभाग" : "Be part of the story"}</h2>
            <p>
              {mr
                ? "माहिती सुचवा, अभिप्राय कळवा किंवा प्रकाशनासाठी विश्वासार्ह स्रोत पाठवा."
                : "Suggest a resource, share feedback or send a reliable source for publication."}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm"
            >
              {mr ? "आमच्याशी संपर्क साधा" : "Contact the platform team"}
              <ArrowUpRight size={17} />
            </Link>
            {contactEmail && (
              <a
                className="inline-flex items-center gap-2 text-sm mt-3 break-all"
                href={"mailto:" + contactEmail}
              >
                <Mail size={15} />
                {contactEmail}
              </a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            {mr
              ? "© " +
                new Date().getFullYear() +
                " आगरी समाज समुदाय व्यासपीठ. ऐतिहासिक संदर्भांमध्ये नमूद संस्थांशी अधिकृत संलग्नता गृहित धरू नये. खासगी व्यवसाय कागदपत्रे व जनगणना माहिती सार्वजनिक केली जात नाही."
              : "© " +
                new Date().getFullYear() +
                " Aagri Samaj Community Platform. Historical references do not establish official affiliation with a named institution. Private business documents and census information are not published."}
          </p>
          <div className="flex gap-5 shrink-0">
            <Link href="/privacy">{mr ? "गोपनीयता" : "Privacy"}</Link>
            <Link href="/login">{mr ? "लॉगिन" : "Login"}</Link>
            <Link href="/admin">{mr ? "प्रशासन" : "Admin"}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
