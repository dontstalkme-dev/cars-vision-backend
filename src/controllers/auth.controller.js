const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { genererAccessToken, genererRefreshToken, verifierRefreshToken } = require('../utils/jwt.utils');
const { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } = require('../utils/email.utils');
const logger = require('../utils/logger');

// US-M1-01: Inscription
const inscription = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { email, mot_de_passe, prenom, nom, telephone } = req.body;

        // Validation
        if (!email || !mot_de_passe || !prenom || !nom || !telephone) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Tous les champs sont obligatoires'
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

        // Validation mot de passe (min 8 caractères)
        if (mot_de_passe.length < 8) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Hasher le mot de passe
        const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur (role = 'client' par défaut)
        const nouvelUtilisateur = await db.Utilisateur.create({
            email,
            mot_de_passe: motDePasseHash,
            prenom,
            nom,
            telephone,
            role: 'client', // TOUJOURS client pour inscription publique
            statut: 'actif'
        }, { transaction });

        // Générer les tokens
        const accessToken = genererAccessToken(nouvelUtilisateur);
        const refreshToken = genererRefreshToken(nouvelUtilisateur);

        // Sauvegarder refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.TokenRefresh.create({
            token: refreshToken,
            utilisateur_id: nouvelUtilisateur.id,
            expire_le: expiresAt,
            type: 'refresh' // BUG FIX : distinguer du token reset MDP
        }, { transaction });

        // Fusion panier invité si guest_token présent
        const guestToken = req.body.guest_token;
        let panierFusionne = null;

        if (guestToken) {
            const panierInvite = await db.Panier.findOne({
                where: { token_invite: guestToken },
                include: [{ model: db.ArticlePanier, as: 'articles' }]
            });

            if (panierInvite && panierInvite.articles.length > 0) {
                // Créer ou récupérer panier utilisateur
                let panierUtilisateur = await db.Panier.findOne({
                    where: { utilisateur_id: nouvelUtilisateur.id }
                });

                if (!panierUtilisateur) {
                    panierUtilisateur = await db.Panier.create({
                        utilisateur_id: nouvelUtilisateur.id
                    }, { transaction });
                }

                // Transférer articles
                for (const article of panierInvite.articles) {
                    const articleExistant = await db.ArticlePanier.findOne({
                        where: {
                            panier_id: panierUtilisateur.id,
                            produit_id: article.produit_id
                        }
                    });

                    if (articleExistant) {
                        // Additionner quantités
                        const produit = await db.Produit.findByPk(article.produit_id);
                        const nouvelleQuantite = Math.min(
                            articleExistant.quantite + article.quantite,
                            produit.stock
                        );

                        await articleExistant.update({
                            quantite: nouvelleQuantite
                        }, { transaction });
                    } else {
                        // Créer nouvel article
                        await db.ArticlePanier.create({
                            panier_id: panierUtilisateur.id,
                            produit_id: article.produit_id,
                            quantite: article.quantite,
                            prix: article.prix
                        }, { transaction });
                    }
                }

                // Supprimer panier invité
                await db.ArticlePanier.destroy({
                    where: { panier_id: panierInvite.id },
                    transaction
                });
                await panierInvite.destroy({ transaction });

                panierFusionne = await db.Panier.findOne({
                    where: { utilisateur_id: nouvelUtilisateur.id },
                    include: [{
                        model: db.ArticlePanier,
                        as: 'articles',
                        include: [{ model: db.Produit, as: 'produit' }]
                    }]
                });
            }
        }

        await transaction.commit();

        // PHASE 2.2 FIX : Envoyer email de bienvenue de manière asynchrone (ne pas bloquer la réponse)
        setImmediate(() => {
            sendWelcomeEmail(nouvelUtilisateur.email, `${nouvelUtilisateur.prenom} ${nouvelUtilisateur.nom}`)
                .catch(err => logger.error('Erreur envoi email bienvenue:', { message: err.message }));
        });

        // Retourner réponse
        const utilisateurReponse = {
            id: nouvelUtilisateur.id,
            email: nouvelUtilisateur.email,
            prenom: nouvelUtilisateur.prenom,
            nom: nouvelUtilisateur.nom,
            telephone: nouvelUtilisateur.telephone,
            role: nouvelUtilisateur.role
        };

        res.status(201).json({
            message: 'Inscription réussie',
            utilisateur: utilisateurReponse,
            accessToken,
            refreshToken,
            panier: panierFusionne
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur inscription:', { message: error.message, stack: error.stack });
        res.status(500).json({
            message: 'Erreur lors de l\'inscription',
            error: error.message
        });
    }
};

