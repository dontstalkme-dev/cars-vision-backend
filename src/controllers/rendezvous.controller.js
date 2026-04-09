const db = require('../models');
const { Op } = require('sequelize');
const { sendEmail, getEmailTemplate } = require('../utils/email.utils');
const logger = require('../utils/logger');

// US-M4-04: Voir créneaux disponibles (Client)
const obtenirCreneauxDisponibles = async (req, res) => {
    try {
        const { date, site = 'bonamoussadi' } = req.query;

        if (!date) {
            return res.status(400).json({
                message: 'Date requise (format: YYYY-MM-DD)'
            });
        }

        if (!['bonamoussadi', 'ndokoti'].includes(site)) {
            return res.status(400).json({
                message: 'Site invalide. Valeurs acceptées: bonamoussadi, ndokoti'
            });
        }

        // Vérifier que la date est dans le futur
        const dateRdv = new Date(date);
        const aujourd = new Date();
        aujourd.setHours(0, 0, 0, 0);

        if (dateRdv < aujourd) {
            return res.status(400).json({
                message: 'La date doit être dans le futur'
            });
        }

        // Récupérer les RDV déjà pris ce jour pour ce site
        const rdvPris = await db.RendezVous.findAll({
            where: {
                date_rdv: date,
                site,
                statut: { [Op.ne]: 'ANNULE' }
            },
            attributes: ['heure_debut', 'heure_fin']
        });

        // Créneaux disponibles (9h-17h, par tranche de 1h)
        const creneaux = [];
        for (let heure = 9; heure < 17; heure++) {
            const heureDebut = `${heure.toString().padStart(2, '0')}:00`;
            const heureFin = `${(heure + 1).toString().padStart(2, '0')}:00`;

            // FIX #12 : Parenthèses explicites pour la précédence des opérateurs
            const estLibre = !rdvPris.some(rdv => {
                return (
                    rdv.heure_debut === heureDebut ||
                    (rdv.heure_debut < heureFin && rdv.heure_fin > heureDebut)
                );
            });

            if (estLibre) {
                creneaux.push({
                    heure_debut: heureDebut,
                    heure_fin: heureFin,
                    disponible: true
                });
            }
        }

        res.json({
            date,
            site,
            creneaux,
            nombre_disponibles: creneaux.length
        });

    } catch (error) {
        logger.error('Erreur créneaux disponibles:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la récupération des créneaux'
        });
    }
};

// US-M4-05: Réserver un rendez-vous (Client ou Invité)
const reserverRendezVous = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const utilisateur = req.utilisateur || null;
        const {
            service_id,
            date_rdv,
            heure_debut,
            description_vehicule,
            marque_vehicule,
            modele_vehicule,
            annee_vehicule,
            plaque_vehicule,
            site = 'ndokoti',
            besoin_remorquage = false,
            besoin_navette = false,
            voiture_courtoisie = false,
            offre_speciale,
            notes_client,
            nom_client,
            telephone_client,
            email_client
        } = req.body;

        // Validation
        if (!service_id || !date_rdv || !heure_debut || (!description_vehicule && !marque_vehicule)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Tous les champs obligatoires doivent être remplis'
            });
        }

        // Si non connecté, nom et téléphone sont obligatoires
        if (!utilisateur && (!nom_client || !telephone_client)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Le nom et le numéro de téléphone sont obligatoires pour réserver sans compte'
            });
        }

        // Valider le site
        if (!['bonamoussadi', 'ndokoti'].includes(site)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Site invalide. Valeurs acceptées: bonamoussadi, ndokoti'
            });
        }

        // Vérifier que le service existe et est actif
        const service = await db.Service.findByPk(service_id);
        if (!service || !service.est_actif) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Service invalide ou inactif'
            });
        }

        // Vérifier que la date est dans le futur
        const dateRdv = new Date(date_rdv);
        const aujourd = new Date();
        aujourd.setHours(0, 0, 0, 0);

        if (dateRdv < aujourd) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'La date doit être dans le futur'
            });
        }

        // Calculer heure_fin (1h après heure_debut)
        const [heure, minute] = heure_debut.split(':');
        const heureFin = `${(parseInt(heure) + 1).toString().padStart(2, '0')}:${minute}`;

        // Créer le RDV
        const rdv = await db.RendezVous.create({
            utilisateur_id: utilisateur ? utilisateur.id : null,
            nom_client: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : nom_client,
            telephone_client: utilisateur ? utilisateur.telephone : telephone_client,
            email_client: utilisateur ? utilisateur.email : (email_client || null),
            service_id,
            service_nom: service.nom,
            date_rdv,
            heure_debut,
            heure_fin: heureFin,
            description_vehicule: description_vehicule || `${marque_vehicule || ''} ${modele_vehicule || ''} ${annee_vehicule || ''}`.trim(),
            marque_vehicule: marque_vehicule || null,
            modele_vehicule: modele_vehicule || null,
            annee_vehicule: annee_vehicule || null,
            plaque_vehicule: plaque_vehicule || null,
            site,
            besoin_remorquage,
            besoin_navette,
            voiture_courtoisie,
            offre_speciale,
            notes_client,
            statut: 'EN_ATTENTE'
        }, { transaction });

        await transaction.commit();

        // Récupérer le RDV avec le service
        const rdvComplet = await db.RendezVous.findByPk(rdv.id, {
            include: [{ model: db.Service, as: 'service' }]
        });

        res.status(201).json({
            message: 'Rendez-vous réservé avec succès',
            rdv: rdvComplet
        });

        // Envoyer email de confirmation (ne bloque pas la réponse)
        const emailDestinataire = utilisateur ? utilisateur.email : email_client;
        const prenomDestinataire = utilisateur ? utilisateur.prenom : nom_client;
        if (emailDestinataire) {
            try {
                const vehiculeDesc = description_vehicule || `${marque_vehicule || ''} ${modele_vehicule || ''} ${annee_vehicule || ''}`.trim();
                const siteNom = site === 'bonamoussadi' ? 'Bonamoussadi' : 'Ndokoti';
                const htmlContent = `
                    <h2>Rendez-vous enregistré</h2>
                    <p>Bonjour ${prenomDestinataire},</p>
                    <p>Votre rendez-vous a été réservé avec succès.</p>
                    <div class="info-box">
                        <p><strong>Service :</strong> ${service.nom}</p>
                        <p><strong>Date :</strong> ${date_rdv}</p>
                        <p><strong>Heure :</strong> ${heure_debut} - ${heureFin}</p>
                        <p><strong>Site :</strong> ${siteNom}</p>
                        <p><strong>Véhicule :</strong> ${vehiculeDesc}</p>
                    </div>
                    <p><strong>Statut :</strong> En attente de confirmation</p>
                    <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
                `;
                await sendEmail(emailDestinataire, `Rendez-vous enregistré - ${service.nom}`, getEmailTemplate(htmlContent));
            } catch (emailErr) {
                logger.warn('Email de confirmation non envoyé:', { message: emailErr.message });
            }
        }

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        logger.error('Erreur réservation RDV:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la réservation'
        });
    }
};

