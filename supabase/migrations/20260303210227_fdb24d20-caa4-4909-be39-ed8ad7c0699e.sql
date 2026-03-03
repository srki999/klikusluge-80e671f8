
-- Allow anyone authenticated to view basic profile info (ime, prezime, telefon)
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
