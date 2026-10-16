"use client";

import {
  AirVent,
  Building,
  Factory,
  HardHat,
  Laptop,
  Megaphone,
  Printer,
  Scale,
  ShoppingBag,
  Sprout,
  Truck,
  Utensils,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";

interface CategoryCardProps {
  category: {
    id: string;
    slug: string;
    nameMr: string;
    nameEn: string;
    descriptionMr?: string | null;
    descriptionEn?: string | null;
    icon?: string | null;
    _count?: {
      businesses: number;
    };
  };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { language } = useLanguage();

  const getIcon = (iconName?: string | null) => {
    switch (iconName) {
      case "HardHat":
        return <HardHat className="w-6 h-6 text-amber-600" />;
      case "Factory":
        return <Factory className="w-6 h-6 text-amber-600" />;
      case "Laptop":
        return <Laptop className="w-6 h-6 text-amber-600" />;
      case "Sprout":
        return <Sprout className="w-6 h-6 text-emerald-600" />;
      case "Scale":
        return <Scale className="w-6 h-6 text-amber-600" />;
      case "AirVent":
        return <AirVent className="w-6 h-6 text-sky-600" />;
      case "Printer":
        return <Printer className="w-6 h-6 text-purple-600" />;
      case "ShoppingBag":
        return <ShoppingBag className="w-6 h-6 text-rose-600" />;
      case "Truck":
        return <Truck className="w-6 h-6 text-amber-600" />;
      case "Megaphone":
        return <Megaphone className="w-6 h-6 text-red-600" />;
      case "Utensils":
        return <Utensils className="w-6 h-6 text-orange-600" />;
      case "Zap":
        return <Zap className="w-6 h-6 text-amber-500" />;
      default:
        return <Building className="w-6 h-6 text-amber-600" />;
    }
  };

  return (
    <Link
      href={`/directory?category=${category.slug}`}
      className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-amber-500 hover:shadow-md transition-all group flex flex-col justify-between"
    >
      <div>
        <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          {getIcon(category.icon)}
        </div>
        <h3 className="font-bold text-navy-950 text-sm group-hover:text-amber-800 transition">
          {language === "mr" ? category.nameMr : category.nameEn}
        </h3>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
          {language === "mr" ? category.descriptionMr : category.descriptionEn}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
        <span>
          {category._count
            ? `${category._count.businesses} ${language === "mr" ? "उद्योजक" : "Enterprises"}`
            : language === "mr"
              ? "उद्योजक"
              : "Enterprises"}
        </span>
        <span className="text-amber-700 font-semibold group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </div>
    </Link>
  );
}
