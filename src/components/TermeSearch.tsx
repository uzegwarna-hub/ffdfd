import React, { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TermeSearch: React.FC = () => {
  const [contractNumber, setContractNumber] = useState('');
  const [echeance, setEcheance] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('rapport')
        .select('*')
        .eq('numero_contrat', contractNumber)
        .eq('type', 'Terme')
        .eq('echeance', echeance)
        .single();

      if (error) {
        setError(`Erreur lors de la recherche: ${error.message}`);
      } else if (data) {
        setResult(data);
        setContractNumber('');
        setEcheance('');
      } else {
        setError('Aucun résultat trouvé pour ce contrat et cette échéance.');
      }
    } catch (err: any) {
      setError(`Erreur inattendue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportCreditSituation = async () => {
    if (!result?.numero_contrat) return;

    try {
      const { data, error } = await supabase
        .from('liste_credits')
        .select('*')
        .eq('numero_contrat', result.numero_contrat);

      if (error) {
        setError(`Erreur lors de l'export: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        // Créer un fichier CSV pour l'export
        const headers = Object.keys(data[0]).join(',');
        const csvData = data.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          ).join(',')
        ).join('\n');
        
        const csvContent = `${headers}\n${csvData}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `situation_credit_${result.numero_contrat}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Aucune donnée de crédit trouvée pour ce contrat.');
      }
    } catch (err: any) {
      setError(`Erreur lors de l'export: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-5">Recherche Terme</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="contractNumber" className="block text-gray-700 text-sm font-bold mb-2">
            Numéro de Contrat:
          </label>
          <input
            type="text"
            id="contractNumber"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="echeance" className="block text-gray-700 text-sm font-bold mb-2">
            Échéance (AAAA-MM-JJ):
          </label>
          <input
            type="date"
            id="echeance"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={echeance}
            onChange={(e) => setEcheance(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center space-x-2"
        disabled={loading}
      >
        <Search className="w-5 h-5" />
        <span>Rechercher</span>
      </button>

      {loading && <p className="mt-3 text-gray-500">Recherche en cours...</p>}
      {error && <p className="mt-3 text-red-500">{error}</p>}

      {result && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Résultat:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Assuré:</strong> {result.assure}</p>
              <p><strong>Prime:</strong> {result.prime}</p>
              <p><strong>Montant Crédit:</strong> {result.montant_credit || 'N/A'}</p>
              <p><strong>Montant payé:</strong> {result.montant}</p>
              <p><strong>Utilisateur:</strong> {result.cree_par}</p>
            </div>
            <div>
              <p><strong>Date de Paiement:</strong> {result.created_at ? new Date(result.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
              <p><strong>Date de Paiement Prévue:</strong> {result.date_paiement_prevu ? new Date(result.date_paiement_prevu).toLocaleDateString('fr-FR') : 'N/A'}</p>
            </div>
          </div>

          {/* Bouton pour visualiser la situation du crédit */}
          {result.montant_credit && result.montant_credit !== 'N/A' && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={exportCreditSituation}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Visualiser la situation du crédit</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TermeSearch;