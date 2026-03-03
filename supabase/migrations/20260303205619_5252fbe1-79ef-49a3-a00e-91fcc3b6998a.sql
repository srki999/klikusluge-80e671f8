
-- Replace the overly permissive insert policy with a restrictive one
-- Notifications are only created by the SECURITY DEFINER trigger, not by users directly
DROP POLICY "System can insert notifications" ON public.notifications;

-- No direct insert policy needed since the trigger uses SECURITY DEFINER
-- But we need to allow the trigger function to insert, so we use a service role approach
-- The SECURITY DEFINER function bypasses RLS, so no INSERT policy is needed
