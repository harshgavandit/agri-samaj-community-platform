import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
} from "../src/lib/auth";
import { generateRefNumber, formatCurrency } from "../src/lib/utils";
import {
  registerSchema,
  businessSchema,
  bookingSchema,
  censusSchema,
  website,
} from "../src/lib/validation";
import { publicBusiness } from "../src/lib/business";
import { detectMime } from "../src/lib/uploads";
import { HttpError, apiError, readJson } from "../src/lib/http";
import { z } from "zod";
import { translations } from "../src/lib/translations";
process.env.JWT_SECRET = randomBytes(48).toString("hex");
test("password hashes verify the correct password only", async () => {
  const hash = await hashPassword("Unique password 123!");
  assert(await comparePassword("Unique password 123!", hash));
  assert.equal(await comparePassword("wrong", hash), false);
});
test("actual session tokens reject tampering and secret changes", () => {
  const payload = {
    userId: "unit",
    email: "unit@example.test",
    name: "Unit",
    role: "MEMBER" as const,
  };
  const token = signToken(payload);
  assert.equal(verifyToken(token)?.userId, "unit");
  assert.equal(verifyToken(token + "x"), null);
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(48).toString("hex");
  assert.equal(verifyToken(token), null);
  process.env.JWT_SECRET = secret;
});
test("auth fails closed without a safe secret", () => {
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "";
  assert.throws(() =>
    signToken({ userId: "x", email: "x@x.test", name: "x", role: "ADMIN" }),
  );
  process.env.JWT_SECRET = secret;
});
test("registration validates names, normalized emails, password length and byte limit", () => {
  assert(
    !registerSchema.safeParse({ name: " ", email: "bad", password: "short" })
      .success,
  );
  const valid = registerSchema.parse({
    name: " Member ",
    email: "USER@EXAMPLE.TEST",
    password: "12characters!",
  });
  assert.equal(valid.email, "user@example.test");
  assert(
    !registerSchema.safeParse({ ...valid, password: "अ".repeat(30) }).success,
  );
});
test("business drafts accept incomplete content but submissions require terms and addresses", () => {
  assert(
    businessSchema.safeParse({ categoryId: "category", isDraft: true }).success,
  );
  assert(
    !businessSchema.safeParse({
      categoryId: "category",
      isDraft: false,
      termsAccepted: false,
    }).success,
  );
  assert(
    !businessSchema.safeParse({
      categoryId: "category",
      isDraft: true,
      employeeCountFemale: "-1",
    }).success,
  );
  assert(
    !businessSchema.safeParse({
      categoryId: "category",
      isDraft: true,
      isAddressPublic: "false",
    }).success,
  );
});
test("numeric validation rejects NaN, decimals in counts and future years", () => {
  for (const fields of [
    { areaSqm: "NaN" },
    { employeeCountMale: "1.5" },
    { establishedYear: "9999" },
  ])
    assert(
      !businessSchema.safeParse({ categoryId: "c", isDraft: true, ...fields })
        .success,
    );
});
test("unsafe links and forged upload paths are rejected", () => {
  assert(!website.safeParse("javascript:alert(1)").success);
  assert(
    !businessSchema.safeParse({
      categoryId: "c",
      isDraft: true,
      documentUrl: "https://attacker.test/doc.pdf",
    }).success,
  );
});
test("ad schema rejects missing fields and arbitrary payment methods", () => {
  assert(!bookingSchema.safeParse({}).success);
  assert(
    !bookingSchema.safeParse({
      packageId: "p",
      advertiserName: "A",
      phone: "9999999999",
      email: "a@example.test",
      adTextContent: "Text",
      paymentMethod: "AUTO_VERIFIED",
    }).success,
  );
});
test("census rejects impossible counts and overallocated questionnaires", () => {
  const base = {
    enumeratorNo: "E1",
    surveyorName: "Surveyor",
    divisionName: "Test",
    taluka: "Test",
    district: "Test",
    pincode: "410206",
    totalHouses: "100",
    agriHouses: "80",
  };
  assert(censusSchema.safeParse(base).success);
  assert(!censusSchema.safeParse({ ...base, agriHouses: "101" }).success);
  assert(
    !censusSchema.safeParse({
      ...base,
      questionnairesReceivedFrom: "1",
      questionnairesReceivedTo: "10",
      questionnairesUsed: "11",
    }).success,
  );
});
test("public projection never leaks private documents or hidden addresses", () => {
  const result = publicBusiness({
    id: "b",
    status: "APPROVED",
    isAddressPublic: false,
    officeAddress: "PRIVATE",
    documentUrl: "/private",
    ownerPhone: "PRIVATE",
    adminNotes: "PRIVATE",
    userId: "PRIVATE",
    website: "javascript:alert(1)",
  } as never);
  assert(!("documentUrl" in result));
  assert(!("adminNotes" in result));
  assert(!("userId" in result));
  assert(!("ownerPhone" in result));
  assert(!("officeAddress" in result));
  assert.equal(result.website, null);
});
test("uploaded bytes must match supported file signatures", () => {
  assert.equal(detectMime(Buffer.from("<html>unsafe</html>")), null);
  assert.equal(detectMime(Buffer.from("%PDF-1.4\n")), "application/pdf");
  assert.equal(
    detectMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
});
test("reference generation has high collision resistance and organizational prefixes", () => {
  const refs = Array.from({ length: 10000 }, () => generateRefNumber());
  assert.equal(new Set(refs).size, refs.length);
  assert.match(refs[0], /^AASP-UDY-\d{4}-[A-F0-9]{16}$/);
  assert(formatCurrency(25000).includes("25,000"));
});
test("all localization keys match between Marathi and English", () => {
  assert.deepEqual(
    Object.keys(translations.mr).sort(),
    Object.keys(translations.en).sort(),
  );
});
test("JSON errors, size limits and error responses use safe status codes", async () => {
  await assert.rejects(
    readJson(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
      z.object({}),
    ),
    (e: unknown) => e instanceof HttpError && e.status === 400,
  );
  const response = apiError(new Error("private database details"));
  assert.equal(response.status, 500);
  assert(!(await response.text()).includes("private database"));
  assert.equal(apiError(new HttpError(403, "Denied")).status, 403);
});

test("currency display preserves paise rather than rounding a quoted price", () => {
  assert(formatCurrency(1200.75).includes("1,200.75"));
});
