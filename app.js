require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const stripe = require('stripe')('ta_clé_secrète_stripe'); // 🔑 REMPLACE PAR TA VRAIE CLÉ STRIPE
const { envoyerConfirmationCommande, envoyerEmailBienvenue } = require('./utils/email');
const { envoyerConfirmationWhatsApp } = require('./utils/whatsapp');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'un-secret-tres-securise',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

const plats = [
    { id: 1, nom: 'Tchep Poulet', prix: 3500, description: 'Plat sénégalais à base de riz et poulet', image: 'https://saveursdeoumy.com/wp-content/uploads/2025/10/IMG-20251015-WA0013-934x1024.jpg?w=300', categorie: 'plats' },
    { id: 2, nom: 'Tchep Poisson', prix: 3500, description: 'Riz au poisson et légumes', image: 'https://issanny.com/wp-content/uploads/2021/09/Tchep-Poisson.jpeg?w=300', categorie: 'plats' },
    { id: 3, nom: 'Foutou sauce graine', prix: 2000, description: 'Foutou accompagné de sauce graine', image: 'https://i.pinimg.com/236x/51/6d/1f/516d1f6fe988023f92504b2a8df3474a.jpg?w=300', categorie: 'plats' },
    { id: 4, nom: 'Placali sauce graine', prix: 1500, description: 'Placali et sauce graine traditionnelle', image: 'https://i.pinimg.com/736x/6b/c5/27/6bc527f4d6c3549ba4361a591a3dcfa1.jpg?w=300', categorie: 'plats' },
    { id: 5, nom: 'Tiramisu', prix: 2500, description: 'Mascarpone, café, boudoirs, cacao', image: 'https://images.pexels.com/photos/1326946/pexels-photo-1326946.jpeg?w=300', categorie: 'desserts' },
    { id: 6, nom: "Jus d'Orange Frais", prix: 1500, description: 'Orange pressée maison', image: 'https://i.pinimg.com/736x/e0/e3/88/e0e38815c2c03be364968870631c8ee1.jpg', categorie: 'boissons' },
    { id: 7, nom: 'Nems Poulet', prix: 2000, description: '3 pièces, sauce nuoc-mâm', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=300', categorie: 'entrees' },
    { id: 8, nom: 'Bowl Végétarien', prix: 5500, description: 'Quinoa, avocat, légumes grillés', image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=300', categorie: 'plats' },
    { id: 9, nom: 'Samoussas Légumes', prix: 1800, description: '4 pièces, épices douces', image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?w=300', categorie: 'entrees' },
    { id: 10, nom: 'Fondant Chocolat', prix: 2200, description: 'Cœur coulant, glace vanille', image: 'https://images.pexels.com/photos/1326946/pexels-photo-1326946.jpeg?w=300', categorie: 'desserts' },
    { id: 11, nom: 'Coca-Cola', prix: 1000, description: '33cl, bien frais', image: 'https://i.pinimg.com/736x/db/79/a2/db79a22a3565ccf16a6183d8bebdd426.jpg', categorie: 'boissons' },
    { id: 12, nom: 'Beignets de Poisson', prix: 2500, description: 'Beignets croustillants au thon', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=300', categorie: 'entrees' },
    { id: 13, nom: 'Accras de Morue', prix: 2200, description: 'Beignets de morue aux herbes', image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?w=300', categorie: 'entrees' },
    { id: 14, nom: 'Brochettes Mafé', prix: 3000, description: 'Brochettes de bœuf sauce arachide', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?w=300', categorie: 'entrees' },
    { id: 15, nom: 'Mafé Tieb', prix: 6500, description: 'Riz au poulet, sauce arachide', image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=300', categorie: 'plats' },
    { id: 16, nom: 'Yassa Poulet', prix: 6000, description: 'Poulet mariné aux oignons et citron', image: 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?w=300', categorie: 'plats' },
    { id: 17, nom: 'Alloco Poisson Braisé', prix: 5500, description: 'Banane plantain frite, poisson braisé', image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=300', categorie: 'plats' },
    { id: 18, nom: 'Kédjénou Poulet', prix: 6200, description: 'Poulet mijoté aux légumes', image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=300', categorie: 'plats' },
    { id: 19, nom: 'Foutou Sauce Gombo', prix: 5800, description: 'Foutou, sauce gombo au poisson', image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=300', categorie: 'plats' },
    { id: 20, nom: 'Dessert Bissap', prix: 2000, description: 'Mousse à base de bissap', image: 'https://images.pexels.com/photos/1326946/pexels-photo-1326946.jpeg?w=300', categorie: 'desserts' },
    { id: 21, nom: 'Beignets de Patate Douce', prix: 1800, description: 'Beignets moelleux', image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?w=300', categorie: 'desserts' },
    { id: 22, nom: 'Jus de Bissap', prix: 1200, description: 'Boisson à l’hibiscus', image: 'https://i.pinimg.com/736x/52/3e/ba/523eba1c9d68905fcc870c35cdce271d.jpg', categorie: 'boissons' },
    { id: 23, nom: 'Jus de Gingembre', prix: 1200, description: 'Jus pétillant au gingembre', image: 'https://i.pinimg.com/1200x/9b/42/cd/9b42cd74edec6e31b8ea1ffb42eb8de9.jpg', categorie: 'boissons' },
    { id: 24, nom: 'Dolo', prix: 1500, description: 'Bière traditionnelle de mil', image: 'https://i.pinimg.com/1200x/a6/34/d8/a634d82672317cdf1c8ecf9f0f4b6991.jpg', categorie: 'boissons' }
];

app.get('/', (req, res) => {
    const categorie = req.query.categorie || 'tous';
    let platsFiltres = plats;
    if (categorie !== 'tous') platsFiltres = plats.filter(p => p.categorie === categorie);
    res.render('index', { plats: platsFiltres, categorieActive: categorie, user: req.session.user });
});

app.get('/api/cart-count', (req, res) => {
    const panier = req.session.panier || [];
    let total = 0;
    for (const item of panier) total += item.quantite;
    res.json({ count: total });
});

app.post('/ajouter-panier', (req, res) => {
    const platId = parseInt(req.body.id);
    const quantite = parseInt(req.body.quantite) || 1;
    if (!req.session.panier) req.session.panier = [];
    const idx = req.session.panier.findIndex(i => i.id === platId);
    if (idx !== -1) req.session.panier[idx].quantite += quantite;
    else req.session.panier.push({ id: platId, quantite });
    res.redirect('/panier');
});

app.get('/panier', (req, res) => {
    const items = req.session.panier || [];
    const articles = items.map(item => {
        const plat = plats.find(p => p.id === item.id);
        return { ...plat, quantite: item.quantite, total: plat.prix * item.quantite };
    }).filter(a => a);
    const total = articles.reduce((s, a) => s + a.total, 0);
    res.render('panier', { articles, total, user: req.session.user });
});

app.post('/panier/modifier-quantite/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const q = parseInt(req.body.quantite);
    if (req.session.panier) {
        const item = req.session.panier.find(i => i.id === id);
        if (item) {
            if (q <= 0) req.session.panier = req.session.panier.filter(i => i.id !== id);
            else item.quantite = q;
        }
    }
    res.redirect('/panier');
});

app.post('/panier/retirer/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (req.session.panier) req.session.panier = req.session.panier.filter(i => i.id !== id);
    res.redirect('/panier');
});

// Valider la commande (paiement à la livraison) avec WhatsApp
app.post('/valider-commande', (req, res) => {
    const panierItems = req.session.panier || [];
    if (panierItems.length === 0) return res.redirect('/panier');
    const telephone = req.body.telephone;
    const adresse = req.body.adresse;
    const articles = panierItems.map(item => {
        const plat = plats.find(p => p.id === item.id);
        return { id: plat.id, nom: plat.nom, prix: plat.prix, quantite: item.quantite, total: plat.prix * item.quantite, description: plat.description, image: plat.image };
    });
    let total = 0;
    articles.forEach(a => total += a.total);
    const commande = {
        id: Date.now(), date: new Date().toLocaleString(), articles, total, telephone, adresse, statut: 'en attente', paiement: 'livraison',
        userId: req.session.user?.id, userName: req.session.user?.nom || 'Invité', userPrenom: req.session.user?.prenom || null,
        userEmail: req.session.user?.email, userTelephone: req.session.user?.telephone, userLieuResidence: req.session.user?.lieuResidence
    };
    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    commandes.push(commande);
    fs.writeFileSync('./data/commandes.json', JSON.stringify(commandes, null, 2));
    
    // Email
    if (req.session.user?.email) {
        envoyerConfirmationCommande(req.session.user.email, commande, telephone, adresse).catch(err => console.error(err));
    }
    
    // WhatsApp
    if (telephone) {
        envoyerConfirmationWhatsApp(telephone, commande).catch(err => console.error('Erreur WhatsApp:', err));
    }
    
    req.session.panier = [];

    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Commande validée</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#fff5eb 0%,#ffe4d6 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;}
            .card{background:white;border-radius:32px;max-width:550px;width:100%;padding:40px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.1);}
            .card h1{color:#27ae60;font-size:28px;margin-bottom:16px;}
            .numero{font-size:20px;font-weight:bold;color:#e67e22;margin-bottom:24px;}
            .details{background:#f8f9fa;border-radius:24px;padding:20px;text-align:left;margin:24px 0;}
            .details p{margin:8px 0;font-size:15px;}
            .btn-retour{background:#e67e22;color:white;border:none;padding:14px 30px;border-radius:50px;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;transition:0.2s;}
            .btn-retour:hover{background:#d35400;transform:scale(1.02);}
            .logo{width:60px;margin-bottom:20px;border-radius:50%;}
            @media (max-width:550px){.card{padding:24px;}.card h1{font-size:24px;}}
        </style>
        </head>
        <body>
            <div class="card">
                <img src="/images/logo.png" class="logo">
                <h1>✅ Commande validée !</h1>
                <div class="numero">📦 N° ${commande.id}</div>
                <div class="details">
                    <p><strong>📞 Téléphone :</strong> ${telephone}</p>
                    <p><strong>🏠 Adresse :</strong> ${adresse}</p>
                    <p><strong>💰 Total :</strong> ${total.toLocaleString()} F CFA</p>
                    <p><strong>💵 Paiement :</strong> À la livraison</p>
                </div>
                <p style="margin-bottom:24px;">Un livreur arrivera dans <strong>30-45 minutes</strong>.</p>
                <a href="/" class="btn-retour">🔄 Nouvelle commande</a>
            </div>
        </body>
        </html>
    `);
});

app.post('/creer-paiement', async (req, res) => {
    const panierItems = req.session.panier || [];
    if (panierItems.length === 0) return res.redirect('/panier');
    const lineItems = [];
    for (const item of panierItems) {
        const plat = plats.find(p => p.id === item.id);
        if (plat) lineItems.push({
            price_data: { currency: 'xof', product_data: { name: plat.nom, description: plat.description, images: [plat.image] }, unit_amount: plat.prix },
            quantity: item.quantite
        });
    }
    try {
        const sessionStripe = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], line_items: lineItems, mode: 'payment',
            success_url: 'http://localhost:3000/succes-paiement?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3000/panier', customer_email: req.session.user?.email
        });
        res.redirect(sessionStripe.url);
    } catch (error) {
        res.send(`<h1>❌ Erreur paiement</h1><p>${error.message}</p><a href="/panier"><button>Retour</button></a>`);
    }
});

app.get('/succes-paiement', async (req, res) => {
    const panierItems = req.session.panier || [];
    if (panierItems.length === 0) return res.redirect('/');
    const articles = panierItems.map(item => {
        const plat = plats.find(p => p.id === item.id);
        return { id: plat.id, nom: plat.nom, prix: plat.prix, quantite: item.quantite, total: plat.prix * item.quantite, description: plat.description, image: plat.image };
    });
    let total = 0; articles.forEach(a => total += a.total);
    const commande = {
        id: Date.now(), date: new Date().toLocaleString(), articles, total, telephone: '', adresse: '', statut: 'payée', paiement: 'stripe',
        userId: req.session.user?.id, userName: req.session.user?.nom || 'Invité', userPrenom: req.session.user?.prenom || null,
        userEmail: req.session.user?.email, userTelephone: req.session.user?.telephone, userLieuResidence: req.session.user?.lieuResidence
    };
    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    commandes.push(commande);
    fs.writeFileSync('./data/commandes.json', JSON.stringify(commandes, null, 2));
    if (req.session.user?.email) {
        envoyerConfirmationCommande(req.session.user.email, commande, 'Non renseigné', 'Non renseignée').catch(err => console.error(err));
    }
    req.session.panier = [];

    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Paiement réussi</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#fff5eb 0%,#ffe4d6 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;}
            .card{background:white;border-radius:32px;max-width:550px;width:100%;padding:40px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.1);}
            .card h1{color:#27ae60;font-size:28px;margin-bottom:16px;}
            .numero{font-size:20px;font-weight:bold;color:#e67e22;margin-bottom:24px;}
            .details{background:#f8f9fa;border-radius:24px;padding:20px;text-align:left;margin:24px 0;}
            .details p{margin:8px 0;font-size:15px;}
            .btn-retour{background:#e67e22;color:white;border:none;padding:14px 30px;border-radius:50px;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;transition:0.2s;}
            .btn-retour:hover{background:#d35400;transform:scale(1.02);}
            .logo{width:60px;margin-bottom:20px;border-radius:50%;}
        </style>
        </head>
        <body>
            <div class="card">
                <img src="/images/logo.png" class="logo">
                <h1>✅ Paiement réussi !</h1>
                <div class="numero">📦 N° ${commande.id}</div>
                <div class="details">
                    <p><strong>💰 Total payé :</strong> ${total.toLocaleString()} F CFA</p>
                    <p><strong>💳 Paiement :</strong> Carte bancaire (Stripe)</p>
                    <p><strong>📧 Confirmation :</strong> ${req.session.user?.email ? 'Email envoyé' : 'Non envoyé'}</p>
                </div>
                <p style="margin-bottom:24px;">Votre commande sera préparée immédiatement.</p>
                <a href="/" class="btn-retour">🔄 Nouvelle commande</a>
            </div>
        </body>
        </html>
    `);
});

app.post('/valider-commande-wave', (req, res) => {
    const panierItems = req.session.panier || [];
    if (panierItems.length === 0) return res.redirect('/panier');
    const { transaction_id, telephone, adresse } = req.body;
    const articles = panierItems.map(item => {
        const plat = plats.find(p => p.id === item.id);
        return { id: plat.id, nom: plat.nom, prix: plat.prix, quantite: item.quantite, total: plat.prix * item.quantite, description: plat.description, image: plat.image };
    });
    let total = 0; articles.forEach(a => total += a.total);
    const commande = {
        id: Date.now(), date: new Date().toLocaleString(), articles, total, telephone, adresse, transaction_wave: transaction_id,
        statut: 'en attente (paiement Wave)', paiement: 'wave', userId: req.session.user?.id, userName: req.session.user?.nom || 'Invité', userPrenom: req.session.user?.prenom || null
    };
    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    commandes.push(commande);
    fs.writeFileSync('./data/commandes.json', JSON.stringify(commandes, null, 2));
    if (req.session.user?.email) {
        envoyerConfirmationCommande(req.session.user.email, commande, telephone, adresse).catch(err => console.error(err));
    }
    req.session.panier = [];

    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Commande Wave</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#fff5eb 0%,#ffe4d6 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;}
            .card{background:white;border-radius:32px;max-width:550px;width:100%;padding:40px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.1);}
            .card h1{color:#4caf50;font-size:28px;margin-bottom:16px;}
            .numero{font-size:20px;font-weight:bold;color:#e67e22;margin-bottom:24px;}
            .details{background:#f8f9fa;border-radius:24px;padding:20px;text-align:left;margin:24px 0;}
            .details p{margin:8px 0;font-size:15px;}
            .btn-retour{background:#e67e22;color:white;border:none;padding:14px 30px;border-radius:50px;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;transition:0.2s;}
            .btn-retour:hover{background:#d35400;transform:scale(1.02);}
            .logo{width:60px;margin-bottom:20px;border-radius:50%;}
        </style>
        </head>
        <body>
            <div class="card">
                <img src="/images/logo.png" class="logo">
                <h1>✅ Commande Wave</h1>
                <div class="numero">N° ${commande.id}</div>
                <div class="details">
                    <p><strong>💰 Total :</strong> ${total.toLocaleString()} F CFA</p>
                    <p><strong>💚 Transaction Wave :</strong> ${transaction_id}</p>
                    <p><strong>📞 Téléphone :</strong> ${telephone}</p>
                    <p><strong>🏠 Adresse :</strong> ${adresse}</p>
                </div>
                <a href="/" class="btn-retour">🔄 Nouvelle commande</a>
            </div>
        </body>
        </html>
    `);
});

app.post('/ajouter-avis/:platId', (req, res) => {
    const platId = parseInt(req.params.platId);
    const { note, commentaire } = req.body;
    const user = req.session.user;
    if (!user) return res.redirect('/auth/connexion');
    let avis = [];
    if (fs.existsSync('./data/avis.json')) avis = JSON.parse(fs.readFileSync('./data/avis.json', 'utf8'));
    avis.push({ id: Date.now(), platId, userId: user.id, userName: `${user.prenom} ${user.nom}`, note: parseInt(note), commentaire, date: new Date().toLocaleString() });
    fs.writeFileSync('./data/avis.json', JSON.stringify(avis, null, 2));
    res.redirect('/');
});

app.get('/api/avis/:platId', (req, res) => {
    const platId = parseInt(req.params.platId);
    let avis = [];
    if (fs.existsSync('./data/avis.json')) avis = JSON.parse(fs.readFileSync('./data/avis.json', 'utf8'));
    const avisPlat = avis.filter(a => a.platId === platId);
    const moyenne = avisPlat.length ? avisPlat.reduce((s, a) => s + a.note, 0) / avisPlat.length : 0;
    res.json({ avis: avisPlat, moyenne: moyenne.toFixed(1), total: avisPlat.length });
});

app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

app.listen(3000, () => console.log('Serveur démarré sur http://localhost:3000'));
