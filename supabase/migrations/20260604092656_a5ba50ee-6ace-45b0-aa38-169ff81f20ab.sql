
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'converted');
CREATE TYPE public.lead_source AS ENUM ('website', 'linkedin', 'instagram', 'referral', 'other');

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source public.lead_source NOT NULL DEFAULT 'other',
  status public.lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage leads" ON public.leads FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.follow_up_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_notes TO authenticated;
GRANT ALL ON public.follow_up_notes TO service_role;
ALTER TABLE public.follow_up_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage follow-up notes" ON public.follow_up_notes FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_leads_owner ON public.leads(owner_id, created_at DESC);
CREATE INDEX idx_followups_lead ON public.follow_up_notes(lead_id, created_at DESC);
