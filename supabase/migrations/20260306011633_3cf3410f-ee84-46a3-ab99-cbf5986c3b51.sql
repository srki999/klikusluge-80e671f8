
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
  v_applicant_iskustva TEXT;
  v_iskustva_text TEXT;
BEGIN
  -- Get the ad owner
  SELECT user_id, COALESCE(NULLIF(title, ''), category) INTO v_ad_owner_id, v_ad_title
  FROM public.ads WHERE id = NEW.ad_id;

  -- Get applicant name and iskustva
  SELECT CONCAT(ime, ' ', prezime), iskustva INTO v_applicant_name, v_applicant_iskustva
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Format iskustva text
  IF v_applicant_iskustva IS NULL OR TRIM(v_applicant_iskustva) = '' THEN
    v_iskustva_text := 'Korisnik nema specijalna iskustva.';
  ELSE
    v_iskustva_text := v_applicant_iskustva;
  END IF;

  -- Delete old application(s) for the same ad and user (keep only the new one)
  DELETE FROM public.applications
  WHERE ad_id = NEW.ad_id
    AND user_id = NEW.user_id
    AND id != NEW.id;

  -- Delete any existing notification for the same ad and applicant
  DELETE FROM public.notifications
  WHERE ad_id = NEW.ad_id
    AND applicant_id = NEW.user_id
    AND user_id = v_ad_owner_id;

  -- Insert notification with the NEW application's data including iskustva
  INSERT INTO public.notifications (user_id, ad_id, applicant_id, message)
  VALUES (
    v_ad_owner_id,
    NEW.ad_id,
    NEW.user_id,
    CONCAT(
      COALESCE(NULLIF(TRIM(v_applicant_name), ''), 'Korisnik'),
      ' se prijavio/la na vaš oglas "', v_ad_title,
      '" sa ponudom od ', NEW.price_rsd, ' RSD.',
      E'\n\nIskustva: ', v_iskustva_text
    )
  );

  RETURN NEW;
END;
$function$;