// US-M1-02: Connexion
const connexion = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { email, mot_de_passe, guest_token } = req.body;

        if (!email || !mot_de_passe) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Email et mot de passe requis'
            });
        }

        // Trouver utilisateur
        const utilisateur = await db.Utilisateur.findOne({
            where: { email }
        });

        if (!utilisateur) {
            await transaction.rollback();
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier si bloqué
        if (utilisateur.statut === 'bloque') {
            await transaction.rollback();
            return res.status(403).json({
                message: 'Votre compte a été bloqué'
            });
        }

        // Vérifier tentatives de connexion
        if (utilisateur.tentatives_connexion >= 5) {
            await utilisateur.update({
                statut: 'bloque'
            }, { transaction });
            await transaction.commit();

            return res.status(403).json({
                message: 'Compte bloqué après 5 tentatives échouées'
            });
        }

        // Vérifier mot de passe
        const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);

        if (!motDePasseValide) {
            await utilisateur.update({
                tentatives_connexion: utilisateur.tentatives_connexion + 1
            }, { transaction });
            await transaction.commit();

            return res.status(401).json({
                message: 'Email ou mot de passe incorrect',
                tentatives_restantes: 5 - (utilisateur.tentatives_connexion + 1)
            });
        }

        // Réinitialiser tentatives et mettre à jour dernière connexion
        await utilisateur.update({
            tentatives_connexion: 0,
            derniere_connexion: new Date()
        }, { transaction });

        // Générer tokens
        const accessToken = genererAccessToken(utilisateur);
        const refreshToken = genererRefreshToken(utilisateur);

        // Sauvegarder refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.TokenRefresh.create({
            token: refreshToken,
            utilisateur_id: utilisateur.id,
            expire_le: expiresAt,
            type: 'refresh' // BUG FIX : distinguer du token reset MDP
        }, { transaction });

        // Fusion panier invité si guest_token présent
        let panierFusionne = null;

        if (guest_token) {
            const panierInvite = await db.Panier.findOne({
                where: { token_invite: guest_token },
                include: [{ model: db.ArticlePanier, as: 'articles' }]
            });

            if (panierInvite && panierInvite.articles.length > 0) {
                let panierUtilisateur = await db.Panier.findOne({
                    where: { utilisateur_id: utilisateur.id }
                });

                if (!panierUtilisateur) {
                    panierUtilisateur = await db.Panier.create({
                        utilisateur_id: utilisateur.id
                    }, { transaction });
                }

                for (const article of panierInvite.articles) {
                    const articleExistant = await db.ArticlePanier.findOne({
                        where: {
                            panier_id: panierUtilisateur.id,
                            produit_id: article.produit_id
                        }
                    });

                    if (articleExistant) {
                        const produit = await db.Produit.findByPk(article.produit_id);
                        const nouvelleQuantite = Math.min(
                            articleExistant.quantite + article.quantite,
                            produit.stock
                        );

                        await articleExistant.update({
                            quantite: nouvelleQuantite
                        }, { transaction });
                    } else {
                        await db.ArticlePanier.create({
                            panier_id: panierUtilisateur.id,
                            produit_id: article.produit_id,
                            quantite: article.quantite,
                            prix: article.prix
                        }, { transaction });
                    }
                }

                await db.ArticlePanier.destroy({
                    where: { panier_id: panierInvite.id },
                    transaction
                });
                await panierInvite.destroy({ transaction });

                panierFusionne = await db.Panier.findOne({
                    where: { utilisateur_id: utilisateur.id },
                    include: [{
                        model: db.ArticlePanier,
                        as: 'articles',
                        include: [{ model: db.Produit, as: 'produit' }]
                    }]
                });
            }
        }

        await transaction.commit();

        const utilisateurReponse = {
            id: utilisateur.id,
            email: utilisateur.email,
            prenom: utilisateur.prenom,
            nom: utilisateur.nom,
            telephone: utilisateur.telephone,
            adresse: utilisateur.adresse,
            role: utilisateur.role
        };

        res.json({
            message: 'Connexion réussie',
            utilisateur: utilisateurReponse,
            accessToken,
            refreshToken,
            panier: panierFusionne
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur connexion:', { message: error.message, stack: error.stack });
        res.status(500).json({
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
};

// US-M1-03: Rafraîchir token
const rafraichirToken = async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({
                message: 'Refresh token requis'
            });
        }

        // Vérifier le refresh token
        const decoded = verifierRefreshToken(refresh_token);

        // Vérifier si le token existe en BDD (type 'refresh' uniquement)
        const tokenBDD = await db.TokenRefresh.findOne({
            where: {
                token: refresh_token,
                utilisateur_id: decoded.id,
                type: 'refresh' // BUG FIX : ne pas confondre avec les tokens reset MDP
            }
        });

        if (!tokenBDD) {
            return res.status(401).json({
                message: 'Refresh token invalide'
            });
        }

        // Vérifier expiration
        if (new Date() > tokenBDD.expire_le) {
            await tokenBDD.destroy();
            return res.status(401).json({
                message: 'Refresh token expiré'
            });
        }

        // Récupérer utilisateur
        const utilisateur = await db.Utilisateur.findByPk(decoded.id);

        if (!utilisateur || utilisateur.statut === 'bloque') {
            return res.status(401).json({
                message: 'Utilisateur non autorisé'
            });
        }

        // Générer nouveau access token
        const nouvelAccessToken = genererAccessToken(utilisateur);

        // Rotation: générer nouveau refresh token
        const nouveauRefreshToken = genererRefreshToken(utilisateur);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Supprimer ancien refresh token
        await tokenBDD.destroy();

        // Créer nouveau refresh token
        await db.TokenRefresh.create({
            token: nouveauRefreshToken,
            utilisateur_id: utilisateur.id,
            expire_le: expiresAt,
            type: 'refresh' // BUG FIX : distinguer du token reset MDP
        });

        res.json({
            accessToken: nouvelAccessToken,
            refreshToken: nouveauRefreshToken
        });

    } catch (error) {
        logger.error('Erreur rafraîchissement token:', { message: error.message, stack: error.stack });
        res.status(401).json({
            message: 'Erreur lors du rafraîchissement du token'
        });
    }
};

