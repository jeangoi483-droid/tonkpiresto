require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration SMTP Brevo
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Fonction pour envoyer un email de confirmation
async function envoyerConfirmationCommande(email, commande, telephone, adresse) {
    const articlesHtml = commande.articles.map(a => `
        <tr>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.nom}</td>
            <td style="padding:8px; text-align:center;">${a.quantite}</td>
            <td style="padding:8px; text-align:right;">${(a.prix * a.quantite).toLocaleString()} F CFA</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial; background:#f5f5f5; padding:20px;">
            <div style="max-width:600px; margin:0 auto; background:white; border-radius:15px; overflow:hidden;">
                <div style="background:#e67e22; padding:20px; text-align:center; color:white;">
                    <h1>🍕 TONKPIRESTO</h1>
                    <p>Le goût des sommets, livré chez vous</p>
                </div>
                <div style="padding:20px;">
                    <h2>✅ Commande confirmée !</h2>
                    <p>Bonjour ${commande.userPrenom || ''} ${commande.userName || ''},</p>
                    <p>Merci pour votre commande n°<strong>${commande.id}</strong>.</p>
                    
                    <h3>📋 Détail de la commande :</h3>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead><tr style="background:#f0f0f0;"><th>Article</th><th>Qté</th><th>Total</th></tr></thead>
                        <tbody>${articlesHtml}</tbody>
                        <tfoot><tr><td colspan="2" style="text-align:right;"><strong>Total :</strong></td><td><strong>${commande.total.toLocaleString()} F CFA</strong></td></tr></tfoot>
                    </table>
                    
                    <div style="background:#f8f9fa; padding:15px; border-radius:10px; margin:20px 0;">
                        <p><strong>📞 Téléphone :</strong> ${telephone}</p>
                        <p><strong>🏠 Adresse :</strong> ${adresse}</p>
                        <p><strong>💵 Paiement :</strong> ${commande.paiement === 'stripe' ? 'Carte bancaire' : (commande.paiement === 'wave' ? 'Wave' : 'À la livraison')}</p>
                    </div>
                    
                    <p>⏱️ Temps de livraison estimé : <strong>30-45 minutes</strong></p>
                    <p>Merci de votre confiance !</p>
                    <p style="margin-top:20px;">L'équipe TONKPIRESTO</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        await transporter.sendMail({
            from: `"TONKPIRESTO" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `✅ Commande confirmée n°${commande.id}`,
            html: html
        });
        console.log(`✅ Email envoyé à ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur email:', error);
        return false;
    }
}

module.exports = { envoyerConfirmationCommande };