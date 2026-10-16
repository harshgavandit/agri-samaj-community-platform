import { Language } from "./translations";

// Geographic & Administrative Dictionaries
export const DICT_LOCATIONS: Record<string, string> = {
  // Districts
  रायगड: "Raigad",
  ठाणे: "Thane",
  मुंबई: "Mumbai",
  "मुंबई उपनगर": "Mumbai Suburban",
  पालघर: "Palghar",
  पुणे: "Pune",
  नाशिक: "Nashik",
  रत्नागिरी: "Ratnagiri",
  सिंधुदुर्ग: "Sindhudurg",

  // Talukas & Major Towns
  पनवेल: "Panvel",
  उरण: "Uran",
  पेण: "Pen",
  अलिबाग: "Alibag",
  तळोजा: "Taloja",
  खारघर: "Kharghar",
  वाशी: "Vashi",
  "वाशी, नवी मुंबई": "Vashi, Navi Mumbai",
  "नवी मुंबई": "Navi Mumbai",
  ट्रॉम्बे: "Trombay",
  "ट्रॉम्बे, मुंबई": "Trombay, Mumbai",
  कुर्ला: "Kurla",
  कल्याण: "Kalyan",
  डोंबिवली: "Dombivli",
  भिवंडी: "Bhiwandi",
  वसई: "Vasai",
  विरार: "Virar",
  रोहा: "Roha",
  कर्जत: "Karjat",
  खालापूर: "Khalapur",
  माणगाव: "Mangaon",
  मुरूड: "Murud",
  महाड: "Mahad",
  पोलादपूर: "Poladpur",
  श्रीवर्धन: "Shrivardhan",
  म्हसळा: "Mhasla",
  सुधागड: "Sudhagad",
  तळा: "Tala",
  अंबरनाथ: "Ambernath",
  बदलापूर: "Badlapur",
  उल्हासनगर: "Ulhasnagar",
  मुरबाड: "Murbad",
  शहापूर: "Shahapur",
  डहाणू: "Dahanu",
  तलासरी: "Talasari",
  जवाहर: "Jawhar",
  मोखाडा: "Mokhada",
  वाडा: "Wada",
  विक्रमगड: "Vikramgad",
};

// Known Business Names
export const DICT_BUSINESS_NAMES: Record<string, string> = {
  "श्री कृपा इंजिनिअरिंग व फॅब्रिकेशन वर्क्स":
    "Shree Kripa Engineering & Fabrication Works",
  "पाटील अँड असोसिएट्स लिगल कन्सल्टन्सी":
    "Patil & Associates Legal Consultancy",
  "स्वस्तिक ॲग्रो प्रॉडक्ट्स व खत विक्री केंद्र":
    "Swastik Agro Products & Fertilizer Center",
  "ओमकार वातानुकूलन व इलेक्ट्रॉनिक्स सर्व्हिसेस":
    "Omkar AC & Electronics Services",
  "नवकार इन्फ्रास्ट्रक्चर व बिल्डर्स": "Navkar Infrastructure & Builders",
  "कला आर्ट्स व डिजिटल प्रिंटिंग प्रेस": "Kala Arts & Digital Printing Press",
};

// Known Owner Names
export const DICT_OWNER_NAMES: Record<string, string> = {
  "प्रशांत काशिनाथ म्हात्रे": "Prashant Kashinath Mhatre",
  "ॲड. निलेश गजानन पाटील": "Adv. Nilesh Gajanan Patil",
  "संजय बळीराम घरत": "Sanjay Baliram Gharat",
  "सचिन दत्तात्रय पाटील": "Sachin Dattatray Patil",
  "अविनाश मनोहर ठाकूर": "Avinash Manohar Thakur",
  "दीपक रमेश म्हात्रे": "Deepak Ramesh Mhatre",
  "सुभाष जनार्दन पाटील": "Subhash Janardan Patil",
  "सचिन बाळाराम पाटील": "Sachin Balaram Patil",
  "राहुल शांताराम म्हात्रे": "Rahul Shantaram Mhatre",
};

