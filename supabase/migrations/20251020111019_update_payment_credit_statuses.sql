/*
  # Mise à jour des statuts de crédit et types de rapport

  1. Modifications
    - Ajouter "Paiement Crédit" au type de rapport
    - Ajouter "Payé partiellement" et "Payé en total" aux statuts de crédit
    - Ces ajouts permettent de gérer les paiements partiels et totaux des crédits

  2. Sécurité
    - Les modifications sont compatibles avec les données existantes
    - Aucune donnée n'est supprimée
*/

-- Ajouter "Paiement Crédit" au type de rapport si pas déjà présent
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'rapport' AND column_name = 'type'
  ) THEN
    ALTER TABLE rapport DROP CONSTRAINT IF EXISTS rapport_type_check;
    ALTER TABLE rapport ADD CONSTRAINT rapport_type_check 
      CHECK (type = ANY (ARRAY[
        'Terme'::text, 
        'Affaire'::text, 
        'Crédit'::text, 
        'Dépense'::text, 
        'Recette Exceptionnelle'::text, 
        'Ristourne'::text, 
        'Sinistre'::text,
        'Paiement Crédit'::text
      ]));
  END IF;
END $$;

-- Ajouter les nouveaux statuts à liste_credits
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'liste_credits' AND column_name = 'statut'
  ) THEN
    ALTER TABLE liste_credits DROP CONSTRAINT IF EXISTS liste_credits_statut_check;
    ALTER TABLE liste_credits ADD CONSTRAINT liste_credits_statut_check 
      CHECK (statut = ANY (ARRAY[
        'Non payé'::text, 
        'Payé'::text, 
        'En retard'::text,
        'Payé partiellement'::text,
        'Payé en total'::text
      ]));
  END IF;
END $$;