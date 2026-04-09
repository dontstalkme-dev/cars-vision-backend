const bcrypt = require('bcrypt');
const db = require('../models');
const { sendPasswordChangedEmail } = require('../utils/email.utils');
const logger = require('../utils/logger');

// US-M1-09: Consulter mon profil
const obtenirMonProfil = async (req, res) => {
    try {
        const utilisateur = req.utilisateur;

        const profil = {
            id: utilisateur.id,
            email: utilisateur.email,
            prenom: utilisateur.prenom,
            nom: utilisateur.nom,
            telephone: utilisateur.telephone,
            adresse: utilisateur.adresse,
            role: utilisateur.role,
            statut: utilisateur.statut,
            derniere_connexion: utilisateur.derniere_connexion,
            cree_le: utilisateur.cree_le
        };

        res.json(profil);

    } catch (error) {
        logger.error('Erreur obtenir profil:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération du profil'
        });
    }
};

// US-M1-10: Modifier mes informations
const modifierMonProfil = async (req, res) => {
    try {
        const utilisateur = req.utilisateur;
        const { prenom, nom, telephone, adresse } = req.body;

        const donneesAMettreAJour = {};

        if (prenom) donneesAMettreAJour.prenom = prenom;
        if (nom) donneesAMettreAJour.nom = nom;
        if (telephone) donneesAMettreAJour.telephone = telephone;
        if (adresse !== undefined) donneesAMettreAJour.adresse = adresse;

        await utilisateur.update(donneesAMettreAJour);

        const profilMisAJour = {
            id: utilisateur.id,
            email: utilisateur.email,
            prenom: utilisateur.prenom,
            nom: utilisateur.nom,
            telephone: utilisateur.telephone,
            adresse: utilisateur.adresse,
            role: utilisateur.role
        };

        res.json({
            message: 'Profil mis à jour avec succès',
            utilisateur: profilMisAJour
        });

    } catch (error) {
        logger.error('Erreur modification profil:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification du profil'
        });
    }
};

// US-M1-11: Changer mon mot de passe
const changerMotDePasse = async (req, res) => {
    try {
        const utilisateur = req.utilisateur;
        const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

        if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
            return res.status(400).json({
                message: 'Ancien et nouveau mot de passe requis'
            });
        }

        // Vérifier ancien mot de passe
        const motDePasseValide = await bcrypt.compare(
            ancien_mot_de_passe,
            utilisateur.mot_de_passe
        );

        if (!motDePasseValide) {
            return res.status(400).json({
                message: 'Ancien mot de passe incorrect'
            });
        }

        // Valider nouveau mot de passe
        if (nouveau_mot_de_passe.length < 8) {
            return res.status(400).json({
                message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Hasher et mettre à jour
        const motDePasseHash = await bcrypt.hash(nouveau_mot_de_passe, 10);
        await utilisateur.update({ mot_de_passe: motDePasseHash });

        // Envoyer email de confirmation (non-blocking)
        sendPasswordChangedEmail(utilisateur).catch(err => logger.error('Erreur envoi email changement mdp:', err));

        res.json({
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        logger.error('Erreur changement mot de passe:', error);
        res.status(500).json({
            message: 'Erreur lors du changement de mot de passe'
        });
    }
};

module.exports = {
    obtenirMonProfil,
    modifierMonProfil,
    changerMotDePasse
};
