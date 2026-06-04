import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";
import { STATUS_LABEL, statusBadgeClass, type Lead } from "@/lib/leads";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Nexus CRM" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const total = leads.length;
  const byStatus = (s: string) => leads.filter((l) => l.status === s).length;
  const stats = [
    { label: "Total Leads", value: total, icon: Users, color: "text-primary" },
    { label: "New", value: byStatus("new"), icon: UserPlus, color: "text-[oklch(0.78_0.14_245)]" },
    { label: "Contacted", value: byStatus("contacted"), icon: MessageSquare, color: "text-[oklch(0.85_0.13_80)]" },
    { label: "Converted", value: byStatus("converted"), icon: CheckCircle2, color: "text-[oklch(0.82_0.14_155)]" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your sales pipeline.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{isLoading ? "—" : s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link to="/leads" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet. Add your first one from the Leads page.</p>
          ) : (
            <ul className="divide-y divide-border">
              {leads.slice(0, 6).map((l) => (
                <li key={l.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to="/leads/$id" params={{ id: l.id }} className="font-medium hover:text-primary truncate block">
                      {l.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={statusBadgeClass(l.status)}>{STATUS_LABEL[l.status]}</Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}