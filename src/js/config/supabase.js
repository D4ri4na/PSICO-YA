import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://badevyjmzybvordmsvbn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZGV2eWptenlidm9yZG1zdmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTM0MTYsImV4cCI6MjA4OTA2OTQxNn0.M2T-CuNbZwXq0zYZTa_2ykvvjTMbdcaoFUz_CAx_L1U'; // Agrega aquí tu Key real completa sin recortes

export const supabase = supabase.createClient(supabaseUrl, supabaseKey);