
-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price DECIMAL NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Users can view their own ads
CREATE POLICY "Users can view own ads"
ON public.ads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own ads
CREATE POLICY "Users can insert own ads"
ON public.ads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ads
CREATE POLICY "Users can update own ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Public can view all ads (for listing on homepage)
CREATE POLICY "Anyone can view ads"
ON public.ads
FOR SELECT
USING (true);