// Known Products & Services
export const DICT_PRODUCTS: Record<string, string> = {
  "एमएस व एसएस फॅब्रिकेशन, इंडस्ट्रियल शेड्स, स्टोरेज टँक्स, पाईपलाईन फिटिंग व टर्निंग जॉब्स":
    "MS & SS Fabrication, Industrial Sheds, Storage Tanks, Pipeline Fittings, and Precision Lathe Jobs",
  "जमीन संपादन भरपाई कायदेशीर सल्ला, रेरा नोंदणी, कंपनी करार, वारस नोंदी व दिवाणी खटले":
    "Land Acquisition Compensation Advisory, RERA Compliance, Corporate Joint Venture Contracts, and Civil Litigation",
  "एनपीके खते, सूक्ष्म पोषकद्रव्ये, गांडूळ खत, ठिबक सिंचन पाईप्स, फवारणी यंत्रे":
    "NPK Fertilizers, Micronutrients, Vermicompost, Drip Irrigation Kits, and Power Sprayers",
  "कमर्शियल व डोमेस्टिक स्प्लिट एसी, व्हीआरव्ही सिस्टीम, डक्टिंग, कोल्ड स्टोरेज युनिट्स, एएमसी सेवा":
    "Commercial & Domestic Split ACs, VRV Systems, Central Ducting, Cold Storage Units, and Annual Maintenance Contracts",
  "जेसीबी, पोकलेन भाड्याने देणे, आरएमसी काँक्रीट काम, रस्ते डांबरीकरण, इमारती बांधकाम":
    "JCB & Poclain Earthmovers on Lease, RMC Transit Mixtures, Asphalt Road Paving, and Residential Contracting",
  "पुस्तके, मासिके, लग्नपत्रिका, ब्रोशर्स, व्हिजिटिंग कार्ड्स, पॅकेजिंग बॉक्सेस, स्क्रीन प्रिंटिंग":
    "Commercial Offset Printing, Books, Magazines, Wedding Cards, Brochures, Visiting Cards, Packaging Boxes & Screen Printing",
  "सर्व प्रकारचे ऑफसेट प्रिंटिंग, डिजिटल फ्लेक्स प्रिंटिंग, लग्नपत्रिका, कॅलेंडर व पॅकेजिंग बॉक्सेस.":
    "All types of offset printing, digital flex printing, wedding invitation cards, corporate calendars, and packaging boxes.",
};

// Known Business Descriptions
export const DICT_DESCRIPTIONS: Record<string, string> = {
  "गेल्या १५ वर्षांपासून नवी मुंबई व उरण-पनवेल औद्योगिक पट्ट्यात दर्जेदार फॅब्रिकेशन आणि हेवी मशिनरी पार्ट्स उत्पादन.":
    "Over 15 years of delivering heavy precision parts and industrial structural fabrication across the Navi Mumbai and Uran-Panvel industrial corridor.",
  "सिडको, नैना व रायगड जिल्ह्यातील जमीन हक्क, प्रकल्पग्रस्त भरपाई व व्यावसायिक करारांवर निष्णात विधी सल्ला.":
    "Expert legal counsel on CIDCO, NAINA developments, land acquisition rights, and corporate agreements across Raigad and Thane.",
  "रायगड व ठाणे पट्ट्यातील बागायतदार व भातशेती शेतकऱ्यांना दर्जेदार खते, औषधे आणि आधुनिक शेतीचे मार्गदर्शन.":
    "Supplying certified organic fertilizers and precision irrigation supplies to horticulturists and paddy farmers across Konkan.",
  "नवी मुंबई, खारघर, पनवेल परिसरातील सर्व ब्रँड्सच्या एसी युनिट्सचे अधिकृत सेल्स व सर्व्हिस पार्टनर.":
    "Authorized sales and maintenance partners for major HVAC brands across Kharghar, Navi Mumbai, and Panvel.",
  "जेएनपीटी, उरण व द्रोणागिरी नोडमधील अग्रगण्य सिव्हिल इन्फ्रास्ट्रक्चर व कमर्शियल साइट डेव्हलपर्स.":
    "Premier civil infrastructure and commercial site contractors in the JNPT, Uran port zone, and Dronagiri node.",
  "आधुनिक फोर-कलर ऑफसेट मशिनरीसह सर्व प्रकारचे व्यावसायिक व सांस्कृतिक मुद्रण काम अचूकतेने पूर्ण.":
    "Complete commercial, institutional, and cultural printing powered by modern 4-color offset and digital flex machinery.",
};

// Known Addresses
export const DICT_ADDRESSES: Record<string, string> = {
  "दुकान क्र. ४, आगरी समाज संकुल, उरण नाका":
    "Shop No. 4, Agri Samaj Complex, Uran Naka",
  "ऑफिस क्र. ३०२, रीजन्सी प्लाझा, छत्रपती शिवाजी महाराज चौक":
    "Office No. 302, Regency Plaza, Chhatrapati Shivaji Maharaj Chowk",
  "मेन रोड, पेण-अलिबाग हायवे": "Main Road, Pen-Alibag Highway",
  "दुकान क्र. १२, शिवतीर्थ रेसिडेन्सी, सेक्टर २०, खारघर":
    "Shop No. 12, Shivtirth Residency, Sector 20, Kharghar",
  "प्लॉट क्र. १२, करंजा रोड, उरण": "Plot No. 12, Karanja Road, Uran",
  "गाळा क्र. ३, ताराबाई निवास, पावलीपाडा":
    "Unit No. 3, Tarabai Nivas, Pavlipada",
};

