const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const db = require('../models');
const { sendBackofficeAccountEmail } = require('../utils/email.utils');

// US-M1-12: Liste des utilisateurs (Admin)
const obtenirListeUtilisateurs = async (req, res) => {
    try {
        const {
            page = 1,
            limite = 20,
            statut,
            role,
            date_debut,
            date_fin,
            recherche
        } = req.query;

        const offset = (page - 1) * limite;
        const where = {};

        // Filtres
        if (statut) where.statut = statut;
        if (role) where.role = role;

        if (date_debut || date_fin) {
            where.cree_le = {};
            if (date_debut) where.cree_le[Op.gte] = new Date(date_debut);
            if (date_fin) where.cree_le[Op.lte] = new Date(date_fin);
        }

        if (recherche) {
            where[Op.or] = [
                { email: { [Op.iLike]: `%${recherche}%` } },
                { prenom: { [Op.iLike]: `%${recherche}%` } },
                { nom: { [Op.iLike]: `%${recherche}%` } },
                { telephone: { [Op.iLike]: `%${recherche}%` } }
            ];
        }

        const { count, rows: utilisateurs } = await db.Utilisateur.findAndCountAll({
            where,
            limit: parseInt(limite),
            offset: parseInt(offset),
            order: [['cree_le', 'DESC']],
            attributes: { exclude: ['mot_de_passe'] },
            include: [
                {
                    model: db.Commande,
                    as: 'commandes',
                    attributes: ['id', 'total', 'statut'],
                    required: false
                }
            ]
        });

        // Calculer stats par utilisateur
        const utilisateursAvecStats = utilisateurs.map(user => {
            const userData = user.toJSON();
            const commandes = userData.commandes || [];

            return {
                ...userData,
                stats: {
                    nombre_commandes: commandes.length,
                    total_depense: commandes
                        .filter(c => c.statut === 'LIVREE')
                        .reduce((sum, c) => sum + parseFloat(c.total), 0)
                },
                commandes: undefined // Retirer les commandes détaillées
            };
        });

        res.json({
            utilisateurs: utilisateursAvecStats,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            }
        });

    } catch (error) {
        console.error('Erreur liste utilisateurs:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des utilisateurs'
        });
    }
};

// US-M1-13: Bloquer/Débloquer utilisateur (Admin)
const modifierStatutUtilisateur = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { statut } = req.body;

        if (!['actif', 'bloque'].includes(statut)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Statut invalide. Valeurs acceptées: actif, bloque'
            });
        }

        const utilisateur = await db.Utilisateur.findByPk(id);

        if (!utilisateur) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Utilisateur non trouvé'
            });
        }

        // Ne pas bloquer un admin
        if (utilisateur.role === 'admin' && statut === 'bloque') {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Impossible de bloquer un administrateur'
            });
        }

        await utilisateur.update({ statut }, { transaction });

        // Si bloqué, supprimer tous ses refresh tokens
        if (statut === 'bloque') {
            await db.TokenRefresh.destroy({
                where: { utilisateur_id: utilisateur.id },
                transaction
            });

        }

        // Logger l'action
        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Modification statut utilisateur: ${utilisateur.email} -> ${statut}`,
            type_action: 'utilisateur',
            details: {
                utilisateur_cible_id: utilisateur.id,
                ancien_statut: utilisateur.statut,
                nouveau_statut: statut
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: `Utilisateur ${statut === 'bloque' ? 'bloqué' : 'débloqué'} avec succès`,
            utilisateur: {
                id: utilisateur.id,
                email: utilisateur.email,
                statut: utilisateur.statut
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur modification statut:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification du statut'
        });
    }
};


// Créer un utilisateur (backoffice) - Admin peut choisir le rôle
const creerUtilisateur = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { email, mot_de_passe, prenom, nom, telephone, role, adresse } = req.body;

        // Validation
        if (!email || !mot_de_passe || !prenom || !nom || !telephone) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Tous les champs obligatoires doivent être remplis'
            });
        }

        // Vérifier email unique
        const utilisateurExistant = await db.Utilisateur.findOne({
            where: { email }
        });

        if (utilisateurExistant) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Cet email est déjà utilisé'
            });
        }

        // Validation mot de passe
        if (mot_de_passe.length < 8) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Validation rôle
        const roleUtilisateur = role && ['client', 'admin'].includes(role) ? role : 'client';

        // Hasher le mot de passe
        const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const nouvelUtilisateur = await db.Utilisateur.create({
            email,
            mot_de_passe: motDePasseHash,
            prenom,
            nom,
            telephone,
            adresse,
            role: roleUtilisateur,
            statut: 'actif'
        }, { transaction });

        // Logger l'action
        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Création utilisateur backoffice: ${email} (${roleUtilisateur})`,
            type_action: 'utilisateur',
            details: {
                utilisateur_cree_id: nouvelUtilisateur.id,
                role: roleUtilisateur
            }
        }, { transaction });

        await transaction.commit();

        // Envoyer email avec mot de passe temporaire
        await sendBackofficeAccountEmail(nouvelUtilisateur.email, `${nouvelUtilisateur.prenom} ${nouvelUtilisateur.nom}`, mot_de_passe, roleUtilisateur);

        const utilisateurReponse = {
            id: nouvelUtilisateur.id,
            email: nouvelUtilisateur.email,
            prenom: nouvelUtilisateur.prenom,
            nom: nouvelUtilisateur.nom,
            telephone: nouvelUtilisateur.telephone,
            adresse: nouvelUtilisateur.adresse,
            role: nouvelUtilisateur.role,
            statut: nouvelUtilisateur.statut
        };

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            utilisateur: utilisateurReponse
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur création utilisateur:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de l\'utilisateur',
            error: error.message
        });
    }
};

