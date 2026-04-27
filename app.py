from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from database import get_db, init_db

app = Flask(__name__)
CORS(app)
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/planning')
def planning():
    return render_template('planning.html')

@app.route('/generer', methods=['POST'])
def generer():
    data = request.get_json()

    nom = data['nom']
    heure_reveil = int(data['heure_reveil'].replace(':', ''))
    heure_coucher = int(data['heure_coucher'].replace(':', ''))
    cours = data['cours']

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO etudiants (nom, heure_reveil, heure_coucher)
        VALUES (?, ?, ?)
    ''', (nom, data['heure_reveil'], data['heure_coucher']))
    etudiant_id = cursor.lastrowid

    for c in cours:
        cursor.execute('''
            INSERT INTO cours (etudiant_id, jour, heure_debut, heure_fin, matiere)
            VALUES (?, ?, ?, ?, ?)
        ''', (etudiant_id, c['jour'], c['heure_debut'], c['heure_fin'], c['matiere']))

    conn.commit()
    conn.close()

    planning = generer_planning(data['heure_reveil'], data['heure_coucher'], cours)

    return jsonify({'success': True, 'nom': nom, 'planning': planning})


def heure_en_minutes(heure_str):
    h, m = map(int, heure_str.split(':'))
    return h * 60 + m

def minutes_en_heure(minutes):
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"

def generer_planning(heure_reveil, heure_coucher, cours):
    jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    planning = {}

    reveil_min = heure_en_minutes(heure_reveil)
    coucher_min = heure_en_minutes(heure_coucher)
    if coucher_min <= reveil_min:
        coucher_min += 24 * 60

    for jour in jours:
        slots = []
        cours_du_jour = sorted(
            [c for c in cours if c['jour'] == jour],
            key=lambda x: x['heure_debut']
        )

        # 1. REVEIL + PREPARATION (30 min)
        fin_reveil = reveil_min + 30
        slots.append({
            'type': 'reveil',
            'debut': minutes_en_heure(reveil_min),
            'fin': minutes_en_heure(fin_reveil),
            'activite': 'Réveil et préparation matinale',
            'couleur': '#27ae60',
            'emoji': '🌅'
        })

        # 2. PETIT DEJEUNER fixé à 6h (30 min)
        pdj_debut = heure_en_minutes('06:00')
        pdj_fin = pdj_debut + 30

        # Etude avant petit déjeuner si réveil avant 6h
        if fin_reveil < pdj_debut:
            slots.append({
                'type': 'etude',
                'debut': minutes_en_heure(fin_reveil),
                'fin': minutes_en_heure(pdj_debut),
                'activite': 'Étude personnelle matinale',
                'couleur': '#8e44ad',
                'emoji': '✏️'
            })

        slots.append({
            'type': 'repas',
            'debut': '06:00',
            'fin': minutes_en_heure(pdj_fin),
            'activite': 'Petit déjeuner',
            'couleur': '#f39c12',
            'emoji': '🍳'
        })

        curseur = pdj_fin
        etude_total = 0
        etude_max = 360  # 6h = 360 minutes

        # 3. COURS + ETUDES intercalées
        for c in cours_du_jour:
            debut_cours = heure_en_minutes(c['heure_debut'])
            fin_cours = heure_en_minutes(c['heure_fin'])

            # Etude personnelle avant le cours
            if curseur < debut_cours and etude_total < etude_max:
                dispo = min(debut_cours - curseur, etude_max - etude_total)
                if dispo >= 30:
                    slots.append({
                        'type': 'etude',
                        'debut': minutes_en_heure(curseur),
                        'fin': minutes_en_heure(curseur + dispo),
                        'activite': f'Étude personnelle - Préparation {c["matiere"]}',
                        'couleur': '#8e44ad',
                        'emoji': '✏️'
                    })
                    etude_total += dispo
                    curseur += dispo

            # Cours
            slots.append({
                'type': 'cours',
                'debut': c['heure_debut'],
                'fin': c['heure_fin'],
                'activite': f'Cours : {c["matiere"]}',
                'couleur': '#2980b9',
                'emoji': '📚'
            })
            curseur = fin_cours

            # Révision après cours (45 min)
            if etude_total < etude_max:
                revision = min(45, etude_max - etude_total)
                slots.append({
                    'type': 'etude',
                    'debut': minutes_en_heure(curseur),
                    'fin': minutes_en_heure(curseur + revision),
                    'activite': f'Révision : {c["matiere"]}',
                    'couleur': '#8e44ad',
                    'emoji': '📝'
                })
                etude_total += revision
                curseur += revision

        # 4. DEJEUNER à 13h (1h)
        dejeuner_debut = heure_en_minutes('13:00')
        dejeuner_fin = dejeuner_debut + 60

        if curseur < dejeuner_debut and etude_total < etude_max:
            dispo = min(dejeuner_debut - curseur, etude_max - etude_total)
            if dispo >= 30:
                slots.append({
                    'type': 'etude',
                    'debut': minutes_en_heure(curseur),
                    'fin': minutes_en_heure(curseur + dispo),
                    'activite': 'Étude personnelle et approfondissement',
                    'couleur': '#8e44ad',
                    'emoji': '✏️'
                })
                etude_total += dispo

        slots.append({
            'type': 'repas',
            'debut': '13:00',
            'fin': '14:00',
            'activite': 'Déjeuner',
            'couleur': '#f39c12',
            'emoji': '🍽️'
        })
        curseur = dejeuner_fin

        # 5. ETUDE apres dejeuner jusqu'à 6h total
        while etude_total < etude_max and curseur < coucher_min - 180:
            bloc = min(90, etude_max - etude_total)
            slots.append({
                'type': 'etude',
                'debut': minutes_en_heure(curseur),
                'fin': minutes_en_heure(curseur + bloc),
                'activite': 'Étude personnelle et approfondissement',
                'couleur': '#8e44ad',
                'emoji': '✏️'
            })
            etude_total += bloc
            curseur += bloc

        # 6. LOISIRS (2h)
        loisirs_fin = curseur + 120
        slots.append({
            'type': 'loisirs',
            'debut': minutes_en_heure(curseur),
            'fin': minutes_en_heure(loisirs_fin),
            'activite': 'Loisirs et activités personnelles',
            'couleur': '#e74c3c',
            'emoji': '🎮'
        })
        curseur = loisirs_fin

        # 7. DINER à 20h (45 min)
        diner_debut = heure_en_minutes('20:00')
        diner_fin = diner_debut + 45

        if curseur < diner_debut:
            slots.append({
                'type': 'loisirs',
                'debut': minutes_en_heure(curseur),
                'fin': '20:00',
                'activite': 'Temps libre et détente',
                'couleur': '#e74c3c',
                'emoji': '🎵'
            })

        slots.append({
            'type': 'repas',
            'debut': '20:00',
            'fin': '20:45',
            'activite': 'Dîner',
            'couleur': '#f39c12',
            'emoji': '🍽️'
        })
        curseur = diner_fin

        # 8. PREPARATION SOMMEIL (30 min)
        prep_sommeil_debut = coucher_min - 30
        if curseur < prep_sommeil_debut:
            slots.append({
                'type': 'loisirs',
                'debut': minutes_en_heure(curseur),
                'fin': minutes_en_heure(prep_sommeil_debut),
                'activite': 'Relaxation et lecture',
                'couleur': '#e74c3c',
                'emoji': '📖'
            })

        slots.append({
            'type': 'sommeil_prep',
            'debut': minutes_en_heure(prep_sommeil_debut),
            'fin': minutes_en_heure(coucher_min),
            'activite': 'Préparation au sommeil',
            'couleur': '#7f8c8d',
            'emoji': '🧘'
        })

        # 9. SOMMEIL (du coucher au réveil)
        slots.append({
            'type': 'sommeil',
            'debut': minutes_en_heure(coucher_min),
            'fin': heure_reveil,
            'activite': 'Sommeil et repos nocturne',
            'couleur': '#2c3e50',
            'emoji': '🌙'
        })

        planning[jour] = slots

    return planning 

if __name__ == '__main__':
    app.run(debug=True)