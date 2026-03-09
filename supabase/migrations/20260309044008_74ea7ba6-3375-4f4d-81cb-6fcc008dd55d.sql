
-- Table for admin-defined custom profile fields
CREATE TABLE public.custom_profile_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  applies_to public.user_type NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  placeholder text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for storing user values for custom fields
CREATE TABLE public.custom_profile_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.custom_profile_fields(id) ON DELETE CASCADE,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, field_id)
);

-- Enable RLS
ALTER TABLE public.custom_profile_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_profile_values ENABLE ROW LEVEL SECURITY;

-- RLS for custom_profile_fields: anyone authenticated can read, only admins can manage
CREATE POLICY "Anyone authenticated can view custom fields"
  ON public.custom_profile_fields FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage custom fields"
  ON public.custom_profile_fields FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for custom_profile_values: users can manage own, admins can manage all
CREATE POLICY "Users can view own custom values"
  ON public.custom_profile_values FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can upsert own custom values"
  ON public.custom_profile_values FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own custom values"
  ON public.custom_profile_values FOR UPDATE TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all custom values"
  ON public.custom_profile_values FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Approved users can view custom values of other approved profiles
CREATE POLICY "Approved users can view other approved profile custom values"
  ON public.custom_profile_values FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE approval_status = 'approved'
    )
    AND public.is_user_approved(auth.uid())
  );

-- Update trigger for updated_at
CREATE TRIGGER update_custom_profile_fields_updated_at
  BEFORE UPDATE ON public.custom_profile_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_profile_values_updated_at
  BEFORE UPDATE ON public.custom_profile_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