// US-M4-06: Consulter mes rendez-vous (Client)
const mesRendezVous = async (req, res) => {
    try {
        const utilisateur = req.utilisateur;
        const { filtre = 'tous' } = req.query;

        const where = { utilisateur_id: utilisateur.id };

        if (filtre === 'avenir') {
            where.date_rdv = { [Op.gte]: new Date().toISOString().split('T')[0] };
        } else if (filtre === 'passes') {
            where.date_rdv = { [Op.lt]: new Date().toISOString().split('T')[0] };
        }

        const rdvs = await db.RendezVous.findAll({
            where,
            order: [['date_rdv', 'DESC']],
            include: [
                {
                    model: db.Utilisateur,
                    as: 'utilisateur',
                    attributes: ['prenom', 'nom']
                },
                {
                    model: db.Service,
                    as: 'service',
                    attributes: ['id', 'nom', 'description', 'prix', 'duree_minutes']
                }
            ]
        });

        res.json({
            rdvs,
            total: rdvs.length,
            filtre
        });

    } catch (error) {
        logger.error('Erreur mes RDV:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la récupération des rendez-vous'
        });
    }
};

// US-M4-07: Annuler un rendez-vous (Client)
const annulerRendezVous = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const utilisateur = req.utilisateur;
        const { id } = req.params;

        const rdv = await db.RendezVous.findOne({
            where: {
                id,
                utilisateur_id: utilisateur.id
            },
            include: [
                { model: db.Service, as: 'service' },
                // BUG FIX : Utilisateur manquait → rdv.utilisateur.email = TypeError
                { model: db.Utilisateur, as: 'utilisateur', attributes: ['id', 'prenom', 'nom', 'email'] }
            ]
        });

        if (!rdv) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Rendez-vous non trouvé'
            });
        }

        // Vérifier que l'annulation est possible (24h avant)
        const dateRdv = new Date(`${rdv.date_rdv}T${rdv.heure_debut}`);
        const maintenant = new Date();
        const heuresRestantes = (dateRdv - maintenant) / (1000 * 60 * 60);

        if (heuresRestantes < 24) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Impossible d\'annuler moins de 24h avant le rendez-vous'
            });
        }

        // Annuler
        await rdv.update({ statut: 'ANNULE' }, { transaction });

        await transaction.commit();

        // Envoyer email au client
        await envoyerEmail({
            destinataire: rdv.utilisateur.email,
            sujet: `Rendez-vous annulé - ${rdv.service.nom}`,
            contenu: `
        Bonjour ${utilisateur.prenom},
        
        Votre rendez-vous du ${rdv.date_rdv} à ${rdv.heure_debut} a été annulé.
        
        Le créneau est maintenant disponible pour d'autres clients.
        
        Cars Vision Auto
      `
        });

        res.json({
            message: 'Rendez-vous annulé avec succès'
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur annulation RDV:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de l\'annulation'
        });
    }
};

