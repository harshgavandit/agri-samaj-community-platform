"use client";

import { ArrowRight, CheckCircle2, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";

import { getLocalizedBusiness } from "@/lib/localize";

interface BusinessCardProps {
  business: any;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const { language, t } = useLanguage();
  const loc = getLocalizedBusiness(business, language);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all hover:border-amber-400/80 flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
            {loc.categoryName}
          </span>

          {loc.isVerified ? (
            <span className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.verifiedBadge}</span>
            </span>
          ) : (
            <span className="text-slate-600 text-xs bg-slate-100 px-2 py-0.5 rounded">
              {t.pendingVerification}
            </span>
          )}
        </div>

        {/* Business Title & Brand */}
        <h3 className="text-lg font-bold text-navy-950 group-hover:text-amber-700 transition leading-snug">
          {loc.businessName}
        </h3>
        {loc.brandName && (
          <p className="text-xs text-amber-700 font-medium mb-1">
            {loc.brandLabel} {loc.brandName}
          </p>
        )}

        {/* Proprietor / Classification */}
        <div className="flex items-center text-xs text-slate-600 space-x-2 my-2">
          <span>{loc.ownerName}</span>
          <span>•</span>
          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
            {loc.classificationLabel}
          </span>
          {loc.establishedYear && (
            <>
              <span>•</span>
              <span>
                {t.establishedIn} {loc.establishedYear}
              </span>
            </>
          )}
        </div>

        {/* Products / Services snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 my-2 leading-relaxed">
          {loc.productsServices}
        </p>

        {/* Location */}
        <div className="flex items-center text-xs text-slate-600 space-x-1.5 mt-3 pt-3 border-t border-slate-100">
          <MapPin className="w-3.5 h-3.5 text-copper-600 shrink-0" />
          <span className="truncate">{loc.locationString}</span>
        </div>
      </div>

      {/* Action footer */}
      <div className="mt-4 pt-3 flex items-center justify-between gap-2">
        {loc.phone ? (
          <a
            href={`tel:${loc.phone}`}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:text-navy-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 transition"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>{loc.phone}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">{loc.statusBadgeLabel}</span>
        )}

        <Link
          href={`/directory/${loc.id}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition"
        >
          <span>{t.ctaViewProfile}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
