import { supabase } from './supabase';
import { createVehicleApi } from './vehicleRepository';
export { createVehicleApi } from './vehicleRepository';
export const vehicleApi = supabase ? createVehicleApi(supabase) : null;
