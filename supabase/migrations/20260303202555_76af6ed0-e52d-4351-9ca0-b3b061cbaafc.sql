
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  price_rsd NUMERIC NOT NULL CHECK (price_rsd > 0),
  message TEXT NOT NULL CHECK (char_length(message) >= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own applications"
ON public.applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own applications"
ON public.applications FOR SELECT
USING (auth.uid() = user_id);

-- Ad owners can see applications on their ads
CREATE POLICY "Ad owners can view applications"
ON public.applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ads WHERE ads.id = applications.ad_id AND ads.user_id = auth.uid()
  )
);
