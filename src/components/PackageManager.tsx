"use client";
import RecordManager from "./RecordManager";
import { useLanguage } from "./LanguageContext";
export default function PackageManager() {
  const { language } = useLanguage();
  return (
    <RecordManager
      endpoint="/api/admin/packages"
      title={
        language === "mr"
          ? "जाहिरात दरपत्रक व्यवस्थापन"
          : "Advertisement rate management"
      }
      defaults={{
        id: "",
        code: "",
        nameMr: "",
        nameEn: "",
        price: "",
        dimensions: "",
        placementType: "FULL_PAGE",
        colorType: "COLOR",
        isActive: false,
      }}
      fields={[
        { key: "code", mr: "पॅकेज कोड", en: "Package code" },
        { key: "nameMr", mr: "नाव (मराठी)", en: "Name (Marathi)" },
        { key: "nameEn", mr: "नाव (इंग्रजी)", en: "Name (English)" },
        { key: "price", mr: "दर (रुपये)", en: "Price (INR)", type: "number" },
        { key: "dimensions", mr: "आकारमान", en: "Dimensions" },
        {
          key: "placementType",
          mr: "जाहिरात प्रकार",
          en: "Placement",
          options: [
            "COVER_BACK",
            "COVER_INNER_FRONT",
            "COVER_INNER_BACK",
            "WELCOME_PAGE",
            "FULL_PAGE",
            "HALF_PAGE",
            "QUARTER_PAGE",
            "EIGHTH_PAGE",
            "DIGITAL_BANNER",
          ],
        },
        {
          key: "colorType",
          mr: "रंग",
          en: "Color",
          options: ["COLOR", "MONOCHROME"],
        },
        {
          key: "isActive",
          mr: "नोंदणीसाठी उपलब्ध",
          en: "Available for booking",
          type: "checkbox",
        },
      ]}
    />
  );
}
