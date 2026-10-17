-- Keep the public verification boundary beside the references, in both languages.
ALTER TABLE "CommunityContent" ADD COLUMN "sourceNoteMr" TEXT NOT NULL DEFAULT '', ADD COLUMN "sourceNoteEn" TEXT NOT NULL DEFAULT '';
UPDATE "CommunityContent" SET
  "sourceNoteEn" = 'Official source and indexed text checked on 18 October 2026. Direct access to this reference was intermittent during review.',
  "sourceNoteMr" = '१८ ऑक्टोबर २०२६ रोजी अधिकृत स्रोत आणि शोधात उपलब्ध मजकूर तपासला. पडताळणीदरम्यान या संदर्भाचे पान उघडण्यात अडथळे आले.'
WHERE "slug" IN ('aagri-community-identity', 'aagri-language-heritage', 'coastal-livelihoods-historical-record');
UPDATE "CommunityContent" SET "sources" = "sources" || '[{"label":"Thana District Gazetteer · 1882 · historical context","url":"https://www.gazetteers.maharashtra.gov.in/cultural.maharashtra.gov.in/english/gazetteer/Thana%20District/Thane-I/trade_crafts.html"},{"label":"Kolaba District Gazetteer · 1883 · historical context","url":"https://www.gazetteers.maharashtra.gov.in/cultural.maharashtra.gov.in/english/gazetteer/Kolaba%20District/population_husbandmen.html"}]'::jsonb WHERE "slug" = 'aagri-community-identity';
