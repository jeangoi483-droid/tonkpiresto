require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration Brevo (Sendinblue) - GRATUIT - 300 emails/jour
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Vérifier la connexion au démarrage
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Erreur de connexion email:', error);
    } else {
        console.log('✅ Serveur email prêt à envoyer des messages');
    }
});

/**
 * Envoie un email de confirmation de commande
 */
async function envoyerConfirmationCommande(to, commande, telephone, adresse) {
    const articlesHtml = commande.articles.map(a => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${a.nom}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${a.quantite}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${a.prix.toLocaleString()} F CFA</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${(a.prix * a.quantite).toLocaleString()} F CFA</td>
        </tr>
    `).join('');

    const total = commande.total.toLocaleString();
    const paiementText = commande.paiement === 'stripe' ? '💳 Carte bancaire (payé en ligne)' : '💵 À la livraison';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Confirmation TONKPIRESTO</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #e67e22, #d35400); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0;">🍕 TONKPIRESTO</h1>
                    <p style="margin: 5px 0 0;">LE GOUT DES SOMMETS, LIVRE CHEZ VOUS</p>
                </div>
                <div style="padding: 25px;">
                    <p style="font-size: 16px;">Bonjour,</p>
                    <p>Merci pour votre commande ! Nous avons bien reçu votre commande et nous la préparons.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>📦 N° commande :</strong> ${commande.id}</p>
                        <p><strong>📅 Date :</strong> ${commande.date}</p>
                        <p><strong>📞 Téléphone :</strong> ${telephone}</p>
                        <p><strong>🏠 Adresse :</strong> ${adresse}</p>
                        <p><strong>💰 Paiement :</strong> ${paiementText}</p>
                    </div>
                    
                    <h3 style="color: #e67e22;">📋 Détail de votre commande :</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="padding: 10px; text-align: left;">Article</th>
                                <th style="padding: 10px; text-align: center;">Qté</th>
                                <th style="padding: 10px; text-align: right;">Prix unitaire</th>
                                <th style="padding: 10px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${articlesHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background: #fef5e8;">
                                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total :</td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; color: #e67e22;">${total} F CFA</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div style="background: #fef5e8; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0;">⏱️ <strong>Temps de livraison estimé :</strong> 30-45 minutes</p>
                    </div>
                    
                    <hr style="margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        Merci de votre confiance !<br>
                        L'équipe TONKPIRESTO
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
TONKPIRESTO - COMMANDE CONFIRMEE N°${commande.id}

Détail de votre commande :
${commande.articles.map(a => `- ${a.nom} x${a.quantite} : ${(a.prix * a.quantite).toLocaleString()} F CFA`).join('\n')}

Total : ${total} F CFA

Livraison à : ${adresse}
Téléphone : ${telephone}
Paiement : ${paiementText}
Temps estimé : 30-45 minutes

Merci pour votre commande !
    `;

    try {
        const info = await transporter.sendMail({
            from: `"TONKPIRESTO - Commandes" <jeanseverin41@gmail.com>`,
            to: to,
            subject: `✅ Commande confirmée n°${commande.id}`,
            text: textContent,
            html: htmlContent
        });
        
        console.log(`✅ Email envoyé à ${to}`);
        console.log(`   Message ID: ${info.messageId}`);
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
        return false;
    }
}

/**
 * Envoie un email de bienvenue
 */
async function envoyerEmailBienvenue(to, nom) {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Bienvenue chez TONKPIRESTO</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #27ae60, #219a52); padding: 20px; text-align: center; color: white;">
                    <h1>🍕 Bienvenue ${nom} !</h1>
                    <p>TONKPIRESTO - LE GOUT DES SOMMETS, LIVRE CHEZ VOUS</p>
                </div>
                <div style="padding: 25px;">
                    <p>Merci de vous être inscrit sur notre site de commande en ligne !</p>
                    <p>Vous pouvez dès maintenant :</p>
                    <ul>
                        <li>📋 Parcourir notre menu</li>
                        <li>🛒 Passer des commandes</li>
                        <li>⭐ Donner votre avis sur les plats</li>
                    </ul>
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="http://localhost:3000" style="background: #e67e22; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; display: inline-block;">Commander maintenant</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        await transporter.sendMail({
            from: `"TONKPIRESTO - Bienvenue" <jeanseverin41@gmail.com>`,
            to: to,
            subject: '🍕 Bienvenue chez TONKPIRESTO !',
            html: htmlContent
        });
        console.log(`✅ Email de bienvenue envoyé à ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur email bienvenue:', error.message);
        return false;
    }
}

module.exports = { envoyerConfirmationCommande, envoyerEmailBienvenue };