const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Génère un PDF d'une commande
 * @param {object} commande - Objet commande
 * @returns {Promise<Buffer>} - Buffer du PDF
 */
async function genererFacturePDF(commande) {
    return new Promise((resolve, reject) => {
        try {
            // Créer un nouveau document PDF
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];
            
            // Collecter les données du PDF
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            // ============ EN-TÊTE ============
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .fillColor('#e67e22')
               .text('TONKPIRESTO', { align: 'center' });
            
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#666')
               .text('LE GOUT DES SOMMETS, LIVRE CHEZ VOUS', { align: 'center' });
            
            doc.moveDown();
            
            // Ligne de séparation
            doc.strokeColor('#e67e22')
               .lineWidth(1)
               .moveTo(50, doc.y)
               .lineTo(550, doc.y)
               .stroke();
            
            doc.moveDown();
            
            // ============ INFOS COMMANDE ============
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#333')
               .text('FACTURE', { align: 'center' });
            
            doc.moveDown();
            
            // Infos commande
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#333');
            
            doc.text(`N° Commande : ${commande.id}`, 50, doc.y);
            doc.text(`Date : ${commande.date}`, 50, doc.y);
            doc.text(`Statut : ${commande.statut === 'payée' ? 'Payée' : commande.statut}`, 50, doc.y);
            
            doc.moveDown();
            
            // ============ INFOS CLIENT ============
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#e67e22')
               .text('Informations client');
            
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#333');
            
            doc.text(`Client : ${commande.userName || 'Invité'}`, 50, doc.y);
            doc.text(`Téléphone : ${commande.telephone || 'Non renseigné'}`, 50, doc.y);
            doc.text(`Adresse : ${commande.adresse || 'Non renseignée'}`, 50, doc.y);
            doc.text(`Paiement : ${commande.paiement === 'stripe' ? 'Carte bancaire (en ligne)' : 'À la livraison'}`, 50, doc.y);
            
            doc.moveDown();
            
            // ============ TABLEAU DES ARTICLES ============
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#e67e22')
               .text('Détail de la commande');
            
            doc.moveDown(0.5);
            
            // En-tête du tableau
            const startY = doc.y;
            const col1 = 50;
            const col2 = 250;
            const col3 = 380;
            const col4 = 450;
            const col5 = 520;
            
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .fillColor('white')
               .rect(col1, startY, col2 - col1, 25)
               .fill('#e67e22');
            
            doc.fillColor('white')
               .text('Article', col1 + 5, startY + 8);
            
            doc.fillColor('white')
               .text('Qté', col3, startY + 8);
            
            doc.fillColor('white')
               .text('Prix unitaire', col4 - 20, startY + 8);
            
            doc.fillColor('white')
               .text('Total', col5 - 30, startY + 8);
            
            let currentY = startY + 25;
            
            // Lignes du tableau
            doc.font('Helvetica')
               .fillColor('#333');
            
            commande.articles.forEach((article, index) => {
                // Alternance des couleurs de fond
                if (index % 2 === 0) {
                    doc.rect(col1, currentY, col5 - col1, 22)
                       .fill('#f9f9f9')
                       .fillColor('#333');
                }
                
                doc.text(article.nom.length > 30 ? article.nom.substring(0, 27) + '...' : article.nom, col1 + 5, currentY + 5);
                doc.text(article.quantite.toString(), col3 + 15, currentY + 5);
                doc.text(`${article.prix.toLocaleString()} F CFA`, col4 - 10, currentY + 5);
                doc.text(`${(article.prix * article.quantite).toLocaleString()} F CFA`, col5 - 25, currentY + 5);
                
                currentY += 22;
            });
            
            // Ligne de total
            doc.rect(col1, currentY, col5 - col1, 25)
               .fill('#fef5e8');
            
            doc.font('Helvetica-Bold')
               .fillColor('#e67e22')
               .text('TOTAL', col4 - 20, currentY + 8);
            doc.text(`${commande.total.toLocaleString()} F CFA`, col5 - 25, currentY + 8);
            
            currentY += 35;
            doc.y = currentY;
            
            doc.moveDown();
            
            // ============ PIED DE PAGE ============
            const pageHeight = doc.page.height;
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor('#999');
            
            doc.text('Merci de votre confiance !', 50, pageHeight - 50, { align: 'center' });
            doc.text('L\'équipe TONKPIRESTO', 50, pageHeight - 40, { align: 'center' });
            doc.text(`Généré le ${new Date().toLocaleString()}`, 50, pageHeight - 30, { align: 'center' });
            
            // Finaliser le document
            doc.end();
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Sauvegarde le PDF sur le disque
 * @param {object} commande - Objet commande
 * @returns {string} - Chemin du fichier
 */
async function sauvegarderFacturePDF(commande) {
    const pdfDir = path.join(__dirname, '../data/factures');
    
    // Créer le dossier factures s'il n'existe pas
    if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    const filename = `facture_${commande.id}.pdf`;
    const filepath = path.join(pdfDir, filename);
    
    const pdfBuffer = await genererFacturePDF(commande);
    fs.writeFileSync(filepath, pdfBuffer);
    
    return filepath;
}

module.exports = { genererFacturePDF, sauvegarderFacturePDF };