// Generic transliteration fallback for Devanagari text
export function transliterateDevanagari(text: string): string {
  if (!text) return "";
  const devanagariRegex = /[\u0900-\u097F]/;
  if (!devanagariRegex.test(text)) {
    return text; // Already Latin script
  }

  // Check direct dictionaries first
  if (DICT_LOCATIONS[text.trim()]) return DICT_LOCATIONS[text.trim()];
  if (DICT_BUSINESS_NAMES[text.trim()]) return DICT_BUSINESS_NAMES[text.trim()];
  if (DICT_OWNER_NAMES[text.trim()]) return DICT_OWNER_NAMES[text.trim()];
  if (DICT_PRODUCTS[text.trim()]) return DICT_PRODUCTS[text.trim()];
  if (DICT_DESCRIPTIONS[text.trim()]) return DICT_DESCRIPTIONS[text.trim()];
  if (DICT_ADDRESSES[text.trim()]) return DICT_ADDRESSES[text.trim()];

  // Replace common geographic keywords in text
  let result = text;
  for (const [mr, en] of Object.entries(DICT_LOCATIONS)) {
    result = result.split(mr).join(en);
  }

  return result;
}

export function localizeLocation(
  val?: string | null,
  lang: Language = "mr",
): string {
  if (!val) return "";
  if (lang === "mr") return val;
  return DICT_LOCATIONS[val.trim()] || transliterateDevanagari(val);
}

export interface LocalizedBusiness {
  id: string;
  refNumber: string;
  businessName: string;
  brandName?: string | null;
  brandLabel: string;
  ownerName: string;
  categoryName: string;
  productsServices: string;
  description?: string | null;
  subCategory?: string | null;
  establishedYear?: number | null;
  classification: string;
  classificationLabel: string;
  ownership: string;
  ownershipLabel: string;
  workNatureLabel: string;
  premisesLabel: string;
  factoryAddress?: string | null;
  officeAddress: string;
  officeCity: string;
  officeTaluka: string;
  officeDistrict: string;
  locationString: string;
  phone?: string | null;
  website?: string | null;
  isVerified: boolean;
  status: string;
  statusBadgeLabel: string;
}

