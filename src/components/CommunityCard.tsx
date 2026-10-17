"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, ExternalLink } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { CommunityEntry, kindLabels } from "@/lib/community";
export default function CommunityCard({ entry }: { entry: CommunityEntry }) {
  const { language } = useLanguage();
  const mr = language === "mr";
  return (
    <article className="editorial-card">
      {entry.coverImageUrl && (
        <Image
          className="editorial-image"
          src={entry.coverImageUrl}
          alt={mr ? entry.titleMr : entry.titleEn}
          width={800}
          height={450}
          unoptimized
        />
      )}
      <div className="card-kicker">
        <BookOpen size={15} />
        <span>{kindLabels[entry.kind]?.[language]}</span>
        {entry.period === "HISTORICAL" && (
          <span className="history-label">
            {mr ? "ऐतिहासिक" : "Historical"}
          </span>
        )}
      </div>
      <h3>
        <Link href={`/community/${entry.slug}`}>
          {mr ? entry.titleMr : entry.titleEn}
          <ArrowUpRight size={20} />
        </Link>
      </h3>
      <p>{mr ? entry.summaryMr : entry.summaryEn}</p>
      <div className="card-source">
        <ExternalLink size={13} />
        <span>{entry.sources[0]?.label}</span>
      </div>
    </article>
  );
}
