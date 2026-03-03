
ALTER TABLE public.applications DROP CONSTRAINT applications_message_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_message_check CHECK (char_length(message) >= 30);
