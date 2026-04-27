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
    const nom = document.getElementById('nom').value;
    const heure_reveil = document.getElementById('heure_reveil').value;
    const heure_coucher = document.getElementById('heure_coucher').value;

    if (!nom) {
        alert('Veuillez entrer votre nom !');
        return;
    }

    const cours = [];
    const items = document.querySelectorAll('.cours-item');
    
    items.forEach(item => {
        const id = item.id.split('-')[1];
        cours.push({
            matiere: document.getElementById(`matiere-${id}`).value,
            jour: document.getElementById(`jour-${id}`).value,
            heure_debut: document.getElementById(`debut-${id}`).value,
            heure_fin: document.getElementById(`fin-${id}`).value
        });
    });

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
        }
    })
    .catch(err => {
        alert('Erreur lors de la génération !');
    });
}