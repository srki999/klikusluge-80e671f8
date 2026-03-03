
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- System inserts via trigger (security definer)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger function to auto-create notification on new application
CREATE OR REPLACE FUNCTION public.notify_ad_owner_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ad_owner_id UUID;
  v_ad_title TEXT;
  v_applicant_name TEXT;
BEGIN
  -- Get the ad owner
  SELECT user_id, COALESCE(NULLIF(title, ''), category) INTO v_ad_owner_id, v_ad_title
  FROM public.ads WHERE id = NEW.ad_id;

  -- Get applicant name
  SELECT CONCAT(ime, ' ', prezime) INTO v_applicant_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Insert notification for ad owner
  INSERT INTO public.notifications (user_id, ad_id, applicant_id, message)
  VALUES (
    v_ad_owner_id,
    NEW.ad_id,
    NEW.user_id,
    CONCAT(COALESCE(NULLIF(TRIM(v_applicant_name), ''), 'Korisnik'), ' se prijavio/la na vaš oglas "', v_ad_title, '" sa ponudom od ', NEW.price_rsd, ' RSD.')
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_new_application_notify
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_ad_owner_on_application();