export function getLocalizedBusiness(
  business: any,
  lang: Language,
): LocalizedBusiness {
  const isEn = lang === "en";

  // 1. Business Name
  let businessName = business.businessName;
  if (isEn) {
    businessName =
      business.businessNameEn ||
      DICT_BUSINESS_NAMES[business.businessName] ||
      (business.brandName && !/[\u0900-\u097F]/.test(business.brandName)
        ? business.brandName
        : "") ||
      transliterateDevanagari(business.businessName);
  }

  // 2. Owner Name
  let ownerName = business.ownerName;
  if (isEn) {
    ownerName =
      business.ownerNameEn ||
      DICT_OWNER_NAMES[business.ownerName] ||
      transliterateDevanagari(business.ownerName);
  }

  // 3. Category Name
  let categoryName = isEn ? "General" : "सामान्य";
  if (business.category) {
    categoryName = isEn ? business.category.nameEn : business.category.nameMr;
  }

  // 4. Products & Services
  let productsServices = business.productsServices;
  if (isEn) {
    productsServices =
      business.productsServicesEn ||
      DICT_PRODUCTS[business.productsServices] ||
      transliterateDevanagari(business.productsServices);
  }

  // 5. Description
  let description = business.description;
  if (isEn && business.description) {
    description =
      business.descriptionEn ||
      DICT_DESCRIPTIONS[business.description] ||
      transliterateDevanagari(business.description);
  }

  // 6. SubCategory
  let subCategory = business.subCategory;
  if (isEn && business.subCategory) {
    subCategory =
      business.subCategoryEn || transliterateDevanagari(business.subCategory);
  }

  // 7. Address & Locations
  const officeCity = isEn
    ? business.officeCityEn || localizeLocation(business.officeCity, "en")
    : business.officeCity;
  const officeTaluka = isEn
    ? business.officeTalukaEn || localizeLocation(business.officeTaluka, "en")
    : business.officeTaluka;
  const officeDistrict = isEn
    ? business.officeDistrictEn ||
      localizeLocation(business.officeDistrict, "en")
    : business.officeDistrict;
  const officeAddress = isEn
    ? business.officeAddressEn ||
      DICT_ADDRESSES[business.officeAddress] ||
      transliterateDevanagari(business.officeAddress)
    : business.officeAddress;

  // Format location string cleanly
  const locationParts = [officeCity, officeTaluka, officeDistrict].filter(
    Boolean,
  );
  const locationString = Array.from(new Set(locationParts)).join(", ");

  // 8. Classification
  const classificationMap: Record<string, { mr: string; en: string }> = {
    MANUFACTURER: { mr: "उत्पादक (Manufacturer)", en: "Manufacturer" },
    TRADER: { mr: "व्यापारी (Trader)", en: "Trader / Merchant" },
    CONTRACTOR: { mr: "कंत्राटदार (Contractor)", en: "Contractor" },
    PROFESSIONAL: {
      mr: "व्यावसायिक (Professional)",
      en: "Professional Service",
    },
    OTHER: { mr: "इतर", en: "Other" },
  };
  const cls = classificationMap[business.businessClassification] || {
    mr: business.businessClassification || "इतर",
    en: business.businessClassification || "Other",
  };
  const classificationLabel = isEn ? cls.en : cls.mr;

  // 9. Ownership
  const ownershipMap: Record<string, { mr: string; en: string }> = {
    PROPRIETORSHIP: {
      mr: "स्व:मालकी (Proprietorship)",
      en: "Sole Proprietorship",
    },
    PARTNERSHIP: { mr: "भागीदारी (Partnership)", en: "Partnership Firm" },
    PVT_LTD: { mr: "प्रा. लिमिटेड (Pvt Ltd)", en: "Pvt. Ltd. / Corporate" },
    OTHER: { mr: "इतर", en: "Other" },
  };
  const own = ownershipMap[business.ownershipType] || {
    mr: business.ownershipType || "स्व:मालकी",
    en: business.ownershipType || "Proprietorship",
  };
  const ownershipLabel = isEn ? own.en : own.mr;

  // 10. Work Nature
  const workMap: Record<string, { mr: string; en: string }> = {
    FULL_TIME: { mr: "पूर्णवेळ", en: "Full-Time" },
    PART_TIME: { mr: "अर्धवेळ", en: "Part-Time" },
    SEASONAL: { mr: "हंगामी", en: "Seasonal" },
  };
  const work = workMap[business.workNature] || {
    mr: "पूर्णवेळ",
    en: "Full-Time",
  };
  const workNatureLabel = isEn ? work.en : work.mr;

  // 11. Premises
  const premisesLabel =
    business.premisesOwnership === "OWNED"
      ? isEn
        ? "Owned Premises"
        : "स्वतःची जागा"
      : isEn
        ? "Rented / Leased"
        : "भाडेतत्त्वावर";

  // 12. Status
  const isVerified = business.status === "APPROVED";
  const statusMap: Record<string, { mr: string; en: string }> = {
    APPROVED: { mr: "मान्यताप्राप्त", en: "Approved" },
    PENDING: { mr: "पडताळणी प्रलंबित", en: "Pending Review" },
    REVISION_REQUIRED: { mr: "सुधारणा आवश्यक", en: "Revision Required" },
    REJECTED: { mr: "नामंजूर", en: "Rejected" },
    DRAFT: { mr: "मसुदा", en: "Draft" },
  };
  const stat = statusMap[business.status] || {
    mr: "नोंदणीकृत",
    en: "Registered",
  };
  const statusBadgeLabel = isEn ? stat.en : stat.mr;

  return {
    id: business.id,
    refNumber: business.refNumber,
    businessName,
    brandName: business.brandName,
    brandLabel: isEn ? "Brand:" : "ब्रँड:",
    ownerName,
    categoryName,
    productsServices,
    description,
    subCategory,
    establishedYear: business.establishedYear,
    classification: classificationLabel,
    classificationLabel,
    ownership: ownershipLabel,
    ownershipLabel,
    workNatureLabel,
    premisesLabel,
    factoryAddress:
      isEn && business.factoryAddress
        ? DICT_ADDRESSES[business.factoryAddress] ||
          transliterateDevanagari(business.factoryAddress)
        : business.factoryAddress,
    officeAddress,
    officeCity,
    officeTaluka,
    officeDistrict,
    locationString,
    phone: business.phone,
    website: business.website,
    isVerified,
    status: business.status,
    statusBadgeLabel,
  };
}
