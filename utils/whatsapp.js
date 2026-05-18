const twilio = require('twilio');

// Configuration Twilio
const accountSid = 'ACbc4279456d8c2fd655fd2373322c4520';  // ← Remplace par ton Account SID
const authToken = '776e74c52482df65a791d2974c1ff7ba';     // ← Remplace par ton Auth Token
const whatsappFrom = 'whatsapp:+14155238886';              // ← Numéro sandbox Twilio

const client = twilio(accountSid, authToken);

async function envoyerWhatsApp(telephone, message) {
    try {
        // Nettoie le numéro (garde seulement les chiffres)
        let numeroPropre = telephone.replace(/[^0-9]/g, '');
        
        // Ajoute le code pays +225 pour la Côte d'Ivoire
        if (!numeroPropre.startsWith('225') && numeroPropre.length <= 10) {
            numeroPropre = '225' + numeroPropre;
        }
        
        const destinataire = `whatsapp:+${numeroPropre}`;
        
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
