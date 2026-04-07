import { supabase } from '../lib/supabase';
import { Location } from '../components/LocationSearch';

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  state: string | null;
  postcode: string | null;
  is_favorite: boolean;
  created_at: string;
}

export async function getFavoriteLocation(userId: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('saved_locations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    name: data.name,
    lat: data.latitude,
    lon: data.longitude,
    country: data.country,
    state: data.state || undefined,
    postcode: data.postcode || undefined,
  };
}

export async function getSavedLocations(userId: string): Promise<SavedLocation[]> {
  const { data, error } = await supabase
    .from('saved_locations')
    .select('*')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching saved locations:', error);
    return [];
  }

  return data || [];
}

export async function saveLocation(userId: string, location: Location): Promise<SavedLocation | null> {
  const { data, error } = await supabase
    .from('saved_locations')
    .insert({
      user_id: userId,
      name: location.name,
      latitude: location.lat,
      longitude: location.lon,
      country: location.country,
      state: location.state || null,
      postcode: location.postcode || null,
      is_favorite: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving location:', error);
    return null;
  }

  return data;
}

export async function setFavoriteLocation(userId: string, locationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_locations')
    .update({ is_favorite: false })
    .eq('user_id', userId)
    .eq('is_favorite', true);

  if (error) {
    console.error('Error clearing previous favorite:', error);
    return false;
  }

  const { error: updateError } = await supabase
    .from('saved_locations')
    .update({ is_favorite: true })
    .eq('id', locationId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error setting favorite:', updateError);
    return false;
  }

  return true;
}

export async function deleteSavedLocation(userId: string, locationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_locations')
    .delete()
    .eq('id', locationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting location:', error);
    return false;
  }

  return true;
}
