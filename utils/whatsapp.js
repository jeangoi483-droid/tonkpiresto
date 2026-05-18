const twilio = require('twilio');

// Configuration Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = 'whatsapp:+14155238886';  // Numéro sandbox Twilio

const client = twilio(accountSid, authToken);

async function envoyerWhatsApp(telephone, message) {
    try {
        // Nettoie le numéro (garde seulement les chiffres)
        let numeroPropre = telephone.replace(/[^0-9]/g, '');
        
        // Enlève l'indicatif 225 s'il est déjà présent
        if (numeroPropre.startsWith('225')) {
            numeroPropre = numeroPropre.substring(3);
        }
        
        // Ajoute le code pays +225 pour la Côte d'Ivoire
        const destinataire = `whatsapp:+225${numeroPropre}`;
        
        console.log('📱 Envoi WhatsApp à:', destinataire);
        
        const result = await client.messages.create({
            body: message,
            from: whatsappFrom,
            to: destinataire
        });
        
        console.log('✅ WhatsApp envoyé:', result.sid);
        return true;
    } catch (error) {
        console.error('❌ Erreur WhatsApp:', error.message);
        return false;
    }
}

async function envoyerConfirmationWhatsApp(telephone, commande) {
    const articles = commande.articles.map(a => `${a.nom} x${a.quantite}`).join(', ');
    const total = commande.total.toLocaleString();
    
    const message = `
🍕 *TONKPIRESTO* - Confirmation commande
━━━━━━━━━━━━━━━━━━━━━
📦 N°: ${commande.id}
📅 Date: ${commande.date}
📋 Articles: ${articles}
💰 Total: ${total} F CFA
🏠 Adresse: ${commande.adresse}
━━━━━━━━━━━━━━━━━━━━━
⏱️ Livraison estimée: 30-45 min
💚 Merci pour votre commande !
    `.trim();
    
    return await envoyerWhatsApp(telephone, message);
}

module.exports = { envoyerWhatsApp, envoyerConfirmationWhatsApp };