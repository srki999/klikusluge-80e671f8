
ALTER TABLE public.notifications DROP CONSTRAINT notifications_ad_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE SET NULL;
