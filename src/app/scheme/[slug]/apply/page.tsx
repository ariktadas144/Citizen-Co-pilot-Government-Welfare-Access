"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { tDb } from "@/lib/dbI18n";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Send,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  MapPin,
  Briefcase,
  Shield,
  Image as ImageIcon,
  X,
  Eye,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { resolvePosterUrl } from "@/lib/utils";
import type { EligibilityRules } from "@/lib/types";

const Chatbot = dynamic(() => import("@/components/chatbot/Chatbot"), {
  ssr: false,
});

interface FormField {
  id: string;
  type: "text" | "textarea" | "file" | "select" | "date" | "number" | "checkbox";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: Record<string, unknown>;
}

interface SchemeData {
  id: string;
  slug: string;
  scheme_name: string;
  description: string;
  benefits: string;
  category: string;
  state: string | null;
  department: string | null;
  scheme_type: "government" | "private";
  official_website: string | null;
  poster_url: string | null;
  application_form_fields: FormField[];
  eligibility_rules: EligibilityRules;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  aadhaar_number: string | null;
  voter_id_number: string | null;
  address_line: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  annual_income: number | null;
  caste_category: string | null;
  occupation: string | null;
  disability_status: boolean;
  uploaded_documents: { name: string; url: string; type: string }[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SchemeApplyPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const [scheme, setScheme] = useState<SchemeData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { url: string; name: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if admin
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .single();
      if (adminRow) {
        setIsAdmin(true);
      }

      // Fetch scheme
      const { data: schemeData } = await supabase
        .from("schemes")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!schemeData) {
        toast.error("Scheme not found");
        router.push("/schemes");
        return;
      }

      // Government schemes redirect to official website
      if (schemeData.scheme_type === "government") {
        if (schemeData.official_website) {
          window.open(schemeData.official_website, "_blank", "noopener,noreferrer");
        }
        router.push(`/scheme/${slug}`);
        return;
      }

      setScheme(schemeData as SchemeData);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as unknown as UserProfile);
        // Auto-fill form responses from profile
        autoFillFromProfile(profileData as unknown as UserProfile, (schemeData as SchemeData).application_form_fields || []);
      }

      // Check if already applied
      const { data: existingApp } = await supabase
        .from("scheme_applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("scheme_id", schemeData.id)
        .single();

      if (existingApp) {
        setAlreadyApplied(true);
      }
    } catch {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  const autoFillFromProfile = (prof: UserProfile, fields: FormField[]) => {
    const autoFillMap: Record<string, string | number | boolean | null> = {
      full_name: prof.full_name,
      name: prof.full_name,
      applicant_name: prof.full_name,
      email: prof.email,
      email_address: prof.email,
      phone: prof.phone,
      phone_number: prof.phone,
      mobile: prof.phone,
      date_of_birth: prof.date_of_birth,
      dob: prof.date_of_birth,
      gender: prof.gender,
      aadhaar: prof.aadhaar_number,
      aadhaar_number: prof.aadhaar_number,
      voter_id: prof.voter_id_number,
      voter_id_number: prof.voter_id_number,
      address: prof.address_line,
      address_line: prof.address_line,
      district: prof.district,
      state: prof.state,
      pincode: prof.pincode,
      zip_code: prof.pincode,
      annual_income: prof.annual_income,
      income: prof.annual_income,
      caste: prof.caste_category,
      caste_category: prof.caste_category,
      occupation: prof.occupation,
      disability: prof.disability_status,
      disability_status: prof.disability_status,
    };

    const prefilled: Record<string, string | number | boolean> = {};
    for (const field of fields) {
      // Match by field id (lowercase, underscore-normalized)
      const normalizedId = field.id.toLowerCase().replace(/[\s-]/g, "_");
      const normalizedLabel = field.label.toLowerCase().replace(/[\s-]/g, "_");

      const val = autoFillMap[normalizedId] ?? autoFillMap[normalizedLabel] ?? null;
      if (val !== null && val !== undefined) {
        prefilled[field.id] = typeof val === "number" ? val : String(val);
      }
    }

    setResponses(prefilled);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateResponse = (fieldId: string, value: string | number | boolean) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    setFiles((prev) => ({ ...prev, [fieldId]: file }));

    // Upload immediately
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "application");
    if (scheme) formData.append("scheme_id", scheme.id);

    try {
      const res = await fetch("/api/upload/documents", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok) {
        setUploadedFiles((prev) => ({
          ...prev,
          [fieldId]: { url: json.url, name: file.name },
        }));
        updateResponse(fieldId, file.name);
        toast.success(`${file.name} uploaded`);
      } else {
        toast.error(json.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
  };

  const validateForm = (): boolean => {
    const fields = scheme?.application_form_fields || [];
    for (const field of fields) {
      if (field.required) {
        const value = responses[field.id];
        if (field.type === "checkbox") {
          if (!value) {
            toast.error(`"${field.label}" must be checked`);
            return false;
          }
        } else if (field.type === "file") {
          if (!uploadedFiles[field.id] && !files[field.id]) {
            toast.error(`"${field.label}" document is required`);
            return false;
          }
        } else if (!value || String(value).trim() === "") {
          toast.error(`"${field.label}" is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleReview = () => {
    if (!validateForm()) return;
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!scheme) return;
    setSubmitting(true);

    try {
      const documents = Object.entries(uploadedFiles).map(([fieldId, data]) => ({
        url: data.url,
        name: data.name,
        field_id: fieldId,
      }));

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme_id: scheme.id,
          form_responses: responses,
          documents,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setStep("done");
      toast.success("Application submitted successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Submission failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center neo-surface-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!scheme) return null;

  const schemeId = scheme.id;
  const name = tDb(t, "schemes", schemeId, "scheme_name", scheme.scheme_name);
  const formFields = scheme.application_form_fields || [];
  const hasCustomForm = formFields.length > 0;
  const posterUrl = resolvePosterUrl(scheme.poster_url);

  // ── DONE STATE ──
  if (step === "done") {
    return (
      <div className="min-h-screen neo-surface-gradient flex items-center justify-center p-4">
        <Card className="max-w-md w-full neo-elevated-lg rounded-2xl border-emerald-200">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Your application for <strong>{name}</strong> has been submitted successfully.
              You&apos;ll be notified when it&apos;s reviewed.
            </p>
            <div className="flex gap-3 mt-4">
              <Link href="/applications">
                <Button variant="outline" className="neo-elevated rounded-xl">
                  <Eye className="mr-2 h-4 w-4" /> View Applications
                </Button>
              </Link>
              <Link href="/schemes">
                <Button className="neo-btn-primary rounded-xl">
                  Browse More Schemes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Chatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen neo-surface-gradient">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="neo-elevated-sm rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <span className="ml-4 font-semibold text-foreground truncate flex-1">
            Apply: {name}
          </span>
          <ThemeToggle />
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Scheme Header with Poster */}
        <div className="mb-8">
          {posterUrl && (
            <div className="relative h-52 md:h-72 rounded-2xl overflow-hidden neo-elevated-lg mb-6">
              <img
                src={posterUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-emerald-600 text-white border-0">
                    {scheme.category}
                  </Badge>
                  {scheme.department && (
                    <Badge variant="secondary" className="bg-white/90 text-foreground border-0">
                      {scheme.department}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          {!posterUrl && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground">{name}</h1>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-emerald-600 text-white border-0">
                  {scheme.category}
                </Badge>
                {scheme.department && (
                  <Badge variant="outline">{scheme.department}</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Block */}
        {isAdmin && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 neo-elevated-lg rounded-2xl">
            <CardContent className="flex items-center gap-4 py-6">
              <Shield className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-semibold text-foreground">Admin Account</p>
                <p className="text-sm text-muted-foreground">
                  Admins cannot apply to schemes. Only citizens can submit applications.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already Applied */}
        {alreadyApplied && !isAdmin && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20 neo-elevated-lg rounded-2xl">
            <CardContent className="flex items-center gap-4 py-6">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold text-foreground">Already Applied</p>
                <p className="text-sm text-muted-foreground">
                  You have already applied to this scheme.{" "}
                  <Link href="/applications" className="text-emerald-600 underline">
                    View your applications
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {!isAdmin && !alreadyApplied && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form Area */}
            <div className="lg:col-span-2 space-y-6">
              {step === "review" ? (
                /* ── REVIEW STEP ── */
                <Card className="neo-elevated-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Review Your Application
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Please review all information before submitting.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Info Summary */}
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" /> Your Profile
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{profile?.full_name || "—"}</span>
                        <span className="text-muted-foreground">Email:</span>
                        <span>{profile?.email || "—"}</span>
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{profile?.phone || "—"}</span>
                        <span className="text-muted-foreground">State:</span>
                        <span>{profile?.state || "—"}</span>
                      </div>
                    </div>

                    {/* Form Responses */}
                    {hasCustomForm && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Form Responses
                        </h4>
                        <div className="rounded-lg border p-4 space-y-3">
                          {formFields.map((field) => {
                            const value = responses[field.id];
                            return (
                              <div key={field.id} className="flex items-start gap-2 text-sm">
                                <span className="text-muted-foreground min-w-[160px] font-medium">
                                  {field.label}:
                                </span>
                                <span className="text-foreground">
                                  {field.type === "checkbox"
                                    ? value ? "Yes" : "No"
                                    : field.type === "file"
                                    ? uploadedFiles[field.id]?.name || files[field.id]?.name || "—"
                                    : String(value || "—")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Documents */}
                    {Object.keys(uploadedFiles).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Upload className="h-4 w-4" /> Uploaded Documents
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(uploadedFiles).map(([fieldId, doc]) => (
                            <div key={fieldId} className="flex items-center gap-2 p-2 rounded-lg neo-inset text-sm text-foreground">
                              <FileText className="h-4 w-4 text-emerald-600" />
                              <span className="flex-1">{doc.name}</span>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("form")}
                        className="flex-1 neo-elevated rounded-xl"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 neo-btn-primary rounded-xl"
                      >
                        {submitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" /> Confirm &amp; Submit</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* ── FORM STEP ── */
                <>
                  {/* Auto-filled Profile Section */}
                  <Card className="neo-elevated-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <User className="h-5 w-5 text-emerald-600" />
                        Personal Information
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Auto-filled from your profile. You can edit any field below.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={profile?.full_name || ""}
                            disabled
                            className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={profile?.email || ""}
                            disabled
                            className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={profile?.phone || ""}
                            disabled
                            className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input
                            value={profile?.date_of_birth || ""}
                            disabled
                            className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> State
                          </Label>
                          <Input value={profile?.state || ""} disabled className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label>District</Label>
                          <Input value={profile?.district || ""} disabled className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Input value={profile?.address_line || ""} disabled className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label>Pincode</Label>
                          <Input value={profile?.pincode || ""} disabled className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground" />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> Occupation
                          </Label>
                          <Input value={profile?.occupation || ""} disabled className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label>Annual Income</Label>
                          <Input
                            value={profile?.annual_income ? `₹${profile.annual_income.toLocaleString()}` : ""}
                            disabled
                            className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input
                            value={profile?.caste_category?.toUpperCase() || ""}
                            disabled
                            className="neo-inset rounded-xl border-0 bg-muted/60 text-foreground"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        Need to update your profile?{" "}
                        <Link href="/profile" className="text-emerald-600 underline">
                          Edit Profile
                        </Link>
                      </p>
                    </CardContent>
                  </Card>

                  {/* Custom Form Fields (from org) */}
                  {hasCustomForm && (
                    <Card className="neo-elevated-lg rounded-2xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <FileText className="h-5 w-5 text-emerald-600" />
                          Application Details
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Additional information required by the scheme provider.
                          {Object.keys(responses).length > 0 && (
                            <span className="text-emerald-600 ml-1">
                              ({Object.keys(responses).length} fields pre-filled from profile)
                            </span>
                          )}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {formFields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label className="flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </Label>

                            {field.type === "text" && (
                              <Input
                                value={String(responses[field.id] || "")}
                                onChange={(e) => updateResponse(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className="neo-inset rounded-xl border-0"
                              />
                            )}

                            {field.type === "textarea" && (
                              <Textarea
                                value={String(responses[field.id] || "")}
                                onChange={(e) => updateResponse(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                rows={3}
                                className="neo-inset rounded-xl border-0"
                              />
                            )}

                            {field.type === "number" && (
                              <Input
                                type="number"
                                value={String(responses[field.id] || "")}
                                onChange={(e) =>
                                  updateResponse(field.id, e.target.value ? Number(e.target.value) : "")
                                }
                                placeholder={field.placeholder}
                                className="neo-inset rounded-xl border-0"
                              />
                            )}

                            {field.type === "date" && (
                              <Input
                                type="date"
                                value={String(responses[field.id] || "")}
                                onChange={(e) => updateResponse(field.id, e.target.value)}
                                className="neo-inset rounded-xl border-0"
                              />
                            )}

                            {field.type === "select" && (
                              <Select
                                value={String(responses[field.id] || "")}
                                onValueChange={(v) => updateResponse(field.id, v)}
                              >
                                <SelectTrigger className="neo-inset rounded-xl border-0">
                                  <SelectValue placeholder={field.placeholder || "Select an option"} />
                                </SelectTrigger>
                                <SelectContent className="neo-elevated-lg border border-border/60 bg-card text-foreground">
                                  {(field.options || []).map((opt) => (
                                    <SelectItem key={opt} value={opt} className="text-foreground focus:bg-muted/60">
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {field.type === "checkbox" && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={!!responses[field.id]}
                                  onCheckedChange={(v) => updateResponse(field.id, !!v)}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {field.placeholder || field.label}
                                </span>
                              </div>
                            )}

                            {field.type === "file" && (
                              <div className="space-y-2">
                                {uploadedFiles[field.id] ? (
                                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <FileText className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm flex-1 truncate">
                                      {uploadedFiles[field.id].name}
                                    </span>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setUploadedFiles((prev) => {
                                          const copy = { ...prev };
                                          delete copy[field.id];
                                          return copy;
                                        });
                                        setFiles((prev) => {
                                          const copy = { ...prev };
                                          delete copy[field.id];
                                          return copy;
                                        });
                                        updateResponse(field.id, "");
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <span className="text-sm font-medium">
                                        {files[field.id] ? files[field.id].name : "Choose file..."}
                                      </span>
                                      <p className="text-xs text-muted-foreground">
                                        PDF, JPG, PNG, DOCX — Max 10MB
                                      </p>
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(field.id, file);
                                      }}
                                    />
                                  </label>
                                )}
                                {field.placeholder && (
                                  <p className="text-xs text-muted-foreground">{field.placeholder}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* General Document Upload (for all schemes) */}
                  <Card className="neo-elevated-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Upload className="h-5 w-5 text-emerald-600" />
                        Supporting Documents
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Upload any additional documents to strengthen your application.
                        (ID proof, income certificate, caste certificate, etc.)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">
                            Click to upload supporting documents
                          </span>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, PNG, DOCX — Max 10MB per file
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                          multiple
                          onChange={async (e) => {
                            const fileList = e.target.files;
                            if (!fileList) return;
                            for (let i = 0; i < fileList.length; i++) {
                              const file = fileList[i];
                              const fid = `extra_doc_${Date.now()}_${i}`;
                              await handleFileUpload(fid, file);
                            }
                          }}
                        />
                      </label>

                      {/* Show uploaded extra docs */}
                      {Object.entries(uploadedFiles)
                        .filter(([k]) => k.startsWith("extra_doc_"))
                        .map(([key, doc]) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                          >
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm flex-1 truncate">{doc.name}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadedFiles((prev) => {
                                  const copy = { ...prev };
                                  delete copy[key];
                                  return copy;
                                });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  {/* Submit */}
                  <Button
                    size="lg"
                    className="w-full neo-btn-primary rounded-xl text-base"
                    onClick={handleReview}
                  >
                    Review Application
                  </Button>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Scheme Summary */}
              <Card className="neo-elevated-lg rounded-2xl sticky top-20">
                <CardHeader>
                  <CardTitle className="text-foreground text-sm">Applying for</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {posterUrl && (
                    <div className="rounded-lg overflow-hidden -mx-6 -mt-2 mb-2">
                      <img
                        src={posterUrl}
                        alt={name}
                        className="w-full h-36 object-cover"
                        onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-foreground">{name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {tDb(t, "schemes", schemeId, "description", scheme.description)}
                  </p>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="secondary">{scheme.category}</Badge>
                    </div>
                    {scheme.department && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Department</span>
                        <span className="text-right text-xs">{scheme.department}</span>
                      </div>
                    )}
                    {scheme.state && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">State</span>
                        <span>{scheme.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Required Documents Checklist */}
                  {scheme.eligibility_rules?.required_documents && scheme.eligibility_rules.required_documents.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Required Documents</h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {scheme.eligibility_rules.required_documents.map((doc) => (
                            <li key={doc} className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <Separator />
                  <Link href={`/scheme/${slug}`}>
                    <Button variant="outline" className="w-full neo-elevated rounded-xl" size="sm">
                      <ArrowLeft className="mr-2 h-3 w-3" /> Back to Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Chatbot />
    </div>
  );
}
