const PDFDocument = require('pdfkit');

/**
 * Génère une facture PDF pour une commande
 * @param {Object} commande - La commande complète avec articles
 * @returns {Promise<Buffer>} Le buffer du PDF
 */
const genererFacturePDF = (commande) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const fmtPrice = (price) => {
                return new Intl.NumberFormat('fr-FR').format(parseFloat(price));
            };

            const fmtDate = (date) => {
                return new Date(date).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric'
                });
            };

            // --- En-tête entreprise ---
            doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e3c72')
                .text('CARS VISION AUTO', 50, 50);
            doc.fontSize(10).font('Helvetica').fillColor('#666666')
                .text('Votre partenaire automobile à Douala', 50, 78)
                .text('Douala, Cameroun', 50, 92)
                .text(`Email: ${process.env.EMAIL_USER || 'contact@carsvisionauto.cm'}`, 50, 106);

            // --- FACTURE titre ---
            doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e3c72')
                .text('FACTURE', 400, 50, { align: 'right' });

            // Numéro et date
            doc.fontSize(10).font('Helvetica').fillColor('#333333')
                .text(`N° ${commande.numero_commande}`, 400, 85, { align: 'right' })
                .text(`Date: ${fmtDate(commande.cree_le)}`, 400, 100, { align: 'right' })
                .text(`Statut: Livrée`, 400, 115, { align: 'right' });

            // --- Ligne séparatrice ---
            doc.moveTo(50, 140).lineTo(545, 140).strokeColor('#1e3c72').lineWidth(2).stroke();

            // --- Informations client ---
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3c72')
                .text('FACTURÉ À', 50, 160);

            const clientNom = commande.utilisateur
                ? `${commande.utilisateur.prenom || ''} ${commande.utilisateur.nom || ''}`.trim()
                : commande.nom_invite || 'Client';
            const clientEmail = commande.utilisateur
                ? commande.utilisateur.email
                : commande.email_invite || '';
            const clientTel = commande.telephone_livraison || commande.telephone_invite || '';

            doc.fontSize(10).font('Helvetica').fillColor('#333333')
                .text(clientNom, 50, 178)
                .text(clientEmail, 50, 193)
                .text(clientTel, 50, 208)
                .text(commande.adresse_livraison || '', 50, 223);

            // --- Informations livraison ---
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3c72')
                .text('LIVRÉ À', 300, 160);

            doc.fontSize(10).font('Helvetica').fillColor('#333333')
                .text(commande.adresse_livraison || '', 300, 178, { width: 245 })
                .text(clientTel, 300, 208);

            // --- Tableau des articles ---
            const tableTop = 260;

            // En-tête du tableau
            doc.rect(50, tableTop, 495, 25).fill('#1e3c72');
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
                .text('Produit', 60, tableTop + 7, { width: 220 })
                .text('Qté', 290, tableTop + 7, { width: 50, align: 'center' })
                .text('Prix unit.', 350, tableTop + 7, { width: 90, align: 'right' })
                .text('Total', 450, tableTop + 7, { width: 85, align: 'right' });

            // Lignes d'articles
            const articles = commande.articles || [];
            let y = tableTop + 30;
            let alternateRow = false;

            for (const article of articles) {
                if (alternateRow) {
                    doc.rect(50, y - 5, 495, 22).fill('#f8f9fa');
                }
                alternateRow = !alternateRow;

                const prixUnitaire = parseFloat(article.prix);
                const sousTotal = parseFloat(article.sous_total || (prixUnitaire * article.quantite));

                doc.fontSize(9).font('Helvetica').fillColor('#333333')
                    .text(article.nom_produit || article.produit?.nom || 'Produit', 60, y, { width: 220 })
                    .text(String(article.quantite), 290, y, { width: 50, align: 'center' })
                    .text(`${fmtPrice(prixUnitaire)} FCFA`, 350, y, { width: 90, align: 'right' })
                    .text(`${fmtPrice(sousTotal)} FCFA`, 450, y, { width: 85, align: 'right' });

                y += 22;
            }

            // Ligne séparatrice sous le tableau
            doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#e0e0e0').lineWidth(1).stroke();

            // --- Totaux ---
            y += 20;
            const totalsX = 350;

            doc.fontSize(10).font('Helvetica').fillColor('#333333')
                .text('Sous-total:', totalsX, y, { width: 100, align: 'right' })
                .text(`${fmtPrice(commande.sous_total)} FCFA`, 460, y, { width: 75, align: 'right' });

            y += 20;
            doc.text('Frais de livraison:', totalsX, y, { width: 100, align: 'right' })
                .text(`${fmtPrice(commande.frais_livraison)} FCFA`, 460, y, { width: 75, align: 'right' });

            if (parseFloat(commande.remise) > 0) {
                y += 20;
                doc.text('Remise:', totalsX, y, { width: 100, align: 'right' })
                    .text(`-${fmtPrice(commande.remise)} FCFA`, 460, y, { width: 75, align: 'right' });
            }

            y += 25;
            doc.rect(totalsX - 10, y - 5, 205, 28).fill('#1e3c72');
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff')
                .text('TOTAL:', totalsX, y + 2, { width: 100, align: 'right' })
                .text(`${fmtPrice(commande.total)} FCFA`, 460, y + 2, { width: 75, align: 'right' });

            // --- Mode de paiement ---
            y += 50;
            doc.fontSize(10).font('Helvetica').fillColor('#666666')
                .text('Mode de paiement: Paiement à la livraison', 50, y)
                .text('Statut de paiement: Payé', 50, y + 15);

            // --- Notes ---
            if (commande.notes) {
                y += 40;
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3c72')
                    .text('Notes:', 50, y);
                doc.fontSize(9).font('Helvetica').fillColor('#666666')
                    .text(commande.notes, 50, y + 15, { width: 495 });
            }

            // --- Pied de page ---
            const footerY = 750;
            doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e0e0e0').lineWidth(1).stroke();
            doc.fontSize(9).font('Helvetica').fillColor('#999999')
                .text('Merci pour votre confiance !', 50, footerY + 10, { align: 'center', width: 495 })
                .text('Cars Vision Auto - Douala, Cameroun', 50, footerY + 25, { align: 'center', width: 495 })
                .text(`Facture générée le ${fmtDate(new Date())}`, 50, footerY + 40, { align: 'center', width: 495 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { genererFacturePDF };
