
-- Add prominence_level column to ads table
ALTER TABLE public.ads ADD COLUMN prominence_level integer NOT NULL DEFAULT 1;

-- Update all existing ads to level 1
UPDATE public.ads SET prominence_level = 1;
