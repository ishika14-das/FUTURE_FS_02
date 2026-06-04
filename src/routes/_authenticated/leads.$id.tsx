import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Calendar, Send } from "lucide-react";
import { SOURCE_LABEL, STATUS_LABEL, statusBadgeClass, type Lead, type LeadStatus } from "@/lib/leads";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  head: () => ({ meta: [{ title: "Lead Details — Nexus CRM" }] }),
  component: LeadDetail,
});

interface FollowUp { id: string; note: string; created_at: string }

function LeadDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const leadQ = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Lead | null;
    },
  });

  const notesQ = useQuery({
    queryKey: ["follow-ups", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("follow_up_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as FollowUp[];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const trimmed = newNote.trim();
      if (!trimmed) throw new Error("Note cannot be empty");
      if (trimmed.length > 2000) throw new Error("Note too long");
      const { error } = await supabase.from("follow_up_notes").insert({
        lead_id: id, note: trimmed, owner_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewNote("");
      qc.invalidateQueries({ queryKey: ["follow-ups", id] });
      toast.success("Note added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: LeadStatus) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status updated");
    },
  });

  if (leadQ.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!leadQ.data) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate({ to: "/leads" })}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
      <p className="text-muted-foreground">Lead not found.</p>
    </div>
  );

  const lead = leadQ.data;

  return (
    <div className="space-y-6 max-w-5xl">
      <Button asChild variant="ghost" size="sm"><Link to="/leads"><ArrowLeft className="h-4 w-4 mr-2" /> Back to leads</Link></Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {lead.email}</span>
            {lead.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {lead.phone}</span>}
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Added {format(new Date(lead.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusBadgeClass(lead.status)}>{STATUS_LABEL[lead.status]}</Badge>
          <Select value={lead.status} onValueChange={(v) => updateStatus.mutate(v as LeadStatus)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Source</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{SOURCE_LABEL[lead.source]}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{STATUS_LABEL[lead.status]}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Last update</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</CardContent></Card>
      </div>

      {lead.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Follow-up history</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Textarea placeholder="Log a new follow-up…" value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
            <div className="flex justify-end">
              <Button onClick={() => addNote.mutate()} disabled={!newNote.trim() || addNote.isPending}>
                <Send className="h-4 w-4 mr-2" /> Add note
              </Button>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            {notesQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
              (notesQ.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No follow-ups yet.</p> :
              (notesQ.data ?? []).map((n) => (
                <div key={n.id} className="border-l-2 border-primary/40 pl-4 py-1">
                  <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}