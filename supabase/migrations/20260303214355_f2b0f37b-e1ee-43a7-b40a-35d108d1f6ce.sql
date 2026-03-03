
CREATE OR REPLACE FUNCTION public.accept_application(p_application_id uuid, p_notification_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_app RECORD;
  v_ad RECORD;
  v_applicant_profile RECORD;
  v_owner_profile RECORD;
  v_applicant_email TEXT;
  v_owner_email TEXT;
BEGIN
  SELECT * INTO v_app FROM applications WHERE id = p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;

  SELECT * INTO v_ad FROM ads WHERE id = v_app.ad_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ad not found'; END IF;

  IF v_ad.user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_applicant_profile FROM profiles WHERE user_id = v_app.user_id;
  SELECT email INTO v_applicant_email FROM auth.users WHERE id = v_app.user_id;

  SELECT * INTO v_owner_profile FROM profiles WHERE user_id = v_ad.user_id;
  SELECT email INTO v_owner_email FROM auth.users WHERE id = v_ad.user_id;

  -- Notify applicant with owner contact info
  INSERT INTO notifications (user_id, ad_id, applicant_id, message)
  VALUES (
    v_app.user_id,
    v_app.ad_id,
    v_ad.user_id,
    CONCAT('Vaša prijava za oglas "', COALESCE(NULLIF(v_ad.title, ''), v_ad.category),
      '" je prihvaćena! Kontakt: ', v_owner_profile.ime, ' ', v_owner_profile.prezime,
      ', ', v_owner_email,
      CASE WHEN v_owner_profile.telefon != '' THEN CONCAT(', ', v_owner_profile.telefon) ELSE '' END)
  );

  -- Notify owner (self) with applicant contact info
  INSERT INTO notifications (user_id, ad_id, applicant_id, message)
  VALUES (
    v_ad.user_id,
    v_app.ad_id,
    v_app.user_id,
    CONCAT('Prihvatili ste prijavu za oglas "', COALESCE(NULLIF(v_ad.title, ''), v_ad.category),
      '". Kontakt: ', v_applicant_profile.ime, ' ', v_applicant_profile.prezime,
      ', ', v_applicant_email,
      CASE WHEN v_applicant_profile.telefon != '' THEN CONCAT(', ', v_applicant_profile.telefon) ELSE '' END)
  );

  -- Notify other applicants that the ad is closed
  INSERT INTO notifications (user_id, ad_id, applicant_id, message)
  SELECT DISTINCT a2.user_id, v_app.ad_id, v_ad.user_id,
    CONCAT('Oglas "', COALESCE(NULLIF(v_ad.title, ''), v_ad.category), '" je zatvoren.')
  FROM applications a2
  WHERE a2.ad_id = v_app.ad_id AND a2.user_id != v_app.user_id;

  -- Delete all applications for this ad
  DELETE FROM applications WHERE ad_id = v_app.ad_id;

  -- Delete the ad
  DELETE FROM ads WHERE id = v_app.ad_id;

  RETURN json_build_object(
    'ime', v_applicant_profile.ime,
    'prezime', v_applicant_profile.prezime,
    'email', v_applicant_email,
    'telefon', v_applicant_profile.telefon
  );
END;
$function$;
