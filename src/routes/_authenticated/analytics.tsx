import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SOURCE_LABEL, STATUS_LABEL, type Lead } from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Nexus CRM" }] }),
  component: Analytics,
});

const STATUS_COLORS: Record<string, string> = {
  new: "oklch(0.7 0.16 245)",
  contacted: "oklch(0.78 0.16 80)",
  converted: "oklch(0.72 0.17 155)",
};

function Analytics() {
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      return data as Lead[];
    },
  });

  const total = leads.length;
  const converted = leads.filter((l) => l.status === "converted").length;
  const conversionRate = total ? Math.round((converted / total) * 100) : 0;

  const sourceData = Object.entries(SOURCE_LABEL).map(([k, label]) => ({
    name: label, value: leads.filter((l) => l.source === k).length,
  }));
  const statusData = Object.entries(STATUS_LABEL).map(([k, label]) => ({
    name: label, key: k, value: leads.filter((l) => l.status === k).length,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Pipeline insights and performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total leads</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{total}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Converted</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{converted}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Conversion rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-primary">{conversionRate}%</CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <XAxis dataKey="name" stroke="oklch(0.7 0.02 250)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.018 250)", border: "1px solid oklch(0.3 0.018 250)", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="oklch(0.7 0.16 245)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {statusData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.22 0.018 250)", border: "1px solid oklch(0.3 0.018 250)", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-sm mt-2">
              {statusData.map((d) => (
                <div key={d.key} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_COLORS[d.key] }} />
                  <span>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}