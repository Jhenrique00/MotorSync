import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import { environment, backendStatus } from '../config/environment';
import { sessionStorage } from './sessionStorage';
export const supabase = backendStatus.configured
  ? createClient(environment.url, environment.key, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;
