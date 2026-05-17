require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const stripe = require('stripe')('ta_clé_secrète_stripe'); // 🔑 REMPLACE PAR TA VRAIE CLÉ STRIPE
const { envoyerConfirmationCommande, envoyerEmailBienvenue } = require('./utils/email');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'un-secret-tres-securise',
    resave: false,
    saveUninitialized: true
}));

// Middleware pour rendre user disponible dans toutes les vues
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Liste des plats (version stable)
const plats = [
    { id: 1, nom: 'Pizza Margherita', prix: 5000, description: 'Sauce tomate, mozzarella, basilic frais', image: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?w=300', categorie: 'plats' },
    { id: 2, nom: 'Burger Classique', prix: 3500, description: 'Steak haché, salade, tomate, oignon, sauce spéciale', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?w=300', categorie: 'plats' },
    { id: 3, nom: 'Salade César', prix: 4000, description: 'Poulet grillé, parmesan, croûtons, sauce césar', image: 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?w=300', categorie: 'plats' },
    { id: 4, nom: 'Pâtes Carbonara', prix: 4500, description: 'Pâtes fraîches, œuf, parmesan, lardons', image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=300', categorie: 'plats' },
    { id: 5, nom: 'Tiramisu', prix: 2500, description: 'Mascarpone, café, boudoirs, cacao', image: 'https://images.pexels.com/photos/1326946/pexels-photo-1326946.jpeg?w=300', categorie: 'desserts' },
    { id: 6, nom: "Jus d'Orange Frais", prix: 1500, description: 'Orange pressée maison, sans sucre ajouté', image: 'https://i.pinimg.com/736x/e0/e3/88/e0e38815c2c03be364968870631c8ee1.jpg', categorie: 'boissons' },
    { id: 7, nom: 'Nems Poulet', prix: 2000, description: '3 pièces, sauce nuoc-mâm', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=300', categorie: 'entrees' },
    { id: 8, nom: 'Bowl Végétarien', prix: 5500, description: 'Quinoa, avocat, légumes grillés, sauce tahini', image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=300', categorie: 'plats' },
    { id: 9, nom: 'Samoussas Légumes', prix: 1800, description: '4 pièces, épices douces', image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?w=300', categorie: 'entrees' },
    { id: 10, nom: 'Fondant Chocolat', prix: 2200, description: 'Cœur coulant, glace vanille', image: 'https://images.pexels.com/photos/1326946/pexels-photo-1326946.jpeg?w=300', categorie: 'desserts' },
    { id: 11, nom: 'Coca-Cola', prix: 1000, description: '33cl, bien frais', image: 'https://i.pinimg.com/736x/db/79/a2/db79a22a3565ccf16a6183d8bebdd426.jpg', categorie: 'boissons' },
    { id: 12, nom: 'Beignets de Poisson (Fataya)', prix: 2500, description: 'Beignets croustillants au thon épicé, sauce piquante', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=300', categorie: 'entrees' },
    { id: 13, nom: 'Accras de Morue', prix: 2200, description: 'Beignets de morue aux herbes, 6 pièces', image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?w=300', categorie: 'entrees' },
    { id: 14, nom: 'Brochettes Mafé', prix: 3000, description: 'Brochettes de bœuf sauce arachide, accompagnées de légumes', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?w=300', categorie: 'entrees' },
    { id: 15, nom: 'Mafé Tieb', prix: 6500, description: 'Riz au poulet, sauce arachide, légumes frais', image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=300', categorie: 'plats' },
    { id: 16, nom: 'Yassa Poulet', prix: 6000, description: 'Poulet mariné aux oignons, citron et moutarde, riz parfumé', image: 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?w=300', categorie: 'plats' },
    { id: 17, nom: 'Alloco Poisson Braisé', prix: 5500, description: 'Banane plantain frite, poisson braisé, sauce tomate', image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=300', categorie: 'plats' },
    { id: 18, nom: 'Kédjénou Poulet', prix: 6200, description: 'Poulet mijoté aux légumes, parfumé aux épices', image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=300', categorie: 'plats' },
    { id: 19, nom: 'Foutou Sauce Gombo', prix: 5800, description: 'Foutou (igname/banane plantain), sauce gombo au poisson', image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=300', categorie: 'plats' },
    { id: 20, nom: 'Dessert Bissap', prix: 2000, description: 'Mousse à base de bissap (hibiscus), gingembre, vanille', image: 'https://images.pexels.com/photos/1326946/pexels-photo-1326946.jpeg?w=300', categorie: 'desserts' },
    { id: 21, nom: 'Beignets de Patate Douce', prix: 1800, description: 'Beignets moelleux à la patate douce, sucre vanillé', image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?w=300', categorie: 'desserts' },
    { id: 22, nom: 'Jus de Bissap', prix: 1200, description: "Boisson rafraîchissante à l'hibiscus, menthe et gingembre", image: 'https://i.pinimg.com/736x/52/3e/ba/523eba1c9d68905fcc870c35cdce271d.jpg', categorie: 'boissons' },
    { id: 23, nom: 'Jus de Gingembre', prix: 1200, description: 'Jus pétillant au gingembre frais, citron vert', image: 'https://i.pinimg.com/1200x/9b/42/cd/9b42cd74edec6e31b8ea1ffb42eb8de9.jpg', categorie: 'boissons' },
    { id: 24, nom: 'Dolo (Bière de Mil)', prix: 1500, description: 'Bière traditionnelle à base de mil, légère et rafraîchissante', image: 'https://i.pinimg.com/1200x/a6/34/d8/a634d82672317cdf1c8ecf9f0f4b6991.jpg', categorie: 'boissons' }
];

// Page d'accueil
app.get('/', (req, res) => {
    const categorie = req.query.categorie || 'tous';
    let platsFiltres = plats;
    if (categorie !== 'tous') {
        platsFiltres = plats.filter(p => p.categorie === categorie);
    }
    res.render('index', { plats: platsFiltres, categorieActive: categorie, user: req.session.user });
});

// API : nombre total d'articles dans le panier (pour le badge)
app.get('/api/cart-count', (req, res) => {
    const panier = req.session.panier || [];
    let total = 0;
    for (const item of panier) {
        total += item.quantite;
    }
    res.json({ count: total });
});

// Ajouter au panier
app.post('/ajouter-panier', (req, res) => {
    const platId = parseInt(req.body.id);
    const quantite = parseInt(req.body.quantite) || 1;
    if (!req.session.panier) req.session.panier = [];
    const existingIndex = req.session.panier.findIndex(item => item.id === platId);
    if (existingIndex !== -1) {
        req.session.panier[existingIndex].quantite += quantite;
    } else {
        req.session.panier.push({ id: platId, quantite: quantite });
    }
    res.redirect('/panier');
});

// Page du panier
app.get('/panier', (req, res) => {
    const panierItems = req.session.panier || [];
    const articles = panierItems.map(item => {
        const plat = plats.find(p => p.id === item.id);
        return { ...plat, quantite: item.quantite, total: plat.prix * item.quantite };
    }).filter(a => a);
    let total = 0;
    articles.forEach(article => total += article.total);
    res.render('panier', { articles, total, user: req.session.user });
});

// Modifier quantité
app.post('/panier/modifier-quantite/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const quantite = parseInt(req.body.quantite);
    if (req.session.panier) {
        const item = req.session.panier.find(i => i.id === id);
        if (item) {
            if (quantite <= 0) {
                req.session.panier = req.session.panier.filter(i => i.id !== id);
            } else {
                item.quantite = quantite;
            }
        }
    }
    res.redirect('/panier');
});

// Retirer un article du panier
app.post('/panier/retirer/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (req.session.panier) {
        req.session.panier = req.session.panier.filter(item => item.id !== id);
    }
    res.redirect('/panier');
});

// Valider la commande (paiement à la livraison)
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
    if (req.session.user?.email) envoyerConfirmationCommande(req.session.user.email, commande, telephone, adresse).catch(err => console.error(err));
    req.session.panier = [];
    res.send(`
        <h1>✅ Commande validée</h1>
        <p>Merci pour votre commande n°${commande.id}</p>
        <a href="/"><button>🔄 Nouvelle commande</button></a>
    `);
});

// Paiement Stripe
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
        res.send(`<h1>❌ Erreur de paiement</h1><p>${error.message}</p><a href="/panier"><button>Retour</button></a>`);
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
    if (req.session.user?.email) envoyerConfirmationCommande(req.session.user.email, commande, 'Non renseigné', 'Non renseignée').catch(err => console.error(err));
    req.session.panier = [];
    res.send(`<h1>✅ Paiement réussi</h1><p>Merci pour votre commande n°${commande.id}</p><a href="/"><button>🔄 Nouvelle commande</button></a>`);
});

// Paiement Wave
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
    if (req.session.user?.email) envoyerConfirmationCommande(req.session.user.email, commande, telephone, adresse).catch(err => console.error(err));
    req.session.panier = [];
    res.send(`<h1>✅ Commande validée (Wave)</h1><p>Transaction : ${transaction_id}</p><a href="/"><button>🔄 Nouvelle commande</button></a>`);
});

// Notes et avis
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
    const moyenne = avisPlat.length > 0 ? avisPlat.reduce((sum, a) => sum + a.note, 0) / avisPlat.length : 0;
    res.json({ avis: avisPlat, moyenne: moyenne.toFixed(1), total: avisPlat.length });
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

// Démarrage
app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});
