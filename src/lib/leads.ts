export type LeadStatus = "new" | "contacted" | "converted";
export type LeadSource = "website" | "linkedin" | "instagram" | "referral" | "other";

export interface Lead {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
};

export const SOURCE_LABEL: Record<LeadSource, string> = {
  website: "Website",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  referral: "Referral",
  other: "Other",
};

export function statusBadgeClass(s: LeadStatus) {
  if (s === "new") return "bg-[oklch(0.7_0.16_245/.18)] text-[oklch(0.85_0.12_245)] border-[oklch(0.7_0.16_245/.3)]";
  if (s === "contacted") return "bg-[oklch(0.78_0.16_80/.18)] text-[oklch(0.88_0.13_80)] border-[oklch(0.78_0.16_80/.3)]";
  return "bg-[oklch(0.72_0.17_155/.18)] text-[oklch(0.85_0.14_155)] border-[oklch(0.72_0.17_155/.3)]";
}