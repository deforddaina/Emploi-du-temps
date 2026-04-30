let nombreCours = 0;

function ajouterCours() {
    nombreCours++;
    const div = document.createElement('div');
    div.className = 'cours-item';
    div.id = `cours-${nombreCours}`;
    div.innerHTML = `
        <button class="btn-supprimer" 
            onclick="supprimerCours(${nombreCours})">
            ✕ Supprimer
        </button>
        <h3>Cours ${nombreCours}</h3>
        <div class="form-group">
            <label>Matière</label>
            <input type="text" 
                id="matiere-${nombreCours}" 
                placeholder="Ex: Mathématiques">
        </div>
        <div class="form-group">
            <label>Jour</label>
            <select id="jour-${nombreCours}">
                <option>Lundi</option>
                <option>Mardi</option>
                <option>Mercredi</option>
                <option>Jeudi</option>
                <option>Vendredi</option>
                <option>Samedi</option>
                <option>Dimanche</option>
            </select>
        </div>
        <div class="form-group">
            <label>Heure de début</label>
            <input type="time" id="debut-${nombreCours}" value="08:00">
        </div>
        <div class="form-group">
            <label>Heure de fin</label>
            <input type="time" id="fin-${nombreCours}" value="10:00">
        </div>
    `;
    document.getElementById('liste_cours').appendChild(div);
}

function supprimerCours(id) {
    const element = document.getElementById(`cours-${id}`);
    element.remove();
}

function genererPlanning() {
    const nom = document.getElementById('nom').value.trim();
    const heure_reveil = document.getElementById('heure_reveil').value;
    const heure_coucher = document.getElementById('heure_coucher').value;

    // Validation du nom
    if (!nom) {
        afficherErreur('Veuillez entrer votre nom complet !');
        return;
    }

    // Validation des heures
    if (!heure_reveil || !heure_coucher) {
        afficherErreur('Veuillez entrer vos heures de réveil et de coucher !');
        return;
    }

    // Validation que coucher > réveil
    if (heure_coucher <= heure_reveil) {
        afficherErreur('L\'heure de coucher doit être après l\'heure de réveil !');
        return;
    }

    // Validation des cours
    const items = document.querySelectorAll('.cours-item');
    if (items.length === 0) {
        afficherErreur('Veuillez ajouter au moins un cours !');
        return;
    }

    const cours = [];
    let erreur = false;

    items.forEach(item => {
        const id = item.id.split('-')[1];
        const matiere = document.getElementById(`matiere-${id}`).value.trim();
        const jour = document.getElementById(`jour-${id}`).value;
        const debut = document.getElementById(`debut-${id}`).value;
        const fin = document.getElementById(`fin-${id}`).value;

        if (!matiere) {
            afficherErreur('Veuillez entrer le nom de toutes les matières !');
            erreur = true;
            return;
        }

        if (!debut || !fin) {
            afficherErreur('Veuillez entrer les heures de tous les cours !');
            erreur = true;
            return;
        }

        if (fin <= debut) {
            afficherErreur(`L'heure de fin doit être après l'heure de début pour ${matiere} !`);
            erreur = true;
            return;
        }

        cours.push({ matiere, jour, heure_debut: debut, heure_fin: fin });
    });

    if (erreur) return;

    // Effacer les erreurs
    cacherErreur();

    fetch('/generer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, heure_reveil, heure_coucher, cours })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('planning', JSON.stringify(data));
            window.location.href = '/planning';
        } else {
            afficherErreur(data.message || 'Erreur lors de la génération !');
        }
    })
    .catch(() => {
        afficherErreur('Erreur de connexion au serveur !');
    });
}

function afficherErreur(message) {
    let errDiv = document.getElementById('erreur_message');
    if (!errDiv) {
        errDiv = document.createElement('div');
        errDiv.id = 'erreur_message';
        errDiv.style.cssText = `
            background: #ffe8e8;
            color: #e74c3c;
            padding: 15px 20px;
            border-radius: 10px;
            border-left: 4px solid #e74c3c;
            margin-bottom: 15px;
            font-weight: 600;
        `;
        document.querySelector('.btn-generer').before(errDiv);
    }
    errDiv.textContent = '⚠️ ' + message;
    errDiv.scrollIntoView({ behavior: 'smooth' });
}

function cacherErreur() {
    const errDiv = document.getElementById('erreur_message');
    if (errDiv) errDiv.remove();
}