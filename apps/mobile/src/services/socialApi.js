import { supabase } from './supabase';
import { createSocialApi } from './socialRepository';

export const socialApi = supabase ? createSocialApi(supabase) : null;
