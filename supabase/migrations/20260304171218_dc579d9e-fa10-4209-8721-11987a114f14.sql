CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;