// Dans utils/supabaseService.js
export const searchCreditByContractNumberAndEcheance = async (contractNumber, echeance) => {
  try {
    const { data, error } = await supabase
      .from('rapport')
      .select('*')
      .eq('numero_contrat', contractNumber)
      .eq('echeance', echeance)
      .eq('type', 'Terme')
      .single();

    if (error) {
      console.error('Erreur recherche crédit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur recherche crédit:', error);
    return null;
  }
};