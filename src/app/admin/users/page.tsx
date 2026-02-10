"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getInitials, resolvePosterUrl } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

type AdminUserProfile = UserProfile & {
  voter_id?: string | null;
  voter_id_number?: string | null;
  document_url?: string | null;
  id_document_url?: string | null;
  document_type?: string | null;
  address_line?: string | null;
  district?: string | null;
  pincode?: string | null;
  uploaded_documents?: Array<{ name: string; url: string; type?: string; uploaded_at?: string }>;
  interested_tags?: string[];
  face_verification?: Record<string, unknown> | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserProfile | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setUsers(json.users || json.profiles || []);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.state || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  const openUser = (user: AdminUserProfile) => {
    setSelectedUser(user);
    setEditData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
      aadhaar_number: user.aadhaar_number || "",
      voter_id_number: user.voter_id_number || user.voter_id || "",
      address_line: user.address_line || user.address?.line1 || "",
      district: user.district || user.address?.district || "",
      state: user.state || user.address?.state || "",
      pincode: user.pincode || user.address?.pincode || "",
      annual_income: user.annual_income ?? "",
      caste_category: user.caste_category || "",
      occupation: user.occupation || "",
      disability_status: user.disability_status ?? "",
      id_verified: !!user.id_verified,
      face_verified: !!user.face_verified,
      onboarding_completed: !!user.onboarding_completed,
    });
  };

  const updateEdit = (key: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = {
        ...editData,
        annual_income:
          editData.annual_income === "" || editData.annual_income === null
            ? null
            : Number(editData.annual_income),
      };
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setUsers((prev) => prev.map((u) => (u.id === json.user.id ? json.user : u)));
      setSelectedUser(json.user);
      toast.success("User updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const resolveDocUrl = (url?: string | null) => resolvePosterUrl(url);

  const getFaceFrontUrl = (user: AdminUserProfile) => {
    const faceData = user.face_verification || null;
    if (!faceData) return null;
    const candidates = [
      "front_url",
      "front_image_url",
      "front",
      "image_url",
      "url",
      "selfie_url",
      "face_url",
    ];
    for (const key of candidates) {
      const value = (faceData as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
    return null;
  };

  const getUploadedDocs = (user: AdminUserProfile) => {
    const docs = user.uploaded_documents;
    if (Array.isArray(docs)) return docs;
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users ({users.length})</h1>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or state..."
          className="pl-9 neo-inset rounded-xl border-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="neo-elevated-lg rounded-2xl border-0">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">State</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Income</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={resolveDocUrl(getFaceFrontUrl(u)) || ""} />
                            <AvatarFallback className="text-xs">
                              {getInitials(u.full_name || u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {u.full_name || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{u.state || "—"}</td>
                      <td className="py-3 pr-4">{u.caste_category || "—"}</td>
                      <td className="py-3 pr-4">
                        {u.annual_income
                          ? `₹${u.annual_income.toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {u.onboarding_completed ? (
                            <Badge variant="success">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {u.id_verified && (
                            <Badge variant="outline" className="text-xs">
                              ID
                            </Badge>
                          )}
                          {u.face_verified && (
                            <Badge variant="outline" className="text-xs">
                              Face
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUser(u)}
                          className="rounded-xl"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl neo-elevated-lg p-6 border border-border/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={resolveDocUrl(getFaceFrontUrl(selectedUser)) || ""} />
                  <AvatarFallback className="text-sm">
                    {getInitials(selectedUser.full_name || selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {selectedUser.full_name || "Unnamed user"}
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setSelectedUser(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="neo-elevated-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <UserIcon className="h-5 w-5 text-emerald-600" />
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Full Name</label>
                      <Input
                        value={String(editData.full_name || "")}
                        onChange={(e) => updateEdit("full_name", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Email</label>
                      <Input
                        value={String(editData.email || "")}
                        onChange={(e) => updateEdit("email", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Phone</label>
                      <Input
                        value={String(editData.phone || "")}
                        onChange={(e) => updateEdit("phone", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Date of Birth</label>
                      <Input
                        value={String(editData.date_of_birth || "")}
                        onChange={(e) => updateEdit("date_of_birth", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Gender</label>
                      <Input
                        value={String(editData.gender || "")}
                        onChange={(e) => updateEdit("gender", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Aadhaar</label>
                      <Input
                        value={String(editData.aadhaar_number || "")}
                        onChange={(e) => updateEdit("aadhaar_number", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Voter ID</label>
                      <Input
                        value={String(editData.voter_id_number || "")}
                        onChange={(e) => updateEdit("voter_id_number", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Address Line</label>
                      <Input
                        value={String(editData.address_line || "")}
                        onChange={(e) => updateEdit("address_line", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">District</label>
                      <Input
                        value={String(editData.district || "")}
                        onChange={(e) => updateEdit("district", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">State</label>
                      <Input
                        value={String(editData.state || "")}
                        onChange={(e) => updateEdit("state", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Pincode</label>
                      <Input
                        value={String(editData.pincode || "")}
                        onChange={(e) => updateEdit("pincode", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Annual Income</label>
                      <Input
                        type="number"
                        value={String(editData.annual_income ?? "")}
                        onChange={(e) => updateEdit("annual_income", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Caste Category</label>
                      <Input
                        value={String(editData.caste_category || "")}
                        onChange={(e) => updateEdit("caste_category", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Occupation</label>
                      <Input
                        value={String(editData.occupation || "")}
                        onChange={(e) => updateEdit("occupation", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Disability Status</label>
                      <Input
                        value={String(editData.disability_status ?? "")}
                        onChange={(e) => updateEdit("disability_status", e.target.value)}
                        className="neo-inset rounded-xl border-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="neo-elevated-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Shield className="h-5 w-5 text-emerald-600" />
                      Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={Boolean(editData.onboarding_completed)}
                        onCheckedChange={(v) => updateEdit("onboarding_completed", Boolean(v))}
                      />
                      Onboarding Completed
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={Boolean(editData.id_verified)}
                        onCheckedChange={(v) => updateEdit("id_verified", Boolean(v))}
                      />
                      ID Verified
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={Boolean(editData.face_verified)}
                        onCheckedChange={(v) => updateEdit("face_verified", Boolean(v))}
                      />
                      Face Verified
                    </label>
                  </CardContent>
                </Card>

                <Card className="neo-elevated-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Camera className="h-5 w-5 text-emerald-600" />
                      Face Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const url = resolveDocUrl(getFaceFrontUrl(selectedUser));
                      return url ? (
                        <img
                          src={url}
                          alt="Front face verification"
                          className="h-48 w-full object-cover rounded-xl border border-border/60"
                        />
                      ) : (
                        <div className="h-48 rounded-xl border border-dashed border-border/60 bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
                          No face verification image found
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mt-6">
              <Card className="neo-elevated-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {(() => {
                    const idDoc = resolveDocUrl(
                      selectedUser.id_document_url || selectedUser.document_url
                    );
                    return (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 p-3">
                        <div>
                          <div className="font-medium text-foreground">ID Document</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedUser.document_type || "Unknown"}
                          </div>
                        </div>
                        {idDoc ? (
                          <a
                            href={idDoc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not uploaded</span>
                        )}
                      </div>
                    );
                  })()}

                  {getUploadedDocs(selectedUser).length > 0 ? (
                    <div className="space-y-2">
                      {getUploadedDocs(selectedUser).map((doc) => (
                        <div
                          key={`${doc.name}-${doc.url}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border/60 p-3"
                        >
                          <div>
                            <div className="font-medium text-foreground">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {doc.type || "Document"}
                            </div>
                          </div>
                          {doc.url ? (
                            <a
                              href={resolveDocUrl(doc.url) || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">No URL</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No extra documents uploaded.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="neo-elevated-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.interested_tags && selectedUser.interested_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.interested_tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No tags selected.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)} className="rounded-xl">
                Close
              </Button>
              <Button onClick={saveUser} disabled={saving} className="rounded-xl">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

