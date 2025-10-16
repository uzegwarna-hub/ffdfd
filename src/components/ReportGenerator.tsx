import React from 'react';

const MonComposant: React.FC = () => {
    // Date verrouillée à l'instant de la création du composant
    const datePaiementSinistre = new Date().toISOString().split('T')[0];

    return (
        <div>
            <p>Date de paiement : {datePaiementSinistre}</p>
            {/* Cette date ne changera pas même si le composant se re-rend */}
        </div>
    );
};