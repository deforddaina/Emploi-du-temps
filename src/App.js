import React, { useState } from "react";
import "./App.css";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const COULEURS = {
  cours:     { fond: "#1e3a5f", texte: "#93c5fd", bordure: "#3b82f6", emoji: "🎓" },
  pratique:  { fond: "#14532d", texte: "#86efac", bordure: "#22c55e", emoji: "💻" },
  theorique: { fond: "#4c1d95", texte: "#c4b5fd", bordure: "#8b5cf6", emoji: "📖" },
  pause:     { fond: "#78350f", texte: "#fcd34d", bordure: "#f59e0b", emoji: "☕" },
  repas:     { fond: "#7f1d1d", texte: "#fca5a5", bordure: "#ef4444", emoji: "🍽️" },
  libre:     { fond: "#1e293b", texte: "#94a3b8", bordure: "#475569", emoji: "🎯" },
};

function heureEnTexte(h) {
  const hh = Math.floor(h);
  const mm = (h - hh) * 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function genererPlanning(cours, heuresEtude, dureeaPause) {
  const planning = {};

  JOURS.forEach((jour) => {
    const coursDuJour = cours
      .filter((c) => c.jour === jour)
      .map((c) => ({
        debut: c.heureDebut,
        fin: c.heureDebut + c.duree,
        label: c.nom,
        type: "cours",
      }));

    const repas = [
      { debut: 6.5,  fin: 7,    label: "Petit-déjeuner", type: "repas" },
      { debut: 12,   fin: 13,   label: "Déjeuner",        type: "repas" },
      { debut: 19,   fin: 19.5, label: "Dîner",           type: "repas" },
    ];

    let blocs = [...coursDuJour, ...repas].sort((a, b) => a.debut - b.debut);

    const fenetres = [];
    let curseur = 7;
    for (const bloc of blocs) {
      if (curseur < bloc.debut) fenetres.push({ debut: curseur, fin: bloc.debut });
      curseur = Math.max(curseur, bloc.fin);
    }
    if (curseur < 22) fenetres.push({ debut: curseur, fin: 22 });

    const blocsEtude = [];
    const pauseDuree = dureeaPause / 60;
    let pratiqueFait = 0;
    let theorieFait = 0;
    const pratiqueTotal = heuresEtude * 0.6;
    const theorieTotal  = heuresEtude * 0.4;

    fenetres.forEach((fen) => {
      let t = fen.debut;
      while (t < fen.fin - 0.5) {
        const restant = fen.fin - t;
        if (pratiqueFait < pratiqueTotal && restant >= 1) {
          const dur = Math.min(1.5, pratiqueTotal - pratiqueFait, restant - pauseDuree);
          if (dur >= 0.5) {
            blocsEtude.push({ debut: t, fin: t + dur, label: "Etude pratique", type: "pratique" });
            pratiqueFait += dur;
            t += dur;
            if (t + pauseDuree <= fen.fin) {
              blocsEtude.push({ debut: t, fin: t + pauseDuree, label: "Pause detente", type: "pause" });
              t += pauseDuree;
            }
          } else break;
        } else if (theorieFait < theorieTotal && restant >= 1) {
          const dur = Math.min(1, theorieTotal - theorieFait, restant - pauseDuree);
          if (dur >= 0.5) {
            blocsEtude.push({ debut: t, fin: t + dur, label: "Revision theorique", type: "theorique" });
            theorieFait += dur;
            t += dur;
            if (t + pauseDuree <= fen.fin) {
              blocsEtude.push({ debut: t, fin: t + pauseDuree, label: "Pause detente", type: "pause" });
              t += pauseDuree;
            }
          } else break;
        } else {
          blocsEtude.push({ debut: t, fin: fen.fin, label: "Temps libre", type: "libre" });
          t = fen.fin;
        }
      }
    });

    planning[jour] = [...blocs, ...blocsEtude].sort((a, b) => a.debut - b.debut);
  });

  return planning;
}

export default function App() {
  const [etape, setEtape]       = useState("configuration");
  const [cours, setCours]       = useState([
    { id: 1, nom: "INF 222 - Web Backend", jour: "Lundi",    heureDebut: 8,  duree: 2 },
    { id: 2, nom: "INF 231 - Complexite",  jour: "Mardi",    heureDebut: 10, duree: 2 },
    { id: 3, nom: "INF 222 - Web Backend", jour: "Jeudi",    heureDebut: 14, duree: 2 },
    { id: 4, nom: "INF 231 - Complexite",  jour: "Vendredi", heureDebut: 8,  duree: 2 },
  ]);
  const [nouveauCours, setNouveauCours] = useState({ nom: "", jour: "Lundi", heureDebut: 8, duree: 2 });
  const [heuresEtude, setHeuresEtude]   = useState(3);
  const [dureeaPause, setDureeaPause]   = useState(15);
  const [planning, setPlanning]         = useState(null);
  const [jourActif, setJourActif]       = useState("Lundi");

  const ajouterCours = () => {
    if (!nouveauCours.nom.trim()) return;
    setCours((prev) => [...prev, { ...nouveauCours, id: Date.now() }]);
    setNouveauCours({ nom: "", jour: "Lundi", heureDebut: 8, duree: 2 });
  };

  const supprimerCours = (id) => setCours((prev) => prev.filter((c) => c.id !== id));

  const generer = () => {
    const p = genererPlanning(cours, heuresEtude, dureeaPause);
    setPlanning(p);
    setEtape("resultat");
    setJourActif("Lundi");
  };

  const blocsJour = planning ? planning[jourActif] : [];

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="logo">SmartSchedule</div>
          <div className="sous-titre">Emploi du temps - Universite de Yaounde 1</div>
        </div>
        {etape === "resultat" && (
          <button className="btn-retour" onClick={() => setEtape("configuration")}>
            Modifier
          </button>
        )}
      </header>

      <div className="contenu">
        {etape === "configuration" && (
          <div>
            <div className="legende">
              {Object.entries(COULEURS).map(([type, c]) => (
                <span key={type} className="badge-legende"
                  style={{ background: c.fond, color: c.texte, border: "1px solid " + c.bordure }}>
                  {c.emoji} {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              ))}
            </div>

            <div className="carte">
              <h2 className="titre-section">Mes cours de la semaine</h2>
              {cours.map((c) => (
                <div key={c.id} className="ligne-cours">
                  <div className="info-cours">
                    <span className="nom-cours">{c.nom}</span>
                    <span className="detail-cours">
                      {c.jour} - {heureEnTexte(c.heureDebut)} a {heureEnTexte(c.heureDebut + c.duree)} ({c.duree}h)
                    </span>
                  </div>
                  <button className="btn-supprimer" onClick={() => supprimerCours(c.id)}>X</button>
                </div>
              ))}

              <div className="formulaire-ajout">
                <input className="champ" placeholder="Nom du cours (ex: INF 222)"
                  value={nouveauCours.nom}
                  onChange={(e) => setNouveauCours((p) => ({ ...p, nom: e.target.value }))} />
                <select className="champ" value={nouveauCours.jour}
                  onChange={(e) => setNouveauCours((p) => ({ ...p, jour: e.target.value }))}>
                  {JOURS.map((j) => <option key={j}>{j}</option>)}
                </select>
                <div className="ligne-champ">
                  <label>Heure debut</label>
                  <select className="champ" value={nouveauCours.heureDebut}
                    onChange={(e) => setNouveauCours((p) => ({ ...p, heureDebut: Number(e.target.value) }))}>
                    {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                      <option key={h} value={h}>{heureEnTexte(h)}</option>
                    ))}
                  </select>
                </div>
                <div className="ligne-champ">
                  <label>Duree</label>
                  <select className="champ" value={nouveauCours.duree}
                    onChange={(e) => setNouveauCours((p) => ({ ...p, duree: Number(e.target.value) }))}>
                    {[1, 1.5, 2, 2.5, 3, 4].map((h) => (
                      <option key={h} value={h}>{h}h</option>
                    ))}
                  </select>
                </div>
                <button className="btn-ajouter" onClick={ajouterCours}>+ Ajouter ce cours</button>
              </div>
            </div>

            <div className="carte">
              <h2 className="titre-section">Mes preferences</h2>
              <div className="preferences">
                <div className="pref-item">
                  <label>Heures d etude par jour : <strong>{heuresEtude}h</strong></label>
                  <input type="range" min="1" max="8" step="0.5"
                    value={heuresEtude} className="slider"
                    onChange={(e) => setHeuresEtude(Number(e.target.value))} />
                  <div className="slider-labels"><span>1h</span><span>8h</span></div>
                </div>
                <div className="pref-item">
                  <label>Duree des pauses : <strong>{dureeaPause} min</strong></label>
                  <input type="range" min="5" max="30" step="5"
                    value={dureeaPause} className="slider"
                    onChange={(e) => setDureeaPause(Number(e.target.value))} />
                  <div className="slider-labels"><span>5 min</span><span>30 min</span></div>
                </div>
              </div>
            </div>

            <button className="btn-generer" onClick={generer}>
              Generer mon emploi du temps
            </button>
          </div>
        )}

        {etape === "resultat" && planning && (
          <div className="resultat">
            <div className="onglets">
              {JOURS.map((jour) => {
                const nbCours = planning[jour].filter((b) => b.type === "cours").length;
                return (
                  <button key={jour}
                    className={"onglet" + (jourActif === jour ? " actif" : "")}
                    onClick={() => setJourActif(jour)}>
                    {jour.slice(0, 3)}
                    {nbCours > 0 && <span className="badge-nb">{nbCours}</span>}
                  </button>
                );
              })}
            </div>

            <h2 className="titre-jour">{jourActif}</h2>
            <div className="planning-jour">
              {blocsJour.length === 0 ? (
                <div className="jour-vide">Jour de repos !</div>
              ) : (
                blocsJour.map((bloc, i) => {
                  const c = COULEURS[bloc.type] || COULEURS.libre;
                  return (
                    <div key={i} className="bloc"
                      style={{ background: c.fond, borderLeft: "4px solid " + c.bordure, color: c.texte }}>
                      <div className="bloc-heure">
                        {heureEnTexte(bloc.debut)} - {heureEnTexte(bloc.fin)}
                      </div>
                      <div className="bloc-label">{c.emoji} {bloc.label}</div>
                      <div className="bloc-duree">{Math.round((bloc.fin - bloc.debut) * 60)} min</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="resume">
              {["cours","pratique","theorique","pause","libre"].map((type) => {
                const total = blocsJour
                  .filter((b) => b.type === type)
                  .reduce((s, b) => s + (b.fin - b.debut), 0);
                if (total === 0) return null;
                const c = COULEURS[type];
                return (
                  <div key={type} className="resume-item"
                    style={{ borderColor: c.bordure, color: c.texte, background: c.fond }}>
                    {c.emoji} {Math.round(total * 10) / 10}h
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}