CREATE TABLE public.keyword_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(field_name, keyword)
);

ALTER TABLE public.keyword_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can read suggestions (needed for registration forms where user is not authenticated)
CREATE POLICY "Anyone can read keyword suggestions"
ON public.keyword_suggestions
FOR SELECT
TO public
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage keyword suggestions"
ON public.keyword_suggestions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));