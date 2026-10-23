"use client";

import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { getLocalizedBusiness } from "@/lib/localize";
import { useLanguage } from "./LanguageContext";
import type { DirectoryBusiness } from "./useBusinessShortlist";
import styles from "./BusinessCard.module.css";

interface BusinessCardProps {
  business: DirectoryBusiness;
  saved?: boolean;
  savePending?: boolean;
  saveDisabled?: boolean;
  onSave?: (businessId: string) => void;
}

export default function BusinessCard({
  business,
  saved = false,
  savePending = false,
  saveDisabled = false,
  onSave,
}: BusinessCardProps) {
  const { language, t } = useLanguage();
  const mr = language === "mr";
  const loc = getLocalizedBusiness(business, language);
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.avatar} aria-hidden="true">
          {Array.from(loc.businessName)[0]}
        </span>
        <div>
          <p className={styles.category}>{loc.categoryName}</p>
          {loc.isVerified && (
            <span
              className={styles.approved}
              title={
                mr
                  ? "मंचाच्या प्रशासकाने नोंद मंजूर केली आहे. ही शासकीय मान्यता नाही."
                  : "Listing approved by a platform administrator. This is not government certification."
              }
            >
              <CheckCircle2 size={13} aria-hidden="true" />
              {t.verifiedBadge}
            </span>
          )}
        </div>
        {onSave && (
          <button
            type="button"
            className={styles.save}
            disabled={savePending || saveDisabled}
            aria-pressed={saved}
            aria-label={
              saved
                ? mr
                  ? `${loc.businessName} जतन केलेल्यांतून काढा`
                  : `Remove ${loc.businessName} from saved businesses`
                : mr
                  ? `${loc.businessName} जतन करा`
                  : `Save ${loc.businessName}`
            }
            onClick={() => onSave(loc.id)}
          >
            {savePending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Bookmark
                size={17}
                fill={saved ? "currentColor" : "none"}
                aria-hidden="true"
              />
            )}
          </button>
        )}
      </div>
      <h3 className={styles.name}>{loc.businessName}</h3>
      {loc.brandName && (
        <p className={styles.brand}>
          {loc.brandLabel} {loc.brandName}
        </p>
      )}
      <p className={styles.owner}>
        {loc.ownerName}
        {loc.establishedYear
          ? ` · ${t.establishedIn} ${loc.establishedYear}`
          : ""}
      </p>
      <div>
        <span className={styles.classification}>{loc.classificationLabel}</span>
      </div>
      <p className={styles.description}>{loc.productsServices}</p>
      <div className={styles.location}>
        <MapPin size={15} aria-hidden="true" />
        <span>{loc.locationString}</span>
      </div>
      <div className={styles.actions}>
        {loc.phone ? (
          <a className={styles.phone} href={`tel:${loc.phone}`}>
            <Phone size={14} aria-hidden="true" />
            <span>{loc.phone}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-500">
            {mr ? "प्रोफाइलमध्ये माहिती पहा" : "See profile for details"}
          </span>
        )}
        <Link href={`/directory/${loc.id}`} className={styles.view}>
          <span>{t.ctaViewProfile}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
