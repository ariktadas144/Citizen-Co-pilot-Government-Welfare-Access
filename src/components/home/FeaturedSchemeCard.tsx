// Featured Scheme Card Component with horizontal scroll
"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { tDb } from "@/lib/dbI18n";
import { resolvePosterUrl } from "@/lib/utils";

interface FeaturedSchemeCardProps {
  scheme: {
    id: string;
    slug: string;
    scheme_name: string;
    description: string;
    benefits: string;
    category: string;
    state: string | null;
    official_website: string | null;
    poster_url?: string | null;
  };
  index: number;
}

export function FeaturedSchemeCard({
  scheme,
  index,
}: FeaturedSchemeCardProps) {
  const { t } = useTranslation();
  const schemeId = scheme.id || scheme.slug || scheme.scheme_name;
  const name = tDb(t, "schemes", schemeId, "scheme_name", scheme.scheme_name);
  const description = tDb(
    t,
    "schemes",
    schemeId,
    "description",
    scheme.description || "Discover the benefits of this government welfare scheme."
  );
  const benefits = scheme.benefits
    ? tDb(t, "schemes", schemeId, "benefits", scheme.benefits)
    : "";
  const category = tDb(t, "schemes", schemeId, "category", scheme.category);
  const state = scheme.state
    ? tDb(t, "schemes", schemeId, "state", scheme.state)
    : null;
  const posterUrl = resolvePosterUrl(scheme.poster_url);
  // Use gradient background instead of external logo service
  const gradients = [
    "from-primary to-primary",
    "from-blue-500 to-cyan-500",
    "from-indigo-500 to-purple-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
  ];
  const gradientClass = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="shrink-0 w-85 sm:w-95"
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ duration: 0.3 }}
        className="group relative h-full overflow-hidden neo-elevated-lg hover:neo-elevated-xl transition-all duration-300 rounded-2xl"
      >
        <motion.div className="relative h-full">
          {/* Image Section */}
          <div className={`relative h-48 overflow-hidden bg-linear-to-br ${gradientClass}`}>
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="text-white/90 text-6xl font-bold">
                {name.charAt(0)}
              </div>
            </div>
            {posterUrl && (
              <img
                src={posterUrl}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover z-1"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent z-2" />
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4 z-3">
                <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 border-0">
                  {category}
              </Badge>
            </div>

            {/* State Badge */}
            {state && (
              <div className="absolute top-4 right-4 z-3">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm neo-inset border-0 text-foreground">
                  {state}
                </Badge>
              </div>
            )}

            {/* Featured Ribbon */}
            <div className="absolute top-8 -right-10 bg-linear-to-r from-primary to-primary text-primary-foreground px-12 py-1 rotate-45 text-xs font-bold shadow-lg z-3">
              FEATURED
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {description}
              </p>
            </div>

            {/* Benefits Preview */}
            {benefits && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-primary">{t("common.benefits")}:</span>{" "}
                  {benefits}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Link href={`/scheme/${scheme.slug}`} className="flex-1">
                <Button className="w-full gap-2">
                  {t("common.viewDetails")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              {scheme.official_website && (
                <motion.a
                  href={scheme.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="neo-elevated p-2.5 rounded-lg hover:neo-elevated-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                </motion.a>
              )}
            </div>
          </div>

          {/* Hover Glow Effect - Removed */}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
