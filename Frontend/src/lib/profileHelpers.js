import { supabase } from './supabaseClient';

const MISSING_PROFILES_TABLE_PATTERN = "Could not find the table 'public.profiles'";

export const isMissingProfilesTableError = (error) =>
  Boolean(error?.message?.includes(MISSING_PROFILES_TABLE_PATTERN));

export const getDashboardRouteForRole = (role) =>
  role === 'landOwner' ? '/dashboard/landowner' : '/dashboard/user';

export const buildProfileFromAuthUser = (user) => {
  const metadata = user?.user_metadata || {};
  const email = user?.email || metadata.email || '';
  const firstName = metadata.first_name || metadata.name?.split(' ')?.[0] || '';
  const lastName =
    metadata.last_name ||
    metadata.name?.split(' ')?.slice(1).join(' ') ||
    '';
  const role = metadata.role || localStorage.getItem('userRole') || 'user';

  return {
    id: user?.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: metadata.phone || '',
    city: metadata.city || '',
    state: metadata.state || '',
    pincode: metadata.pincode || '',
    address: metadata.address || '',
    dob: metadata.dob || null,
    gender: metadata.gender || null,
    role,
    photo_url: metadata.photo_url || null,
    aadhaar_url: metadata.aadhaar_url || null,
    created_at: user?.created_at || null,
  };
};

export async function fetchProfileByUser(user) {
  if (!supabase || !user) {
    return {
      profile: null,
      source: 'none',
      missingProfilesTable: false,
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && data) {
    return {
      profile: data,
      source: 'profiles',
      missingProfilesTable: false,
    };
  }

  if (isMissingProfilesTableError(error)) {
    return {
      profile: buildProfileFromAuthUser(user),
      source: 'auth_metadata',
      missingProfilesTable: true,
    };
  }

  return {
    profile: buildProfileFromAuthUser(user),
    source: 'auth_metadata',
    missingProfilesTable: false,
    error,
  };
}
