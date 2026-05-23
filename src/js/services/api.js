import { supabase } from '../config/supabase.js';

export const ApiService = {
  async fetchPacientes() {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  async savePaciente(payload, id = null) {
    if (id) {
      const { data, error } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deletePaciente(id) {
    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};