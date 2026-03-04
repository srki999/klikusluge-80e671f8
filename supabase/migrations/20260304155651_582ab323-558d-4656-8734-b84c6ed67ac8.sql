
CREATE OR REPLACE FUNCTION public.reject_application(p_application_id uuid, p_notification_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_app RECORD;
  v_ad RECORD;
BEGIN
  SELECT * INTO v_app FROM applications WHERE id = p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;

  SELECT * INTO v_ad FROM ads WHERE id = v_app.ad_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ad not found'; END IF;

  IF v_ad.user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  INSERT INTO notifications (user_id, ad_id, applicant_id, message)
  VALUES (
    v_app.user_id,
    v_app.ad_id,
    v_ad.user_id,
    CONCAT('Vaša prijava za oglas "', COALESCE(NULLIF(v_ad.title, ''), v_ad.category), '" je nažalost odbijena.')
  );

  -- Delete the original "someone applied" notification from the ad owner
  DELETE FROM notifications WHERE id = p_notification_id;

  DELETE FROM applications WHERE id = p_application_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_ad_owner_on_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Delete any existing notification for the same ad and applicant (duplicate application)
  DELETE FROM public.notifications
  WHERE ad_id = NEW.ad_id
    AND applicant_id = NEW.user_id
    AND user_id = v_ad_owner_id;

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
$function$;