// Modifier un utilisateur (general update)
const modifierUtilisateur = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { email, prenom, nom, telephone, adresse, role, statut, mot_de_passe } = req.body;

        const utilisateur = await db.Utilisateur.findByPk(id);
        if (!utilisateur) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const updates = {};
        if (email) updates.email = email;
        if (prenom) updates.prenom = prenom;
        if (nom) updates.nom = nom;
        if (telephone !== undefined) updates.telephone = telephone;
        if (adresse !== undefined) updates.adresse = adresse;

        if (role && ['client', 'admin'].includes(role)) {
            updates.role = role;
        }

        if (statut && ['actif', 'bloque'].includes(statut)) {
            if (utilisateur.role === 'admin' && statut === 'bloque') {
                await transaction.rollback();
                return res.status(400).json({ message: 'Impossible de bloquer un administrateur' });
            }
            updates.statut = statut;
        }

        if (mot_de_passe && mot_de_passe.length >= 8) {
            updates.mot_de_passe = await bcrypt.hash(mot_de_passe, 10);
        }

        await utilisateur.update(updates, { transaction });

        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Modification utilisateur: ${utilisateur.email}`,
            type_action: 'utilisateur',
            details: { utilisateur_cible_id: utilisateur.id, champs_modifies: Object.keys(updates) }
        }, { transaction });

        await transaction.commit();

        const userResponse = utilisateur.toJSON();
        delete userResponse.mot_de_passe;

        res.json({ message: 'Utilisateur modifié avec succès', utilisateur: userResponse });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur modification utilisateur:', error);
        res.status(500).json({ message: 'Erreur lors de la modification de l\'utilisateur' });
    }
};

// Modifier le rôle d'un utilisateur
const modifierRoleUtilisateur = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['client', 'admin'].includes(role)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Rôle invalide. Valeurs acceptées: client, admin'
            });
        }

        const utilisateur = await db.Utilisateur.findByPk(id);

        if (!utilisateur) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Utilisateur non trouvé'
            });
        }

        const ancienRole = utilisateur.role;
        await utilisateur.update({ role }, { transaction });

        // Logger l'action
        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Modification rôle utilisateur: ${utilisateur.email} (${ancienRole} -> ${role})`,
            type_action: 'utilisateur',
            details: {
                utilisateur_cible_id: utilisateur.id,
                ancien_role: ancienRole,
                nouveau_role: role
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: 'Rôle modifié avec succès',
            utilisateur: {
                id: utilisateur.id,
                email: utilisateur.email,
                role: utilisateur.role
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur modification rôle:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification du rôle'
        });
    }
};

module.exports = {
    obtenirListeUtilisateurs,
    modifierStatutUtilisateur,
    modifierUtilisateur,
    creerUtilisateur,
    modifierRoleUtilisateur
};
