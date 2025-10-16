import React, { useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TermeSearch: React.FC = () => {
  const [contractNumber, setContractNumber] = useState('');
  const [echeance, setEcheance] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredit, setShowCredit] = useState(false);
  const [creditData, setCreditData] = useState<any[]>([]);
  const [loadingCredit, setLoadingCredit] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setShowCredit(false);
    setCreditData([]);

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

  const fetchCreditSituation = async () => {
    if (!result?.numero_contrat) return;

    setLoadingCredit(true);
    try {
      const { data, error } = await supabase
        .from('liste_credits')
        .select('*')
        .eq('numero_contrat', result.numero_contrat)
        .order('date_paiement_effectif', { ascending: true });

      if (error) {
        setError(`Erreur lors du chargement des crédits: ${error.message}`);
        return;
      }

      setCreditData(data || []);
      setShowCredit(true);
    } catch (err: any) {
      setError(`Erreur inattendue: ${err.message}`);
    } finally {
      setLoadingCredit(false);
    }
  };

  const toggleCreditView = () => {
    if (!showCredit) {
      fetchCreditSituation();
    } else {
      setShowCredit(false);
      setCreditData([]);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '0,00';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultat:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p><strong>Assuré:</strong> {result.assure}</p>
              <p><strong>Prime:</strong> {result.prime}</p>
              <p><strong>Montant Crédit:</strong> {result.montant_credit || 'N/A'}</p>
              <p><strong>Montant payé:</strong> {result.montant}</p>
              <p><strong>Utilisateur:</strong> {result.cree_par}</p>
            </div>
            <div>
              <p><strong>Date de Paiement:</strong> {formatDate(result.created_at)}</p>
              <p><strong>Date de Paiement Prévue:</strong> {formatDate(result.date_paiement_prevu)}</p>
            </div>
          </div>

          {/* Bouton pour visualiser la situation du crédit */}
          {result.montant_credit && result.montant_credit !== 'N/A' && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={toggleCreditView}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center space-x-2"
                disabled={loadingCredit}
              >
                {showCredit ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span>
                  {loadingCredit ? 'Chargement...' : 
                   showCredit ? 'Masquer la situation du crédit' : 
                   'Visualiser la situation du crédit'}
                </span>
              </button>

              {/* Affichage de la situation du crédit */}
              {showCredit && creditData.length > 0 && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Situation du Crédit - Contrat {result.numero_contrat}
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Date Paiement Effectif
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Paiement
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Solde
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {creditData.map((credit, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                credit.statut === 'Payé' 
                                  ? 'bg-green-100 text-green-800'
                                  : credit.statut === 'En attente'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {credit.statut || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(credit.date_paiement_effectif)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {formatCurrency(credit.paiement)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {formatCurrency(credit.solde)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Résumé du crédit */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Paiements</p>
                      <p className="text-lg font-semibold text-blue-700">
                        {formatCurrency(creditData.reduce((sum, credit) => sum + (credit.paiement || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Solde Actuel</p>
                      <p className="text-lg font-semibold text-green-700">
                        {creditData.length > 0 ? formatCurrency(creditData[creditData.length - 1].solde) : '0,00'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Nombre d'échéances</p>
                      <p className="text-lg font-semibold text-purple-700">
                        {creditData.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showCredit && creditData.length === 0 && !loadingCredit && (
                <div className="mt-4 text-center py-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-700">Aucune donnée de crédit trouvée pour ce contrat.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TermeSearch;