// US-M1-04: Déconnexion
const deconnexion = async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (refresh_token) {
            // Supprimer le refresh token
            await db.TokenRefresh.destroy({
                where: { token: refresh_token }
            });
        }

        res.json({
            message: 'Déconnexion réussie'
        });

    } catch (error) {
        logger.error('Erreur déconnexion:', { message: error.message, stack: error.stack });
        res.status(500).json({
            message: 'Erreur lors de la déconnexion'
        });
    }
};

// US-M1-05: Demander reset mot de passe
const demanderResetMotDePasse = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: 'Email requis'
            });
        }

        // Toujours retourner la même réponse (sécurité)
        const reponse = {
            message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
        };

        const utilisateur = await db.Utilisateur.findOne({
            where: { email }
        });

        if (utilisateur) {
            // Générer token reset (valable 1h)
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            // BUG FIX : type 'reset' pour ne pas mélanger avec les refresh tokens JWT
            await db.TokenRefresh.create({
                token: resetTokenHash,
                utilisateur_id: utilisateur.id,
                expire_le: expiresAt,
                type: 'reset'
            });

            // PHASE 2.2 FIX : Envoyer email de manière asynchrone
            setImmediate(() => {
                sendPasswordResetEmail(utilisateur.email, utilisateur.prenom, resetToken)
                    .catch(err => logger.error('Erreur envoi email reset:', { message: err.message }));
            });
        }

        res.json(reponse);

    } catch (error) {
        logger.error('Erreur demande reset:', { message: error.message, stack: error.stack });
        res.status(500).json({
            message: 'Erreur lors de la demande de réinitialisation'
        });
    }
};

// US-M1-06: Réinitialiser mot de passe
const reinitialiserMotDePasse = async (req, res) => {
    try {
        const { token, nouveau_mot_de_passe } = req.body;

        if (!token || !nouveau_mot_de_passe) {
            return res.status(400).json({
                message: 'Token et nouveau mot de passe requis'
            });
        }

        if (nouveau_mot_de_passe.length < 8) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Hasher le token reçu
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Trouver le token (type 'reset' uniquement)
        const resetToken = await db.TokenRefresh.findOne({
            where: { token: tokenHash, type: 'reset' } // BUG FIX
        });

        if (!resetToken) {
            return res.status(400).json({
                message: 'Token invalide ou expiré'
            });
        }

        if (new Date() > resetToken.expire_le) {
            await resetToken.destroy();
            return res.status(400).json({
                message: 'Token expiré'
            });
        }

        // Mettre à jour le mot de passe
        const utilisateur = await db.Utilisateur.findByPk(resetToken.utilisateur_id);

        const motDePasseHash = await bcrypt.hash(nouveau_mot_de_passe, 10);
        await utilisateur.update({ mot_de_passe: motDePasseHash });

        // Supprimer le token
        await resetToken.destroy();

        // PHASE 2.2 FIX : Envoyer email de confirmation de manière asynchrone
        setImmediate(() => {
            sendPasswordChangedEmail(utilisateur.email, utilisateur.prenom)
                .catch(err => logger.error('Erreur envoi email confirmation:', { message: err.message }));
        });

        res.json({
            message: 'Mot de passe réinitialisé avec succès'
        });

    } catch (error) {
        logger.error('Erreur reset mot de passe:', { message: error.message, stack: error.stack });
        res.status(500).json({
            message: 'Erreur lors de la réinitialisation du mot de passe'
        });
    }
};

module.exports = {
    inscription,
    connexion,
    rafraichirToken,
    deconnexion,
    demanderResetMotDePasse,
    reinitialiserMotDePasse
};
