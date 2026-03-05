
-- Update RLS on user_roles to allow super_admins to manage roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Super admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admins to also view all roles (already covered by admin policy but let's add)
CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admins same delete privileges on ads and profiles
CREATE POLICY "Super admins can delete ads" ON public.ads
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can also view all ads and profiles (already covered by existing policies)
