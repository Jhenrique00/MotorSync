import { supabase } from './supabase';
import { createListingFavoritesRepository } from './listingFavoritesRepository';

export const listingFavoritesApi = supabase ? createListingFavoritesRepository(supabase) : null;
