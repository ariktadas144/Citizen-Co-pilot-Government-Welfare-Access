"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, FileText, ClipboardList, TrendingUp, Bell, Building2, Settings, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalSchemes: number;
  totalApplications: number;
  verifiedUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string | null; email: string | null; onboarding_completed: boolean }>>([]);
  const [schemes, setSchemes] = useState<Array<{ id: string; scheme_name: string; category: string; created_at: string }>>([]);
  const [view, setView] = useState<"overview" | "recent">("overview");

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, schemesRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/schemes"),
        ]);
        const users = await usersRes.json();
        const schemes = await schemesRes.json();

        if (!usersRes.ok || !schemesRes.ok) throw new Error("Failed to fetch");

        const profiles = users.users || [];
        setStats({
          totalUsers: profiles.length,
          totalSchemes: (schemes.schemes || []).length,
          totalApplications: 0, // Would need a dedicated endpoint
          verifiedUsers: profiles.filter(
            (p: { onboarding_completed: boolean }) => p.onboarding_completed
          ).length,
        });
        setProfiles(profiles.slice(0, 6));
        setSchemes((schemes.schemes || []).slice(0, 6));
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Verified Users",
      value: stats?.verifiedUsers ?? 0,
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      title: "Active Schemes",
      value: stats?.totalSchemes ?? 0,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Applications",
      value: stats?.totalApplications ?? 0,
      icon: ClipboardList,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor users, schemes, and org requests in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("overview")}
            className="rounded-xl"
          >
            Overview
          </Button>
          <Button
            variant={view === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("recent")}
            className="rounded-xl"
          >
            Recent Activity
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="neo-elevated-lg rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.title}
              </CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{c.value}</div>
              {c.title === "Verified Users" && stats?.totalUsers ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}% verified
                </p>
              ) : null}
            </CardContent>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="neo-elevated-lg rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="text-sm text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/admin/users", label: "Manage Users", icon: Users },
              { href: "/admin/schemes", label: "Manage Schemes", icon: FileText },
              { href: "/admin/organizations", label: "Organizations", icon: Building2 },
              { href: "/admin/notifications", label: "Send Notifications", icon: Bell },
              { href: "/admin/organizations", label: "Pending Requests", icon: ClipboardList },
              { href: "/organization/dashboard/settings", label: "Settings", icon: Settings },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="block">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 text-sm">
                    <item.icon className="h-4 w-4 text-emerald-600" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="neo-elevated-lg rounded-2xl border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-foreground">
              {view === "overview" ? "Recent Schemes" : "Recent Users"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view === "overview" ? (
              schemes.length > 0 ? (
                schemes.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.scheme_name}</div>
                      <div className="text-xs text-muted-foreground">{s.category}</div>
                    </div>
                    <Badge variant="outline">Scheme</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No schemes yet.</div>
              )
            ) : profiles.length > 0 ? (
              profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{p.full_name || "Unnamed user"}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </div>
                  <Badge variant={p.onboarding_completed ? "success" : "secondary"}>
                    {p.onboarding_completed ? "Verified" : "Pending"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No users yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

