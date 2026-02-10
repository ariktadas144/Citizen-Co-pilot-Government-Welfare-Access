"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { tDb } from "@/lib/dbI18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  MapPin,
  Globe,
  Shield,
  Send,
  FileText,
} from "lucide-react";
import type { SchemeRecommendation } from "@/lib/types";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { resolvePosterUrl } from "@/lib/utils";

const Chatbot = dynamic(() => import("@/components/chatbot/Chatbot"), {
  ssr: false,
});

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SchemeDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const [scheme, setScheme] = useState<SchemeRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchScheme = useCallback(async () => {
    try {
      const adminRes = await fetch("/api/admin/users");
      if (adminRes.ok) {
        setIsAdmin(true);
      }

      const res = await fetch("/api/schemes/recommend");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const found = json.recommendations.find(
        (r: SchemeRecommendation) => r.slug === slug
      );
      if (found) {
        setScheme(found);
      } else {
        toast.error("Scheme not found");
        router.push("/home");
      }
    } catch {
      toast.error("Failed to load scheme");
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    fetchScheme();
  }, [fetchScheme]);

  const handleApply = async () => {
    if (!scheme) return;
    if (scheme.scheme_type === "government") {
      if (scheme.official_website) {
        window.open(scheme.official_website, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Official website not available");
      }
      return;
    }
    // Private scheme: navigate to apply page
    const formFields = (scheme as unknown as { application_form_fields?: unknown[] }).application_form_fields;
    if (formFields && formFields.length > 0) {
      router.push(`/scheme/${scheme.slug}/apply`);
      return;
    }
    // No custom form — also go to apply page for consistent experience
    router.push(`/scheme/${scheme.slug}/apply`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center neo-surface-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!scheme) return null;

  const schemeId = scheme.id || scheme.slug || scheme.scheme_name;
  const name = tDb(t, "schemes", schemeId, "scheme_name", scheme.scheme_name);
  const description = tDb(
    t,
    "schemes",
    schemeId,
    "description",
    scheme.description
  );
  const benefits = tDb(t, "schemes", schemeId, "benefits", scheme.benefits);
  const category = tDb(t, "schemes", schemeId, "category", scheme.category);
  const state = scheme.state
    ? tDb(t, "schemes", schemeId, "state", scheme.state)
    : null;
  const applicationProcess = scheme.application_process
    ? tDb(
        t,
        "schemes",
        schemeId,
        "application_process",
        scheme.application_process
      )
    : null;
  const posterUrl = resolvePosterUrl(scheme.poster_url);

  return (
    <div className="min-h-screen neo-surface-gradient flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-6">
            <Link href="/home">
              <Button variant="ghost" size="sm" className="neo-elevated-sm rounded-xl text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Schemes
              </Button>
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
            {/* Left Column: Content */}
            <div className="space-y-8 min-w-0">
              {/* Poster Banner */}
              {posterUrl && (
                <div className="relative h-64 md:h-96 w-full rounded-3xl overflow-hidden neo-elevated-lg group">
                  <img
                    src={posterUrl}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg leading-tight mb-2">{name}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                       <Badge className="bg-emerald-600 text-white border-0 backdrop-blur-md">
                         {scheme.scheme_type === "government" ? "Government Scheme" : "Private Grant"}
                       </Badge>
                       {state && (
                         <Badge variant="outline" className="text-white border-white/40 bg-black/20 backdrop-blur-md">
                           {state}
                         </Badge>
                       )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title Section (if no poster, or layout choice - let's keep header info distinct if no poster, but merged if poster exists.
                  Actually, user wants "PERFECT APP DESIGN". Overlaid title on poster looks best.
                  If poster fails, we need a fallback header.
              */}
              {!posterUrl && (
                <div className="mb-8">
                   <h1 className="text-4xl font-bold text-foreground mb-4">{name}</h1>
                   <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{category}</Badge>
                      <Badge className={scheme.scheme_type === "government" ? "neo-govt-badge" : "neo-private-badge"}>
                        {scheme.scheme_type}
                      </Badge>
                   </div>
                </div>
              )}

              {/* Description & Overview */}
              <div className="neo-elevated-lg rounded-3xl p-8 space-y-6">
                <div>
                   <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                     <FileText className="h-6 w-6 text-emerald-600" />
                     About the Scheme
                   </h2>
                   <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>
                </div>

                <Separator className="bg-border/50" />

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Key Benefits</h3>
                  <div className="p-4 rounded-2xl neo-inset bg-emerald-50/50 dark:bg-emerald-900/10">
                    <p className="leading-relaxed text-foreground">{benefits}</p>
                  </div>
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="neo-elevated-lg rounded-3xl p-8 space-y-6">
                 <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                   <Shield className="h-6 w-6 text-emerald-600" />
                   Eligibility Check
                 </h2>

                 <div className="grid gap-6 md:grid-cols-2">
                    {/* Score Card */}
                    <div className="neo-inset rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="relative h-24 w-24 mb-4 flex items-center justify-center">
                           <svg className="absolute inset-0 h-full w-full -rotate-90 text-emerald-500" viewBox="0 0 36 36">
                              <path
                                className="stroke-current transition-all duration-1000 ease-out"
                                strokeDasharray={`${scheme.eligibility_score}, 100`}
                                strokeWidth="3"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                           </svg>
                           <span className="absolute text-xl font-bold text-emerald-600">{scheme.eligibility_score}%</span>
                        </div>
                        <p className="font-medium text-foreground">Eligibility Score</p>
                        <p className="text-xs text-muted-foreground mt-1">Based on your profile</p>
                    </div>

                    {/* Criteria List */}
                    <div className="space-y-4">
                       <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Matched Criteria</h4>
                          <ul className="space-y-2">
                             {scheme.matching_criteria.map((c, i) => (
                               <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                 <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                 <span>{tDb(t, "schemes", schemeId, `matching_criteria.${i}`, c)}</span>
                               </li>
                             ))}
                             {scheme.matching_criteria.length === 0 && <p className="text-sm text-muted-foreground italic">No specific matches found.</p>}
                          </ul>
                       </div>

                       {scheme.missing_criteria.length > 0 && (
                         <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-4">Missing Requirements</h4>
                            <ul className="space-y-2">
                               {scheme.missing_criteria.map((c, i) => (
                                 <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                   <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                                   <span>{tDb(t, "schemes", schemeId, `missing_criteria.${i}`, c)}</span>
                                 </li>
                               ))}
                            </ul>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Required Documents */}
              {scheme.eligibility_rules.required_documents && scheme.eligibility_rules.required_documents.length > 0 && (
                <div className="neo-elevated-lg rounded-3xl p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-emerald-600" />
                    Required Documents
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {scheme.eligibility_rules.required_documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl neo-surface border border-border/50">
                        <div className="h-10 w-10 rounded-full neo-inset flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-foreground text-sm">
                          {tDb(t, "schemes", schemeId, `required_documents.${i}`, doc)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Sidebar with Apply Action */}
            <div className="space-y-6">
              <div className="lg:sticky lg:top-24 space-y-6">
                
                {/* Main Action Card */}
                <div className="neo-elevated-xl rounded-3xl overflow-hidden border border-emerald-500/10 shadow-2xl shadow-emerald-900/5">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
                    <h3 className="text-xl font-bold mb-1">Ready to Apply?</h3>
                    <p className="text-emerald-100 text-sm">Take the next step towards your benefits.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">Application Deadline</span>
                       <span className="font-semibold text-foreground">Open</span>
                    </div>
                    
                    <Separator />

                    {isAdmin ? (
                      <div className="p-4 rounded-xl bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200 text-sm text-center">
                        <Shield className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-bold">Admin View</p>
                        <p className="text-xs mt-1 opacity-80">You are viewing this as an administrator.</p>
                      </div>
                    ) : applied ? (
                      <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 text-center space-y-2">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
                        <p className="font-bold text-lg">Application Submitted!</p>
                        <p className="text-sm opacity-80">Track status in your dashboard.</p>
                        <Button variant="outline" className="w-full mt-2 bg-transparent border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" onClick={() => router.push('/applications')}>
                          View My Applications
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full h-14 text-lg font-bold shadow-lg shadow-emerald-500/25 neo-btn-primary rounded-xl"
                        onClick={handleApply}
                      >
                        {scheme.scheme_type === "government" ? (
                           <>Visit Official Website <ExternalLink className="ml-2 h-5 w-5" /></>
                        ) : (
                           <>Apply Now <Send className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                      {scheme.scheme_type === "government" 
                        ? "You will be redirected to the official government portal." 
                        : "Simple, paperless application via CitizenSchemes."}
                    </p>
                  </div>
                </div>

                {/* Info Card */}
                <div className="neo-elevated-lg rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Scheme Details
                  </h4>
                  <div className="space-y-4 text-sm">
                     <div className="flex items-start justify-between">
                       <span className="text-muted-foreground">Department</span>
                       <span className="font-medium text-right text-foreground max-w-[60%]">
                         {tDb(t, "schemes", schemeId, "department", scheme.department) || "N/A"}
                       </span>
                     </div>
                     <Separator />
                     <div className="flex items-start justify-between">
                       <span className="text-muted-foreground">Category</span>
                       <span className="font-medium text-right text-foreground max-w-[60%]">{category}</span>
                     </div>
                     <Separator />
                     <div className="flex items-start justify-between">
                       <span className="text-muted-foreground">Beneficiaries</span>
                       <span className="font-medium text-right text-foreground max-w-[60%]">{scheme.eligibility_rules?.gender?.join(", ") || "All"}</span>
                     </div>
                  </div>
                </div>
                
                {/* Share/Help */}
                 <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="neo-elevated rounded-xl h-auto py-4 flex flex-col gap-2 hover:text-emerald-600" onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard");
                    }}>
                       <Globe className="h-5 w-5" />
                       <span className="text-xs">Share Scheme</span>
                    </Button>
                    <Link href="/chat" className="w-full">
                      <Button variant="outline" className="w-full neo-elevated rounded-xl h-auto py-4 flex flex-col gap-2 hover:text-emerald-600">
                         <Shield className="h-5 w-5" />
                         <span className="text-xs">Get Help</span>
                      </Button>
                    </Link>
                 </div>

              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <Chatbot />
    </div>
  );
}
