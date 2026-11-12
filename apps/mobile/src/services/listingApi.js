import { supabase } from './supabase';
import { createListingApi } from './listingRepository';
export const listingApi = supabase ? createListingApi(supabase) : null;
