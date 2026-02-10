"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Briefcase,
  IndianRupee,
  LogOut,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X as XIcon,
  Upload,
  FileText,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatbotButton } from "@/components/ChatbotButton";
import type { UserProfile } from "../../../types/user";

export default function ProfilePage() {
  const { t } = useTranslation();
  type ProfileDocument = {
    name: string;
    url?: string;
    path?: string;
    type?: string;
    uploaded_at: string;
  };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setEditedProfile(data);
        setDocuments(data.uploaded_documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedProfile),
      });

      if (response.ok) {
        const { data } = await response.json();
        setProfile(data);
        setEditing(false);
      } else {
        const { error } = await response.json();
        console.error("Failed to update profile:", error);
        alert("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditedProfile(profile || {});
    setEditing(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const handleViewDocument = async (doc: ProfileDocument) => {
    const docKey = doc.path || doc.url || doc.name;
    if (!docKey) {
      alert("Document is missing a file reference.");
      return;
    }

    setOpeningDoc(docKey);
    const popup = window.open("", "_blank");
    try {
      const res = await fetch("/api/documents/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: doc.path, url: doc.url }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Failed to open document");
      }
      if (popup) {
        popup.opener = null;
        popup.location.href = json.url;
      } else {
        window.location.href = json.url;
      }
    } catch (error) {
      console.error("Failed to open document:", error);
      if (popup) {
        popup.close();
      }
      alert("Failed to open document. Please try again.");
    } finally {
      setOpeningDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center neo-surface-gradient">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const InfoField = ({
    icon: Icon,
    label,
    value,
    field,
    type = "text",
  }: {
    icon: any;
    label: string;
    value: string | number | null;
    field: keyof UserProfile;
    type?: string;
  }) => {
    // Get the field value and convert to string for input
    const fieldValue = editedProfile[field];
    const stringValue = fieldValue != null && typeof fieldValue !== 'object' && typeof fieldValue !== 'boolean' && !Array.isArray(fieldValue)
      ? String(fieldValue)
      : "";

    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Icon className="h-4 w-4 text-emerald-600" />
          {label}
        </Label>
        {editing ? (
          <Input
            type={type}
            value={stringValue}
            onChange={(e) =>
              setEditedProfile({ ...editedProfile, [field]: e.target.value })
            }
            className="neo-inset border-0 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl text-foreground"
          />
        ) : (
          <p className="text-foreground font-medium pl-6">
            {value || "Not provided"}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen neo-surface-gradient">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-4xl font-bold">
              {t("profile.title") || "My Profile"}
            </h1>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2 text-white hover:bg-white/20 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout") || "Logout"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-elevated-lg rounded-2xl p-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              <motion.div whileHover={{ scale: 1.05 }} className="relative">
                <Avatar className="h-24 w-24 border-4 border-emerald-500 neo-elevated">
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-4 border-background" />
              </motion.div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2 text-foreground">
                  {profile.full_name || "User"}
                </h2>
                <p className="text-muted-foreground mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Badge
                    className={`neo-elevated border-0 ${
                      profile.id_verified
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {profile.id_verified ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    ID {profile.id_verified ? "Verified" : "Not Verified"}
                  </Badge>
                  <Badge
                    className={`neo-elevated border-0 ${
                      profile.face_verified
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {profile.face_verified ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    Face {profile.face_verified ? "Verified" : "Not Verified"}
                  </Badge>
                  <Badge
                    className={`neo-elevated border-0 ${
                      profile.onboarding_completed
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {profile.onboarding_completed ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    Onboarding{" "}
                    {profile.onboarding_completed ? "Complete" : "Pending"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <AnimatePresence mode="wait">
              {!editing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    onClick={() => setEditing(true)}
                    className="neo-btn-primary rounded-xl"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex gap-2"
                >
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="neo-btn-primary rounded-xl"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="ghost"
                    className="neo-elevated hover:neo-inset rounded-xl"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="neo-elevated-lg rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-foreground">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              icon={User}
              label="Full Name"
              value={profile.full_name}
              field="full_name"
            />
            <InfoField
              icon={Phone}
              label="Phone"
              value={profile.phone}
              field="phone"
              type="tel"
            />
            <InfoField
              icon={Calendar}
              label="Date of Birth"
              value={profile.date_of_birth}
              field="date_of_birth"
            />
            <InfoField
              icon={User}
              label="Gender"
              value={profile.gender}
              field="gender"
            />
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="neo-elevated-lg rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-foreground">Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Address
                </Label>
                <p className="text-foreground font-medium pl-6">
                  {profile.address?.line1 || profile.address?.line2
                    ? `${profile.address.line1 || ""} ${profile.address.line2 || ""}`.trim()
                    : "Not provided"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                District
              </Label>
              <p className="text-foreground font-medium pl-6">
                {profile.address?.district || "Not provided"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                State
              </Label>
              <p className="text-foreground font-medium pl-6">
                {profile.address?.state || profile.state || "Not provided"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Pincode
              </Label>
              <p className="text-foreground font-medium pl-6">
                {profile.address?.pincode || "Not provided"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Additional Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="neo-elevated-lg rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-foreground">Additional Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              icon={Briefcase}
              label="Occupation"
              value={profile.occupation}
              field="occupation"
            />
            <InfoField
              icon={IndianRupee}
              label="Annual Income (?)"
              value={profile.annual_income}
              field="annual_income"
              type="number"
            />
            <InfoField
              icon={Shield}
              label="Caste Category"
              value={profile.caste_category}
              field="caste_category"
            />
            <InfoField
              icon={Shield}
              label="Disability Status"
              value={profile.disability_status}
              field="disability_status"
            />
          </div>
        </motion.div>

        {/* Identity Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="neo-elevated-lg rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-foreground">Identity Documents</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Aadhaar Number
              </Label>
              <p className="text-foreground font-medium pl-6">
                {profile.aadhaar_number
                  ? `XXXX XXXX ${profile.aadhaar_number.slice(-4)}`
                  : "Not provided"}
              </p>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Voter ID
              </Label>
              <p className="text-foreground font-medium pl-6">
                {profile.voter_id || "Not provided"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Uploaded Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="neo-elevated-lg rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              <h3 className="text-xl font-bold text-foreground">My Documents</h3>
            </div>
            <label className="cursor-pointer">
              <Button
                variant="outline"
                size="sm"
                className="neo-elevated rounded-xl"
                disabled={uploadingDoc}
                asChild
              >
                <span>
                  {uploadingDoc ? (
                    <span className="flex items-center gap-2">Uploading...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Upload Document
                    </span>
                  )}
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingDoc(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("purpose", "identity");
                    const res = await fetch("/api/upload/documents", {
                      method: "POST",
                      body: formData,
                    });
                    const json = await res.json();
                    if (res.ok) {
                      setDocuments((prev) => [
                        ...prev,
                        { name: file.name, url: json.url, path: json.path, type: file.type, uploaded_at: new Date().toISOString() },
                      ]);
                    } else {
                      alert(json.error || "Upload failed");
                    }
                  } catch {
                    alert("Upload failed");
                  } finally {
                    setUploadingDoc(false);
                  }
                }}
              />
            </label>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No documents uploaded yet.</p>
              <p className="text-sm mt-1">Upload ID proofs, certificates, etc. to use in applications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl neo-elevated"
                >
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                      disabled={openingDoc === (doc.path || doc.url || doc.name)}
                      className="text-xs text-emerald-600 hover:underline px-2"
                    >
                      {openingDoc === (doc.path || doc.url || doc.name) ? "Opening..." : "View"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={async () => {
                      try {
                        await fetch("/api/upload/documents", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ url: doc.url }),
                        });
                        setDocuments((prev) => prev.filter((_, i) => i !== idx));
                      } catch {
                        alert("Failed to delete");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
      <ChatbotButton />
    </div>
  );
}