// US-M4-08: Voir tous les RDV (Admin)
const tousLesRendezVous = async (req, res) => {
    try {
        const { date, service_id, statut, site, page = 1, limite = 20 } = req.query;
        const offset = (page - 1) * limite;
        const where = {};

        if (date) where.date_rdv = date;
        if (service_id) where.service_id = service_id;
        if (statut) where.statut = statut;
        if (site && ['bonamoussadi', 'ndokoti'].includes(site)) where.site = site;

        const { count, rows: rdvs } = await db.RendezVous.findAndCountAll({
            where,
            limit: parseInt(limite),
            offset: parseInt(offset),
            order: [['date_rdv', 'ASC'], ['heure_debut', 'ASC']],
            include: [
                {
                    model: db.Utilisateur,
                    as: 'utilisateur',
                    attributes: ['id', 'prenom', 'nom', 'telephone', 'email']
                },
                {
                    model: db.Service,
                    as: 'service',
                    attributes: ['id', 'nom', 'description', 'prix', 'duree_minutes']
                }
            ]
        });

        res.json({
            rdvs,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            }
        });

    } catch (error) {
        logger.error('Erreur tous RDV:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la récupération des rendez-vous'
        });
    }
};

// US-M4-09: Confirmer/Clôturer un RDV (Admin)
const modifierRendezVous = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { statut, notes_mecanicien } = req.body;

        if (!['EN_ATTENTE', 'CONFIRME', 'TERMINE', 'ANNULE'].includes(statut)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Statut invalide'
            });
        }

        const rdv = await db.RendezVous.findByPk(id, {
            include: [
                { model: db.Utilisateur, as: 'utilisateur' },
                { model: db.Service, as: 'service' }
            ]
        });

        if (!rdv) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Rendez-vous non trouvé'
            });
        }

        const ancienStatut = rdv.statut;

        await rdv.update({
            statut,
            notes_mecanicien: notes_mecanicien || rdv.notes_mecanicien
        }, { transaction });

        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Modification RDV: ${rdv.service.nom} (${ancienStatut} -> ${statut})`,
            type_action: 'autre',
            details: {
                rdv_id: rdv.id,
                ancien_statut: ancienStatut,
                nouveau_statut: statut
            }
        }, { transaction });

        await transaction.commit();

        // Envoyer email au client
        const messages = {
            CONFIRME: 'Votre rendez-vous a été confirmé.',
            TERMINE: 'Votre rendez-vous a été complété.',
            ANNULE: 'Votre rendez-vous a été annulé.'
        };

        if (ancienStatut !== statut) {
            await envoyerEmail({
                destinataire: rdv.utilisateur.email,
                sujet: `Rendez-vous ${statut.toLowerCase()} - ${rdv.service.nom}`,
                contenu: `
          Bonjour ${rdv.utilisateur.prenom},
          
          ${messages[statut] || 'Votre rendez-vous a été mis à jour.'}
          
          Date: ${rdv.date_rdv}
          Heure: ${rdv.heure_debut}
          Service: ${rdv.service.nom}
          
          ${notes_mecanicien ? `Notes: ${notes_mecanicien}` : ''}
          
          Cars Vision Auto
        `
            });
        }

        res.json({
            message: 'Rendez-vous mis à jour',
            rdv
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        logger.error('Erreur modification RDV:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la modification'
        });
    }
};

// Supprimer un rendez-vous (Admin)
const supprimerRendezVous = async (req, res) => {
    try {
        const { id } = req.params;

        const rdv = await db.RendezVous.findByPk(id, {
            include: [
                { model: db.Utilisateur, as: 'utilisateur' },
                { model: db.Service, as: 'service' }
            ]
        });

        if (!rdv) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        const clientEmail = rdv.utilisateur?.email;
        const clientPrenom = rdv.utilisateur?.prenom;
        const serviceNom = rdv.service?.nom || rdv.service_nom;
        const dateRdv = rdv.date_rdv;
        const heureRdv = rdv.heure_debut;

        await rdv.destroy();

        // Envoyer email de notification au client
        try {
            if (clientEmail) {
                await envoyerEmail({
                    destinataire: clientEmail,
                    sujet: `Rendez-vous supprimé - ${serviceNom}`,
                    contenu: `
          Bonjour ${clientPrenom},
          
          Votre rendez-vous du ${dateRdv} à ${heureRdv} pour le service "${serviceNom}" a été supprimé par notre équipe.
          
          Si vous avez des questions, n'hésitez pas à nous contacter.
          
          Cars Vision Auto
        `
                });
            }
        } catch (emailErr) {
            logger.warn('Email suppression RDV non envoyé:', { message: emailErr.message });
        }

        res.json({ message: 'Rendez-vous supprimé avec succès' });

    } catch (error) {
        logger.error('Erreur suppression RDV:', { message: error.message });
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};

module.exports = {
    obtenirCreneauxDisponibles,
    reserverRendezVous,
    mesRendezVous,
    annulerRendezVous,
    tousLesRendezVous,
    modifierRendezVous,
    supprimerRendezVous
};
