const router = require('express').Router();
const fs = require('fs');

function isAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

router.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TONKPIRESTO - Admin</title>
            <link rel="stylesheet" href="/css/style.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: url('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=1920') no-repeat center center fixed;
                    background-size: cover;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    position: relative;
                }
                body::before {
                    content: "";
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: -1;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    width: 100%;
                    max-width: 450px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                h1 { color: #e67e22; text-align: center; margin-bottom: 30px; }
                input { width: 100%; padding: 12px 15px; margin: 10px 0; border: 1px solid #ddd; border-radius: 10px; font-size: 16px; }
                button { width: 100%; background: linear-gradient(135deg, #e67e22, #d35400); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔐 TONKPIRESTO - Admin</h1>
                <form action="/admin/login" method="POST">
                    <input type="password" name="motdepasse" placeholder="Mot de passe" required>
                    <button type="submit">Se connecter</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

router.post('/login', (req, res) => {
    const motdepasse = req.body.motdepasse;
    if (motdepasse === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.send('<h1>❌ Mot de passe incorrect</h1><a href="/admin/login">Réessayer</a>');
    }
});

router.get('/', isAdmin, (req, res) => {
    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) {
        const data = fs.readFileSync('./data/commandes.json', 'utf8');
        commandes = JSON.parse(data);
    }

    const totalCommandes = commandes.length;
    const totalCA = commandes.reduce((sum, c) => sum + (c.total || 0), 0);
    const commandesEnAttente = commandes.filter(c => c.statut === 'en attente').length;
    const commandesLivrees = commandes.filter(c => c.statut === 'livrée' || c.statut === 'livree').length;
    const paiementLivraison = commandes.filter(c => c.paiement === 'livraison').length;
    const paiementStripe = commandes.filter(c => c.paiement === 'stripe').length;

    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const caParJour = [0, 0, 0, 0, 0, 0, 0];
    const commandesParJour = [0, 0, 0, 0, 0, 0, 0];

    commandes.forEach(cmd => {
        const date = new Date(cmd.date);
        const jourIndex = date.getDay();
        const indexMap = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5};
        const idx = indexMap[jourIndex] || 0;
        caParJour[idx] += cmd.total || 0;
        commandesParJour[idx] += 1;
    });

    const ventesPlats = {};
    commandes.forEach(cmd => {
        if (cmd.articles && Array.isArray(cmd.articles)) {
            cmd.articles.forEach(article => {
                const nom = article.nom;
                if (!ventesPlats[nom]) ventesPlats[nom] = 0;
                ventesPlats[nom] += article.quantite || 1;
            });
        }
    });

    const topPlats = Object.entries(ventesPlats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const platsLabels = topPlats.map(p => p[0]);
    const platsData = topPlats.map(p => p[1]);

    let tableRows = '';
    const commandesReverse = [...commandes].reverse();
    for (const cmd of commandesReverse) {
        let articlesHtml = '';
        if (cmd.articles && Array.isArray(cmd.articles)) {
            articlesHtml = cmd.articles.map(a => a.nom + ' x' + (a.quantite || 1)).join('<br>');
        }
        const adresseCourte = cmd.adresse ? cmd.adresse.substring(0, 30) + (cmd.adresse.length > 30 ? '...' : '') : '-';
        const paiementText = cmd.paiement === 'stripe' ? '💳 Carte' : '💵 Livraison';
        const statutValue = cmd.statut || 'en attente';

        let nomComplet = 'Invité';
        if (cmd.userPrenom && cmd.userNom) {
            nomComplet = cmd.userPrenom + ' ' + cmd.userNom;
        } else if (cmd.userName && cmd.userName !== 'Invité') {
            nomComplet = cmd.userName;
        }

        tableRows += `
            <tr>
                <td>${cmd.id || '-'}</td>
                <td>${cmd.date || '-'}</td>
                <td>${nomComplet}</td>
                <td>${articlesHtml || '-'}</td>
                <td><strong>${(cmd.total || 0).toLocaleString()} F CFA</strong></td>
                <td>${cmd.telephone || '-'}</td>
                <td>${adresseCourte}</td>
                <td>${paiementText}</td>
                <td>
                    <form action="/admin/update-statut" method="POST" style="display: inline-block;">
                        <input type="hidden" name="id" value="${cmd.id}">
                        <select name="statut" onchange="this.form.submit()">
                            <option value="en attente" ${statutValue === 'en attente' ? 'selected' : ''}>⏳ En attente</option>
                            <option value="en preparation" ${statutValue === 'en preparation' ? 'selected' : ''}>🍳 En préparation</option>
                            <option value="en livraison" ${statutValue === 'en livraison' ? 'selected' : ''}>🛵 En livraison</option>
                            <option value="livree" ${statutValue === 'livree' ? 'selected' : ''}>✅ Livrée</option>
                            <option value="annulee" ${statutValue === 'annulee' ? 'selected' : ''}>❌ Annulée</option>
                        </select>
                    </form>
                    <a href="/admin/export-pdf/${cmd.id}" style="background: #e74c3c; color: white; padding: 5px 10px; border-radius: 5px; text-decoration: none; font-size: 12px; display: inline-block; margin-top: 5px;">📄 PDF</a>
                </td>
            </tr>
        `;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>TONKPIRESTO - Dashboard</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/css/style.css">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: url('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=1920') no-repeat center center fixed;
                    background-size: cover;
                    min-height: 100vh;
                    padding: 20px;
                    position: relative;
                }
                body::before {
                    content: "";
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: -1;
                }
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .header {
                    background: white;
                    border-radius: 12px;
                    padding: 15px 20px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .header h1 { color: #e67e22; font-size: 22px; }
                .deconnexion { background: #e74c3c; color: white; padding: 8px 18px; border-radius: 8px; text-decoration: none; }
                .btn-export-all { background: #27ae60; color: white; padding: 8px 15px; border-radius: 8px; text-decoration: none; margin-left: 10px; }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 15px;
                    text-align: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .stat-card h3 { color: #666; font-size: 13px; margin-bottom: 8px; }
                .stat-card .valeur { font-size: 28px; font-weight: bold; color: #e67e22; }
                .stat-card .unite { font-size: 11px; color: #999; }
                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                    margin-bottom: 25px;
                }
                .chart-container {
                    background: white;
                    border-radius: 12px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .chart-container h3 { color: #333; margin-bottom: 15px; border-left: 4px solid #e67e22; padding-left: 10px; }
                canvas { max-height: 280px; width: 100% !important; }
                .commandes-table {
                    background: white;
                    border-radius: 12px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow-x: auto;
                }
                .commandes-table h3 { margin-bottom: 15px; }
                table { width: 100%; min-width: 900px; border-collapse: collapse; }
                th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
                th { background: #e67e22; color: white; }
                tr:hover { background: #f9f9f9; }
                select { padding: 5px; border-radius: 5px; border: 1px solid #ddd; }
                @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 TONKPIRESTO - Administration</h1>
                    <div>
                        <a href="/admin/export-all-pdf" class="btn-export-all">📊 Exporter tout en PDF</a>
                        <a href="/admin/logout" class="deconnexion">🚪 Se déconnecter</a>
                    </div>
                </div>
                <div class="stats-grid">
                    <div class="stat-card"><h3>📦 Total commandes</h3><div class="valeur">${totalCommandes}</div></div>
                    <div class="stat-card"><h3>💰 Chiffre d'affaires</h3><div class="valeur">${totalCA.toLocaleString()}</div><div class="unite">F CFA</div></div>
                    <div class="stat-card"><h3>⏳ En attente</h3><div class="valeur">${commandesEnAttente}</div></div>
                    <div class="stat-card"><h3>✅ Livrées</h3><div class="valeur">${commandesLivrees}</div></div>
                    <div class="stat-card"><h3>💵 Paiement livraison</h3><div class="valeur">${paiementLivraison}</div></div>
                    <div class="stat-card"><h3>💳 Paiement en ligne</h3><div class="valeur">${paiementStripe}</div></div>
                </div>
                <div class="charts-grid">
                    <div class="chart-container"><h3>📈 Chiffre d'affaires par jour</h3><canvas id="caChart"></canvas></div>
                    <div class="chart-container"><h3>📊 Commandes par jour</h3><canvas id="commandesChart"></canvas></div>
                    <div class="chart-container"><h3>🏆 Top 5 des plats</h3><canvas id="topPlatsChart"></canvas></div>
                    <div class="chart-container"><h3>🥧 Répartition des paiements</h3><canvas id="paiementChart"></canvas></div>
                </div>
                <div class="commandes-table">
                    <h3>📋 Liste des commandes</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Articles</th>
                                <th>Total</th>
                                <th>Téléphone</th>
                                <th>Adresse</th>
                                <th>Paiement</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
            <script>
                new Chart(document.getElementById('caChart'), { type: 'line', data: { labels: ${JSON.stringify(jours)}, datasets: [{ label: 'CA (F CFA)', data: ${JSON.stringify(caParJour)}, borderColor: '#e67e22', fill: true }] } });
                new Chart(document.getElementById('commandesChart'), { type: 'bar', data: { labels: ${JSON.stringify(jours)}, datasets: [{ label: 'Commandes', data: ${JSON.stringify(commandesParJour)}, backgroundColor: '#27ae60' }] } });
                new Chart(document.getElementById('topPlatsChart'), { type: 'bar', data: { labels: ${JSON.stringify(platsLabels)}, datasets: [{ label: 'Quantité', data: ${JSON.stringify(platsData)}, backgroundColor: '#3498db' }] }, options: { indexAxis: 'y' } });
                new Chart(document.getElementById('paiementChart'), { type: 'doughnut', data: { labels: ['Livraison', 'En ligne'], datasets: [{ data: [${paiementLivraison}, ${paiementStripe}], backgroundColor: ['#27ae60', '#e67e22'] }] } });
            </script>
        </body>
        </html>
    `;
    res.send(html);
});

router.post('/update-statut', isAdmin, (req, res) => {
    const { id, statut } = req.body;
    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) {
        commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    }
    const commande = commandes.find(c => c.id == id);
    if (commande) commande.statut = statut;
    fs.writeFileSync('./data/commandes.json', JSON.stringify(commandes, null, 2));
    res.redirect('/admin');
});

router.get('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/admin/login');
});

// Export PDF d'une commande
router.get('/export-pdf/:id', isAdmin, async (req, res) => {
    const { genererFacturePDF } = require('../utils/pdf');
    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) {
        commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    }
    const commande = commandes.find(c => c.id == req.params.id);
    if (!commande) return res.status(404).send('Commande non trouvée');
    const pdfBuffer = await genererFacturePDF(commande);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture_${commande.id}.pdf`);
    res.send(pdfBuffer);
});

// Export PDF de toutes les commandes
router.get('/export-all-pdf', isAdmin, async (req, res) => {
    const PDFDocument = require('pdfkit');
    let commandes = [];
    if (fs.existsSync('./data/commandes.json')) {
        commandes = JSON.parse(fs.readFileSync('./data/commandes.json', 'utf8'));
    }
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=rapport_commandes.pdf');
        res.send(buffer);
    });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#e67e22').text('TONKPIRESTO', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#666').text('Rapport des commandes', { align: 'center' });
    doc.moveDown();
    doc.text(`Date du rapport : ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    const totalCA = commandes.reduce((sum, c) => sum + (c.total || 0), 0);
    doc.fontSize(12).font('Helvetica-Bold').text('Statistiques');
    doc.fontSize(10).font('Helvetica').text(`Total commandes : ${commandes.length}`);
    doc.text(`Chiffre d'affaires total : ${totalCA.toLocaleString()} F CFA`);
    doc.text(`Commandes en attente : ${commandes.filter(c => c.statut === 'en attente').length}`);
    doc.text(`Commandes livrées : ${commandes.filter(c => c.statut === 'livrée' || c.statut === 'livree').length}`);
    doc.moveDown();
    doc.strokeColor('#e67e22').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').text('Liste des commandes');
    doc.moveDown(0.5);
    commandes.slice().reverse().forEach((cmd, index) => {
        let nomClient = 'Invité';
        if (cmd.userPrenom && cmd.userNom) nomClient = cmd.userPrenom + ' ' + cmd.userNom;
        else if (cmd.userName && cmd.userName !== 'Invité') nomClient = cmd.userName;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#e67e22').text(`Commande n°${cmd.id} - ${cmd.date}`);
        doc.fontSize(9).font('Helvetica').fillColor('#333').text(`Client : ${nomClient}`);
        doc.text(`Total : ${(cmd.total || 0).toLocaleString()} F CFA`);
        doc.text(`Statut : ${cmd.statut === 'livree' ? 'Livrée' : (cmd.statut || 'en attente')}`);
        doc.text(`Paiement : ${cmd.paiement === 'stripe' ? 'Carte bancaire' : 'À la livraison'}`);
        if (cmd.telephone) doc.text(`Téléphone : ${cmd.telephone}`);
        if (cmd.adresse) doc.text(`Adresse : ${cmd.adresse}`);
        if (cmd.userLieuResidence) doc.text(`Lieu de résidence : ${cmd.userLieuResidence}`);
        doc.moveDown(0.3);
        doc.fontSize(8).font('Helvetica').text('Articles commandés :');
        if (cmd.articles && Array.isArray(cmd.articles)) {
            cmd.articles.forEach(a => {
                doc.text(`  - ${a.nom} x${a.quantite} : ${(a.prix * a.quantite).toLocaleString()} F CFA`);
            });
        }
        if (index < commandes.length - 1) {
            doc.moveDown();
            doc.strokeColor('#ddd').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
        }
    });
    const pageHeight = doc.page.height;
    doc.fontSize(8).font('Helvetica').fillColor('#999').text('Document généré par TONKPIRESTO', 50, pageHeight - 40, { align: 'center' });
    doc.end();
});

module.exports = router;