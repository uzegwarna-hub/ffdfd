import React, { useState, useEffect } from 'react';
import { CreditCard, Filter, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getCredits, updateCreditStatus } from '../utils/supabaseService';

const CreditsList: React.FC = () => {
  const [credits, setCredits] = useState<any[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    statut: 'all',
    branche: 'all',
    createdBy: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, credits]);

  const loadCredits = async () => {
    try {
      setIsLoading(true);
      const data = await getCredits();
      setCredits(data);
      setFilteredCredits(data);
    } catch (error) {
      console.error('Erreur lors du chargement des crédits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = credits.filter(credit => {
      const creditDate = new Date(credit.created_at);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date('1900-01-01');
      const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-12-31');
      
      return (
        (filters.statut === 'all' || credit.statut === filters.statut) &&
        (filters.branche === 'all' || credit.branche === filters.branche) &&
        (filters.createdBy === 'all' || credit.cree_par === filters.createdBy) &&
        creditDate >= fromDate && creditDate <= toDate
      );
    });
    
    setFilteredCredits(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    const datePaiement = newStatus === 'Payé' ? new Date().toISOString().split('T')[0] : undefined;
    
    try {
      const success = await updateCreditStatus(id, newStatus, datePaiement);
      if (success) {
        await loadCredits(); // Recharger les données
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Payé':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'En retard':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Payé':
        return 'bg-green-100 text-green-800';
      case 'En retard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const calculateStats = () => {
    const totalCredits = filteredCredits.length;
    const totalMontant = filteredCredits.reduce((sum, credit) => sum + credit.montant_credit, 0);
    const payes = filteredCredits.filter(c => c.statut === 'Payé').length;
    const nonPayes = filteredCredits.filter(c => c.statut === 'Non payé').length;
    const enRetard = filteredCredits.filter(c => c.statut === 'En retard').length;

    return { totalCredits, totalMontant, payes, nonPayes, enRetard };
  };

  const stats = calculateStats();
  const uniqueUsers = [...new Set(credits.map(c => c.cree_par))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Chargement des crédits...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Liste des Crédits</h2>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Total Crédits</p>
                <p className="text-xl font-bold text-blue-900">{stats.totalCredits}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">DT</div>
              <div>
                <p className="text-sm font-medium text-purple-600">Montant Total</p>
                <p className="text-xl font-bold text-purple-900">{stats.totalMontant.toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Payés</p>
                <p className="text-xl font-bold text-green-900">{stats.payes}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-600">Non Payés</p>
                <p className="text-xl font-bold text-orange-900">{stats.nonPayes}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-600">En Retard</p>
                <p className="text-xl font-bold text-red-900">{stats.enRetard}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select
              name="statut"
              value={filters.statut}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="Non payé">Non payé</option>
              <option value="Payé">Payé</option>
              <option value="En retard">En retard</option>
            </select>

            <select
              name="branche"
              value={filters.branche}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les branches</option>
              <option value="Auto">Auto</option>
              <option value="Vie">Vie</option>
              <option value="Santé">Santé</option>
              <option value="IRDS">IRDS</option>
            </select>

            <select
              name="createdBy"
              value={filters.createdBy}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les utilisateurs</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>

            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date début"
            />

            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date fin"
            />
          </div>
        </div>

        {/* Liste des crédits */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro Contrat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assuré
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branche
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prime (DT)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant Crédit (DT)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement (DT)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solde (DT)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Prévue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCredits.map((credit) => (
                <tr key={credit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {credit.numero_contrat}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.assure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.branche}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.prime.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {credit.montant_credit.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(credit.paiement || 0).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-semibold ${
                      credit.solde >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {credit.solde?.toLocaleString('fr-FR') || '0'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.date_paiement_prevue ? new Date(credit.date_paiement_prevue).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(credit.statut)}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(credit.statut)}`}>
                        {credit.statut}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.date_paiement_effectif ? new Date(credit.date_paiement_effectif).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.cree_par}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {credit.statut !== 'Payé' && (
                        <button
                          onClick={() => handleStatusUpdate(credit.id, 'Payé')}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200"
                          title="Marquer comme payé"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {credit.statut === 'Non payé' && (
                        <button
                          onClick={() => handleStatusUpdate(credit.id, 'En retard')}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          title="Marquer en retard"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCredits.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun crédit trouvé avec les filtres sélectionnés
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditsList;
