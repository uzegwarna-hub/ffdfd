import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, DollarSign, FileText, Users, Trash2, Filter, PieChart, TrendingUp } from 'lucide-react';
import { getContracts, exportToXLSX } from '../utils/storage';
import { Contract } from '../types';
import { getAffaireContracts, getRapportContracts, getTermeContracts, deleteRapportContract, deleteAffaireContract, deleteTermeContract, getFilteredDataForExport } from '../utils/supabaseService';
import { getSessionDate } from '../utils/auth';

const ReportGenerator: React.FC = () => {
  const [rapportContracts, setRapportContracts] = useState<any[]>([]);
  const [sessionRapportContracts, setSessionRapportContracts] = useState<any[]>([]);
  const [localContracts, setLocalContracts] = useState<Contract[]>([]);
  const [affaireContracts, setAffaireContracts] = useState<any[]>([]);
  const [sessionAffaireContracts, setSessionAffaireContracts] = useState<any[]>([]);
  const [termeContracts, setTermeContracts] = useState<any[]>([]);
  const [sessionTermeContracts, setSessionTermeContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    type: 'all',
    branch: 'all',
    paymentMode: 'all',
    dateFrom: '',
    dateTo: '',
    createdBy: 'all'
  });
  const [showSessionData, setShowSessionData] = useState(true);

  useEffect(() => {
    const localData = getContracts();
    setLocalContracts(localData);
    loadRapportContracts();
    loadAffaireContracts();
    loadTermeContracts();
  }, []);

  const loadRapportContracts = async () => {
    try {
      console.log('🔄 Chargement des contrats rapport...');
      const rapportData = await getRapportContracts();
      console.log('📊 Données rapport reçues:', rapportData.length, 'contrats');
      console.log('🔍 Premier contrat:', rapportData[0]);
      setRapportContracts(rapportData);
      
      const sessionDate = getSessionDate();
      const sessionData = rapportData.filter(contract => {
        const contractDate = new Date(contract.created_at).toISOString().split('T')[0];
        return contractDate === sessionDate;
      });
      
      setSessionRapportContracts(sessionData);
      setFilteredContracts(showSessionData ? sessionData : rapportData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des contrats rapport:', error);
    }
  };

  const loadAffaireContracts = async () => {
    try {
      const affaires = await getAffaireContracts();
      setAffaireContracts(affaires);
      
      const sessionDate = getSessionDate();
      const sessionAffaires = affaires.filter(contract => {
        const contractDate = new Date(contract.created_at).toISOString().split('T')[0];
        return contractDate === sessionDate;
      });
      setSessionAffaireContracts(sessionAffaires);
      
      console.log('Contrats Affaire chargés:', affaires.length);
    } catch (error) {
      console.error('Erreur lors du chargement des contrats Affaire:', error);
    }
  };

  const loadTermeContracts = async () => {
    try {
      const termes = await getTermeContracts();
      setTermeContracts(termes);
      
      const sessionDate = getSessionDate();
      const sessionTermes = termes.filter(contract => {
        const contractDate = new Date(contract.created_at).toISOString().split('T')[0];
        return contractDate === sessionDate;
      });
      setSessionTermeContracts(sessionTermes);
      
      console.log('Contrats Terme chargés:', termes.length);
    } catch (error) {
      console.error('Erreur lors du chargement des contrats Terme:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, rapportContracts, sessionRapportContracts, showSessionData]);

  const applyFilters = () => {
    const sourceData = showSessionData ? sessionRapportContracts : rapportContracts;
    let filtered = sourceData.filter(contract => {
      const contractDate = new Date(contract.created_at);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date('1900-01-01');
      const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-12-31');
      
      return (
        (filters.type === 'all' || contract.type === filters.type) &&
        (filters.branch === 'all' || contract.branche === filters.branch) &&
        (filters.paymentMode === 'all' || contract.mode_paiement === filters.paymentMode) &&
        (filters.createdBy === 'all' || contract.cree_par === filters.createdBy) &&
        contractDate >= fromDate && contractDate <= toDate
      );
    });
    
    console.log('🔍 Filtres appliqués:', filters, 'Session:', showSessionData);
    console.log('📊 Contrats filtrés:', filtered.length, 'sur', sourceData.length);
    setFilteredContracts(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateStats = () => {
    const totalContracts = filteredContracts.length;
    const totalPremium = filteredContracts.reduce((sum, contract) => sum + (contract.prime || 0), 0);
    const totalMontant = filteredContracts.reduce((sum, contract) => sum + (contract.montant || 0), 0);
    const avgPremium = totalContracts > 0 ? totalPremium / totalContracts : 0;
    
    const byType = filteredContracts.reduce((acc, contract) => {
      acc[contract.type] = (acc[contract.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byBranch = filteredContracts.reduce((acc, contract) => {
      acc[contract.branche] = (acc[contract.branche] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPaymentMode = filteredContracts.reduce((acc, contract) => {
      acc[contract.mode_paiement] = (acc[contract.mode_paiement] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalContracts,
      totalPremium,
      totalMontant,
      avgPremium,
      byType,
      byBranch,
      byPaymentMode
    };
  };

  const exportToExcel = async () => {
    if (!filters.type || filters.type === 'all') {
      alert('Veuillez sélectionner un type avant d\'exporter');
      return;
    }

    if (!filters.dateFrom) {
      alert('Veuillez sélectionner une date de début');
      return;
    }

    if (!filters.dateTo) {
      alert('Veuillez sélectionner une date de fin');
      return;
    }

    try {
      let filteredData = [];

      if (filters.type === 'Rapport') {
        filteredData = await getFilteredDataForExport(
          'all',
          filters.dateFrom,
          filters.dateTo
        );
      } else {
        filteredData = await getFilteredDataForExport(
          filters.type,
          filters.dateFrom,
          filters.dateTo
        );
      }

      if (filteredData.length === 0) {
        alert('Aucune donnée à exporter avec les filtres sélectionnés');
        return;
      }

      const contractsForExport = filteredData.map(contract => ({
        id: contract.id.toString(),
        type: contract.type,
        branch: contract.branche,
        contractNumber: contract.numero_contrat,
        premiumAmount: contract.prime,
        insuredName: contract.assure,
        paymentMode: contract.mode_paiement,
        paymentType: contract.type_paiement,
        creditAmount: contract.montant_credit,
        paymentDate: contract.date_paiement_prevue,
        createdBy: contract.cree_par,
        createdAt: new Date(contract.created_at).getTime()
      }));

      const filename = `rapport_${filters.type}_${filters.dateFrom}_${filters.dateTo}.xlsx`;
      exportToXLSX(contractsForExport, filename);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    }
  };

  const handleDeleteRapport = async (id: number, numeroContrat: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat du rapport et des tables liées ?')) {
      return;
    }

    const success = await deleteRapportContract(id, numeroContrat);
    if (success) {
      loadRapportContracts();
      loadAffaireContracts();
      loadTermeContracts();
    } else {
      alert('Erreur lors de la suppression du contrat');
    }
  };

  const handleDeleteAffaire = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat Affaire et du rapport ?')) {
      return;
    }

    const success = await deleteAffaireContract(id);
    if (success) {
      loadAffaireContracts();
      loadRapportContracts();
    } else {
      alert('Erreur lors de la suppression du contrat');
    }
  };

  const handleDeleteTerme = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat Terme et du rapport ?')) {
      return;
    }

    const success = await deleteTermeContract(id);
    if (success) {
      loadTermeContracts();
      loadRapportContracts();
    } else {
      alert('Erreur lors de la suppression du contrat');
    }
  };

  const stats = calculateStats();
  const uniqueUsers = [...new Set(rapportContracts.map(c => c.cree_par))];
  const sessionDate = getSessionDate();

  // Couleurs du thème professionnel
  const colors = {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      900: '#0c4a6e'
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626'
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header avec fond dégradé */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-t-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Tableau de Bord Analytique
              </h2>
              <p className="text-slate-300 text-sm">
                {showSessionData 
                  ? `Session du ${new Date(sessionDate).toLocaleDateString('fr-FR')}`
                  : 'Vue globale de toutes les données'
                }
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSessionData(!showSessionData)}
              className={`py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 border ${
                showSessionData
                  ? 'bg-white text-slate-900 border-white hover:bg-slate-100'
                  : 'bg-transparent text-white border-white/30 hover:bg-white/10'
              }`}
            >
              {showSessionData ? 'Vue Globale' : 'Vue Session'}
            </button>
            <button
              onClick={exportToExcel}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-emerald-500/25"
            >
              <Download className="w-4 h-4" />
              <span>Exporter Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Section Filtres */}
        <div className="border-b border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <span>Filtres et Recherche</span>
              </h3>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {filteredContracts.length} résultat(s)
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 transition-all duration-200"
              >
                <option value="all">Tous les types</option>
                <option value="Terme">Terme</option>
                <option value="Affaire">Affaire</option>
                <option value="Credit">Credit</option>
                <option value="Rapport">Rapport</option>
              </select>

              <select
                name="branch"
                value={filters.branch}
                onChange={handleFilterChange}
                className="p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 transition-all duration-200"
              >
                <option value="all">Toutes les branches</option>
                <option value="Auto">Auto</option>
                <option value="Vie">Vie</option>
                <option value="Santé">Santé</option>
                <option value="IRDS">IRDS</option>
              </select>

              <select
                name="paymentMode"
                value={filters.paymentMode}
                onChange={handleFilterChange}
                className="p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 transition-all duration-200"
              >
                <option value="all">Tous les modes</option>
                <option value="Espece">Espèce</option>
                <option value="Cheque">Chèque</option>
                <option value="Carte Bancaire">Carte Bancaire</option>
              </select>

              <select
                name="createdBy"
                value={filters.createdBy}
                onChange={handleFilterChange}
                className="p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 transition-all duration-200"
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
                className="p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 transition-all duration-200"
              />

              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-slate-500" />
            <span>Vue d'Ensemble</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Total Contrats */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Contrats</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalContracts}</p>
                  <p className="text-xs text-blue-600 mt-1">{showSessionData ? 'Session actuelle' : 'Toutes données'}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Prime Totale */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Prime Totale</p>
                  <p className="text-3xl font-bold text-emerald-900 mt-2">
                    {stats.totalPremium.toLocaleString('fr-FR')} DT
                  </p>
                </div>
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Total Session */}
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-6 border border-violet-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-violet-700 uppercase tracking-wide">Total Session</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    stats.totalMontant >= 0 ? 'text-violet-900' : 'text-red-900'
                  }`}>
                    {stats.totalMontant.toLocaleString('fr-FR')} DT
                  </p>
                  <p className={`text-xs mt-1 ${
                    stats.totalMontant >= 0 ? 'text-violet-600' : 'text-red-600'
                  }`}>
                    {stats.totalMontant >= 0 ? '✓ Résultat positif' : '⚠ Résultat négatif'}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${
                  stats.totalMontant >= 0 ? 'bg-violet-500' : 'bg-red-500'
                }`}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Prime Moyenne */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Prime Moyenne</p>
                  <p className="text-3xl font-bold text-amber-900 mt-2">
                    {stats.avgPremium.toLocaleString('fr-FR')} DT
                  </p>
                </div>
                <div className="p-3 bg-amber-500 rounded-xl">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Utilisateurs */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Utilisateurs</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{uniqueUsers.length}</p>
                </div>
                <div className="p-3 bg-slate-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques et répartitions */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-slate-500" />
            <span>Répartitions</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Répartition par Type */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Par Type</h3>
              <div className="space-y-4">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">{type}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(count / stats.totalContracts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Répartition par Branche */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Par Branche</h3>
              <div className="space-y-4">
                {Object.entries(stats.byBranch).map(([branch, count]) => (
                  <div key={branch} className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">{branch}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-200 rounded-full h-2.5">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(count / stats.totalContracts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Répartition par Mode de Paiement */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Par Mode de Paiement</h3>
              <div className="space-y-4">
                {Object.entries(stats.byPaymentMode).map(([mode, count]) => (
                  <div key={mode} className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">{mode}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-200 rounded-full h-2.5">
                        <div
                          className="bg-violet-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(count / stats.totalContracts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sections des contrats spécifiques */}
        {/* Section Contrats Terme */}
        {showSessionData && sessionTermeContracts.length > 0 && (
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Contrats Terme - Session actuelle ({sessionTermeContracts.length})</span>
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Numéro</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Branche</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Assuré</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Prime (DT)</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Échéance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Paiement</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {sessionTermeContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{contract.numero_contrat}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.branche}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.assure}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{contract.prime.toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{new Date(contract.echeance).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{new Date(contract.date_paiement).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteTerme(contract.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section Contrats Affaire */}
        {(showSessionData ? sessionAffaireContracts : affaireContracts).length > 0 && (
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>
                Contrats Affaire {showSessionData ? '- Session actuelle' : '(Toutes données)'} - {(showSessionData ? sessionAffaireContracts : affaireContracts).length}
              </span>
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Numéro</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Branche</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Assuré</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Prime (DT)</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Paiement</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Créé par</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {(showSessionData ? sessionAffaireContracts : affaireContracts).map((contract) => (
                    <tr key={contract.id} className="hover:bg-emerald-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{contract.numero_contrat}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.branche}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.assure}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{contract.prime.toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        <div>
                          <div className="font-medium">{contract.mode_paiement}</div>
                          <div className="text-xs text-slate-500">{contract.type_paiement}</div>
                          {contract.montant_credit && (
                            <div className="text-xs text-amber-600 font-medium">
                              Crédit: {contract.montant_credit} DT
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.cree_par}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{new Date(contract.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteAffaire(contract.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table principale Rapport */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span>
              Table Rapport {showSessionData ? '- Session actuelle' : '- Toutes données'} ({filteredContracts.length} contrats)
            </span>
          </h3>
          
          {/* Debug info */}
          <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-200 text-sm">
            <p className="text-blue-700"><strong>Debug:</strong> Contrats rapport: {showSessionData ? sessionRapportContracts.length : rapportContracts.length}, Filtrés: {filteredContracts.length}</p>
            {rapportContracts.length === 0 && (
              <p className="text-red-600 mt-1">⚠️ Aucun contrat dans la table rapport. Vérifiez que des contrats ont été sauvegardés.</p>
            )}
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Numéro</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Branche</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Assuré</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Prime (DT)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Montant (DT)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Mode Paiement</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type Paiement</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Montant Crédit (DT)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Paiement Prévue</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Échéance</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Créé par</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{contract.numero_contrat}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                        contract.type === 'Terme' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : contract.type === 'Affaire'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-violet-100 text-violet-800 border border-violet-200'
                      }`}>
                        {contract.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.branche}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.assure}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{(contract.prime || 0).toLocaleString('fr-FR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-bold text-lg ${(contract.montant || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(contract.montant || 0).toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.mode_paiement}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        contract.type_paiement === 'Au comptant'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {contract.type_paiement}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {contract.montant_credit ? (
                        <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          {contract.montant_credit.toLocaleString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {contract.date_paiement_prevue ? (
                        new Date(contract.date_paiement_prevue).toLocaleDateString('fr-FR')
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {contract.echeance ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {new Date(contract.echeance).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{contract.cree_par}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{new Date(contract.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteRapport(contract.id, contract.numero_contrat)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredContracts.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-slate-50">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium">Aucun contrat trouvé</p>
                <p className="text-sm mt-1">Ajustez vos filtres pour voir les résultats</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section pour les contrats locaux */}
      {localContracts.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            Contrats locaux (stockage navigateur) - {localContracts.length}
          </h3>
          <p className="text-amber-800 text-sm">
            Ces contrats sont stockés localement dans le navigateur. 
            Ils devraient maintenant être sauvegardés dans la table rapport.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;