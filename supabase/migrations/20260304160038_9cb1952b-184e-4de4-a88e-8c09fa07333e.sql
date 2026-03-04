
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

  -- Insert notification with the NEW application's data
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
