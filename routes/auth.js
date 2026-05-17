const router = require('express').Router();
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { envoyerEmailBienvenue } = require('../utils/email');

// ============================================
// PAGE D'INSCRIPTION
// ============================================
router.get('/inscription', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TONKPIRESTO - Inscription</title>
            <link rel="stylesheet" href="/css/style.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                h1 { color: #e67e22; text-align: center; margin-bottom: 30px; }
                input, select { width: 100%; padding: 12px 15px; margin: 8px 0; border: 1px solid #ddd; border-radius: 10px; font-size: 16px; }
                input:focus, select:focus { outline: none; border-color: #e67e22; box-shadow: 0 0 5px rgba(230,126,34,0.3); }
                button { width: 100%; background: linear-gradient(135deg, #e67e22, #d35400); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 20px; transition: transform 0.2s; }
                button:hover { transform: scale(1.02); }
                .lien { text-align: center; margin-top: 20px; color: #666; }
                .lien a { color: #e67e22; text-decoration: none; }
                .lien a:hover { text-decoration: underline; }
                .row { display: flex; gap: 15px; }
                .row .half { flex: 1; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📝 Créer un compte</h1>
                <form action="/auth/inscription" method="POST">
                    <div class="row">
                        <div class="half"><input type="text" name="nom" placeholder="👤 Nom" required></div>
                        <div class="half"><input type="text" name="prenom" placeholder="👤 Prénom" required></div>
                    </div>
                    <input type="email" name="email" placeholder="📧 Email" required>
                    <input type="tel" name="telephone" placeholder="📞 Téléphone" required>
                    <input type="password" name="motdepasse" placeholder="🔒 Mot de passe" required>
                    <input type="text" name="lieuResidence" placeholder="📍 Lieu de résidence" required>
                    <button type="submit">S'inscrire</button>
                </form>
                <div class="lien">Déjà un compte ? <a href="/auth/connexion">Se connecter</a></div>
            </div>
        </body>
        </html>
    `);
});

router.post('/inscription', async (req, res) => {
    const { nom, prenom, email, telephone, motdepasse, lieuResidence } = req.body;
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    let users = [];
    if (fs.existsSync('./data/users.json')) {
        users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    }
    if (users.find(u => u.email === email)) {
        return res.send(`<h1>❌ Email déjà utilisé</h1><a href="/auth/inscription">Réessayer</a>`);
    }
    const hashedPassword = await bcrypt.hash(motdepasse, 10);
    const newUser = {
        id: Date.now(),
        nom, prenom, email, telephone,
        motdepasse: hashedPassword,
        lieuResidence,
        dateInscription: new Date().toLocaleString()
    };
    users.push(newUser);
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
    req.session.user = {
        id: newUser.id, nom: newUser.nom, prenom: newUser.prenom,
        email: newUser.email, telephone: newUser.telephone,
        lieuResidence: newUser.lieuResidence
    };
    envoyerEmailBienvenue(email, prenom + ' ' + nom).catch(err => console.error('Erreur email:', err));
    res.redirect('/');
});

// ============================================
// CONNEXION
// ============================================
router.get('/connexion', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TONKPIRESTO - Connexion</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh; display: flex; justify-content: center; align-items: center;
                    padding: 20px;
                }
                .container {
                    background: white; border-radius: 20px; padding: 40px;
                    max-width: 450px; width:100%; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                h1 { color: #e67e22; text-align: center; margin-bottom: 30px; }
                input { width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:8px; }
                button { width:100%; background: linear-gradient(135deg, #e67e22, #d35400); color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:20px; }
                .lien { text-align:center; margin-top:20px; }
                .lien a { color:#e67e22; text-decoration:none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔐 Connexion</h1>
                <form action="/auth/connexion" method="POST">
                    <input type="email" name="email" placeholder="📧 Email" required>
                    <input type="password" name="motdepasse" placeholder="🔒 Mot de passe" required>
                    <button type="submit">Se connecter</button>
                </form>
                <div class="lien">Pas de compte ? <a href="/auth/inscription">S'inscrire</a></div>
            </div>
        </body>
        </html>
    `);
});

router.post('/connexion', async (req, res) => {
    const { email, motdepasse } = req.body;
    let users = [];
    if (fs.existsSync('./data/users.json')) {
        users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    }
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(motdepasse, user.motdepasse))) {
        return res.send(`<h1>❌ Email ou mot de passe incorrect</h1><a href="/auth/connexion">Réessayer</a>`);
    }
    req.session.user = {
        id: user.id, nom: user.nom, prenom: user.prenom,
        email: user.email, telephone: user.telephone,
        lieuResidence: user.lieuResidence
    };
    res.redirect('/');
});

// ============================================
// PROFIL UTILISATEUR
// ============================================
router.get('/profil', (req, res) => {
    if (!req.session.user) return res.redirect('/auth/connexion');

    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) {
        commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    }
    const mesCommandes = commandes.filter(c => c.userId === req.session.user.id).sort((a,b) => b.id - a.id);

    let commandesHtml = '';
    if (mesCommandes.length === 0) {
        commandesHtml = '<div class="aucune-commande"><p>📭 Aucune commande passée.</p><a href="/" class="btn-commander">🍕 Commander maintenant</a></div>';
    } else {
        mesCommandes.forEach(cmd => {
            const statutClass = (cmd.statut === 'livrée' || cmd.statut === 'payée') ? 'livree' : (cmd.statut === 'annulée' ? 'annulee' : 'en-cours');
            const statutTexte = cmd.statut === 'livrée' ? '✅ Livrée' : (cmd.statut === 'payée' ? '💳 Payée' : (cmd.statut === 'annulée' ? '❌ Annulée' : '⏳ En cours'));
            
            commandesHtml += `
                <div class="commande-card" data-id="${cmd.id}">
                    <div class="commande-header">
                        <div><span class="commande-num">📦 N° ${cmd.id}</span> <span class="commande-date">📅 ${cmd.date}</span></div>
                        <span class="statut-badge ${statutClass}">${statutTexte}</span>
                    </div>
                    <div class="commande-details">
                        <div class="commande-articles"><strong>🍽️ Articles :</strong><ul>${cmd.articles.map(a => `<li>${a.nom} x${a.quantite} - <span class="prix">${(a.prix * a.quantite).toLocaleString()} F CFA</span></li>`).join('')}</ul></div>
                        <div class="commande-total"><strong>Total : <span class="total-prix">${cmd.total.toLocaleString()} F CFA</span></strong></div>
                        <div class="commande-infos">
                            <p><strong>📞 Téléphone :</strong> ${cmd.telephone || 'Non renseigné'}</p>
                            <p><strong>🏠 Adresse :</strong> ${cmd.adresse || 'Non renseignée'}</p>
                            <p><strong>💵 Paiement :</strong> ${cmd.paiement === 'stripe' ? 'Carte en ligne' : (cmd.paiement === 'wave' ? 'Wave' : 'À la livraison')}</p>
                        </div>
                        <div class="commande-actions">
                            <button onclick="appelerServiceClient(${cmd.id})" class="btn-annuler">📞 Annuler la commande</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>TONKPIRESTO - Mon profil</title><link rel="stylesheet" href="/css/style.css">
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height:100vh; padding:20px; }
            .container { max-width:1000px; margin:0 auto; }
            .header { background:white; border-radius:15px; padding:20px; margin-bottom:30px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:15px; }
            .header h1 { color:#e67e22; }
            .btn-retour-header { background:#95a5a6; color:white; padding:10px 20px; border-radius:25px; text-decoration:none; }
            .profile-section { background:white; border-radius:20px; overflow:hidden; margin-bottom:30px; box-shadow:0 5px 15px rgba(0,0,0,0.1); }
            .profile-header { background: linear-gradient(135deg, #e67e22, #d35400); padding:25px; text-align:center; color:white; }
            .avatar { font-size:60px; background:rgba(255,255,255,0.2); width:100px; height:100px; display:flex; align-items:center; justify-content:center; border-radius:50%; margin:0 auto 15px; }
            .profile-info { padding:25px; }
            .info-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(250px,1fr)); gap:15px; }
            .info-card { background:#f8f9fa; border-radius:12px; padding:15px; }
            .info-card .label { font-size:12px; color:#999; text-transform:uppercase; }
            .info-card .value { font-size:18px; font-weight:bold; margin-top:5px; }
            .danger-zone { background:white; border-radius:20px; padding:25px; margin-bottom:30px; text-align:center; border:2px solid #e74c3c; }
            .btn-supprimer { background:#e74c3c; color:white; border:none; padding:12px 25px; border-radius:25px; cursor:pointer; }
            .commandes-section { background:white; border-radius:20px; padding:25px; margin-bottom:30px; }
            .commandes-section h3 { color:#e67e22; margin-bottom:20px; }
            .commande-card { background:#f8f9fa; border-radius:15px; margin-bottom:20px; overflow:hidden; }
            .commande-header { background:#2c3e50; color:white; padding:12px 20px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; }
            .statut-badge { padding:5px 12px; border-radius:20px; font-size:12px; font-weight:bold; }
            .statut-badge.en-cours { background:#f39c12; }
            .statut-badge.livree { background:#27ae60; }
            .statut-badge.annulee { background:#e74c3c; }
            .commande-details { padding:20px; }
            .commande-articles ul { list-style:none; margin:10px 0 15px 20px; }
            .commande-articles li { padding:5px 0; border-bottom:1px solid #eee; }
            .commande-total { text-align:right; font-size:18px; margin:15px 0; padding-top:10px; border-top:2px solid #e67e22; }
            .commande-infos { background:#ecf0f1; padding:15px; border-radius:10px; margin:15px 0; font-size:13px; }
            .btn-annuler { background:#e74c3c; color:white; border:none; padding:8px 20px; border-radius:20px; cursor:pointer; margin-top:10px; }
            .aucune-commande { text-align:center; padding:40px; }
            .btn-commander { background:#e67e22; color:white; padding:10px 25px; border-radius:25px; text-decoration:none; display:inline-block; }
            .modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); justify-content:center; align-items:center; z-index:1000; }
            .modal-content { background:white; padding:30px; border-radius:20px; max-width:400px; text-align:center; }
            .modal-buttons { display:flex; gap:10px; margin-top:20px; }
            .btn-confirm { background:#e74c3c; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; flex:1; }
            .btn-cancel { background:#95a5a6; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; flex:1; }
            .tel-link { display:inline-block; background:#27ae60; color:white; padding:12px 25px; border-radius:25px; text-decoration:none; font-size:18px; font-weight:bold; margin:10px 0; }
            @media (max-width:768px) { .info-grid { grid-template-columns:1fr; } }
        </style>
        </head>
        <body>
        <div class="container">
            <div class="header"><h1>👤 Mon compte</h1><a href="/" class="btn-retour-header">← Retour</a></div>
            <div class="profile-section">
                <div class="profile-header"><div class="avatar">🍕</div><h2>${req.session.user.prenom} ${req.session.user.nom}</h2></div>
                <div class="profile-info"><div class="info-grid">
                    <div class="info-card"><div class="label">📧 Email</div><div class="value">${req.session.user.email}</div></div>
                    <div class="info-card"><div class="label">📞 Téléphone</div><div class="value">${req.session.user.telephone}</div></div>
                    <div class="info-card"><div class="label">📍 Lieu de résidence</div><div class="value">${req.session.user.lieuResidence}</div></div>
                </div></div>
            </div>
            <div class="commandes-section"><h3>📋 Historique des commandes</h3>${commandesHtml}</div>
            <div class="danger-zone"><h3>⚠️ Zone dangereuse</h3><p>Suppression définitive du compte.</p><button onclick="ouvrirModalSuppression()" class="btn-supprimer">🗑️ Supprimer mon compte</button></div>
        </div>
        <div id="modalSuppression" class="modal"><div class="modal-content"><h3>⚠️ Confirmation</h3><p>Tapez <strong>SUPPRIMER</strong> pour confirmer :</p><input type="text" id="confirmText" placeholder="SUPPRIMER"><div class="modal-buttons"><button onclick="confirmerSuppression()" class="btn-confirm">Confirmer</button><button onclick="fermerModalSuppression()" class="btn-cancel">Annuler</button></div></div></div>
        <div id="modalAnnulation" class="modal"><div class="modal-content"><h3>📞 Annulation de commande</h3><p>Pour annuler votre commande, veuillez nous contacter au :</p><p style="font-size: 28px; font-weight: bold; color: #e67e22; margin: 15px 0;">📞 07 48 41 52 86</p><p>Notre service client est disponible de 11h à 22h, 7j/7.</p><div class="modal-buttons"><a href="tel:+2250748415286" class="tel-link">📱 Appeler maintenant</a></div><div class="modal-buttons"><button onclick="fermerModalAnnulation()" class="btn-cancel">Fermer</button></div></div></div>
        <script>
            function ouvrirModalSuppression() { document.getElementById('modalSuppression').style.display = 'flex'; document.getElementById('confirmText').value = ''; }
            function fermerModalSuppression() { document.getElementById('modalSuppression').style.display = 'none'; }
            function confirmerSuppression() { if (document.getElementById('confirmText').value === 'SUPPRIMER') window.location.href = '/auth/supprimer-compte'; else alert('Tapez SUPPRIMER'); }
            function appelerServiceClient(id) { document.getElementById('modalAnnulation').style.display = 'flex'; }
            function fermerModalAnnulation() { document.getElementById('modalAnnulation').style.display = 'none'; }
            window.onclick = function(e) { if (e.target === document.getElementById('modalSuppression')) fermerModalSuppression(); if (e.target === document.getElementById('modalAnnulation')) fermerModalAnnulation(); }
        </script>
        </body>
        </html>
    `);
});

// ============================================
// SUPPRESSION COMPTE
// ============================================
router.get('/supprimer-compte', (req, res) => {
    if (!req.session.user) return res.redirect('/auth/connexion');
    const userId = req.session.user.id;

    let users = [];
    if (fs.existsSync('./data/users.json')) users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    users = users.filter(u => u.id !== userId);
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));

    let avis = [];
    if (fs.existsSync('./data/avis.json')) avis = JSON.parse(fs.readFileSync('./data/avis.json', 'utf8'));
    avis = avis.filter(a => a.userId !== userId);
    fs.writeFileSync('./data/avis.json', JSON.stringify(avis, null, 2));

    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    commandes.forEach(cmd => {
        if (cmd.userId === userId) {
            cmd.userId = null;
            cmd.userName = 'Ancien utilisateur';
            cmd.userPrenom = null;
            cmd.userEmail = null;
            cmd.userTelephone = null;
            cmd.userLieuResidence = null;
        }
    });
    fs.writeFileSync('./data/commandes.json', JSON.stringify(commandes, null, 2));

    req.session.destroy();
    res.send(`<h1>✅ Compte supprimé</h1><p>Merci d'avoir utilisé TONKPIRESTO</p><a href="/">Accueil</a>`);
});

// ============================================
// DÉCONNEXION
// ============================================
router.get('/deconnexion', (req, res) => {
    req.session.user = null;
    res.redirect('/');
});

module.exports = router;