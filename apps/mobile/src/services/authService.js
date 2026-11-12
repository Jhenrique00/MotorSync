import { supabase } from './supabase';
import { createAuthApi } from './authApi';
export const { signIn, signUp, signOut } = createAuthApi(supabase);
