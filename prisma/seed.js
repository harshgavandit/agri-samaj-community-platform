require("@next/env").loadEnvConfig(process.cwd());
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (
    !adminEmail ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail) ||
    !adminPassword ||
    adminPassword.length < 12 ||
    Buffer.byteLength(adminPassword) > 72 ||
    /change.?this|agrisamaj2026/i.test(adminPassword)
  ) {
    throw new Error(
      "Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of 12-72 bytes before seeding. Existing accounts are never overwritten.",
    );
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: process.env.ADMIN_NAME || "Central Administrator",
      role: "ADMIN",
    },
  });
  const categoriesData = [
    {
      slug: "construction-contracting",
      nameMr: "बांधकाम व ठेकेदारी",
      nameEn: "Construction & Contracting",
      descriptionMr:
        "सिव्हिल बांधकाम, सरकारी व खाजगी ठेकेदार, मटेरियल पुरवठादार",
      descriptionEn:
        "Civil construction, government & private contractors, materials",
      icon: "HardHat",
      order: 1,
    },
    {
      slug: "manufacturing-engineering",
      nameMr: "उत्पादन व अभियांत्रिकी",
      nameEn: "Manufacturing & Engineering",
      descriptionMr: "मशिनरी, फॅब्रिकेशन, स्पेअर पार्ट्स व उत्पादन युनिट्स",
      descriptionEn:
        "Machinery, fabrication, spare parts and manufacturing units",
      icon: "Factory",
      order: 2,
    },
    {
      slug: "it-computer-services",
      nameMr: "माहिती तंत्रज्ञान व संगणक सेवा",
      nameEn: "Computer & IT Services",
      descriptionMr: "सॉफ्टवेअर, हार्डवेअर, नेटवर्किंग व डिजिटल सोल्युशन्स",
      descriptionEn:
        "Software development, hardware, networking and digital solutions",
      icon: "Laptop",
      order: 3,
    },
    {
      slug: "agriculture-fertilizers",
      nameMr: "कृषी व खते",
      nameEn: "Agriculture & Fertilizers",
      descriptionMr: "सेंद्रिय खते, कृषी उपकरणे, रोपवाटिका व बियाणे",
      descriptionEn: "Organic fertilizers, farming tools, nurseries and seeds",
      icon: "Sprout",
      order: 4,
    },
    {
      slug: "legal-professional",
      nameMr: "कायदेशीर व व्यावसायिक सल्ला",
      nameEn: "Legal & Professional Services",
      descriptionMr: "वकील, सनदी लेखापाल (CA), कर सल्लागार व आर्किटेक्ट",
      descriptionEn:
        "Advocates, Chartered Accountants, Tax Advisors and Architects",
      icon: "Scale",
      order: 5,
    },
    {
      slug: "ac-refrigeration",
      nameMr: "वातानुकूलन व शीतकरण",
      nameEn: "Air Conditioning & Refrigeration",
      descriptionMr: "एसी विक्री, दुरुस्ती व वार्षिक देखभाल करार (AMC)",
      descriptionEn: "AC sales, commercial refrigeration, repair and AMC",
      icon: "AirVent",
      order: 6,
    },
    {
      slug: "printing-packaging",
      nameMr: "मुद्रण व पॅकेजिंग",
      nameEn: "Printing & Packaging",
      descriptionMr:
        "ऑफसेट, स्क्रीन प्रिंटिंग, डिजिटल मुद्रण व पॅकेजिंग बॉक्सेस",
      descriptionEn:
        "Offset, screen printing, digital prints and packaging materials",
      icon: "Printer",
      order: 7,
    },
    {
      slug: "trading-wholesale",
      nameMr: "व्यापार व घाऊक विक्री",
      nameEn: "Trading & Wholesale",
      descriptionMr: "घाऊक व किरकोळ व्यापारी, आयात-निर्यात, एजन्सी",
      descriptionEn:
        "Wholesale, retail merchants, supply and distribution agencies",
      icon: "ShoppingBag",
      order: 8,
    },
    {
      slug: "automobiles-transport",
      nameMr: "ऑटोमोबाईल व वाहतूक",
      nameEn: "Automobile & Logistics",
      descriptionMr:
        "वाहन दुरुस्ती, स्पेअर पार्ट्स, लॉजिस्टिक्स व ट्रान्सपोर्ट",
      descriptionEn:
        "Vehicle repairs, spare parts, transport and freight logistics",
      icon: "Truck",
      order: 9,
    },
    {
      slug: "advertising-media",
      nameMr: "जाहिरात व माध्यम",
      nameEn: "Advertising & Media",
      descriptionMr: "होर्डिंग्स, डिजिटल मार्केटिंग, ब्रँडिंग व डिझायनिंग",
      descriptionEn: "Signage, branding, creative design and digital marketing",
      icon: "Megaphone",
      order: 10,
    },
    {
      slug: "catering-hospitality",
      nameMr: "केटरिंग व आदरातिथ्य",
      nameEn: "Catering & Hospitality",
      descriptionMr: "समारंभ केटरर्स, मंडप डेकोरेटर्स, हॉटेल्स व हॉल",
      descriptionEn: "Event catering, banquets, mandap decoration and hotels",
      icon: "Utensils",
      order: 11,
    },
    {
      slug: "electrical-electronics",
      nameMr: "इलेक्ट्रिकल व इलेक्ट्रॉनिक्स",
      nameEn: "Electrical & Electronics",
      descriptionMr: "औद्योगिक वायरिंग, ट्रान्सफॉर्मर, सोलर पॅनेल्स व साधने",
      descriptionEn:
        "Industrial wiring, transformers, solar systems and electronics",
      icon: "Zap",
      order: 12,
    },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
  }
  console.log(`✅ Seeded ${categoriesData.length} business categories.`);

  console.log(
    "Configured administrator and business categories are ready. Existing records were preserved.",
  );
}
main()
  .catch(() => {
    console.error(
      "Seed failed: check administrator settings and database connectivity.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
