# Schnicken

Eine interaktive Web-App für das "Schnicken"-Spiel, bei dem Spieler in einem spannenden Zweispieler-Zahlenspiel gegeneinander antreten.

## Spielregeln

### Spieler-Setup
- Zwei Spieler: ein "Schnicker" (Herausforderer) und ein "Angeschnickter" (Ziel)

### Ablauf
1. **Aufgabe**: Der Schnicker definiert eine Aufgabe, die der Verlierer erfüllen muss
2. **Bock-Phase**: Der Angeschnickte wählt einen "Bock-Wert" zwischen 1-17 (zeigt seine Motivation/Bereitschaft)
3. **Runde 1**: Beide Spieler wählen eine Zahl zwischen 1 und dem Bock-Wert
   - Wenn beide die gleiche Zahl wählen → der Angeschnickte verliert sofort
   - Wenn unterschiedlich → Runde 2 folgt
4. **Runde 2** (Reverse Schnick): Beide wählen eine Zahl zwischen 1 und min(niedrigste_Runde1_Zahl, 4)
   - Wenn beide die gleiche Zahl wählen → Schnicker verliert (Eigentor)
   - Wenn unterschiedlich → Unentschieden (niemand muss die Aufgabe machen)

## Features

- Spieler-Verwaltung: Spieler erstellen und auswählen
- Spiele erstellen: Gegner auswählen, Aufgabe definieren
- Live-Gameplay: Echtzeit-Updates via Supabase Realtime
- Spielhistorie: Aktive und abgeschlossene Spiele anzeigen
- Responsive Design: Funktioniert auf Desktop und Mobile

## Technischer Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Styling**: Tailwind CSS
- **Datenbank**: 3 Tabellen (spieler, schnicks, schnick_zahlen)

## Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

## Deployment

Die App ist auf Netlify unter [schnicken.netlify.app](https://schnicken.netlify.app/) verfügbar.

```bash
# Build für Production erstellen
npm run build
```

## Datenbankstruktur

- **spieler**: Spielerprofile mit Name und Avatar
- **schnicks**: Spieldaten mit Aufgabe, Bock-Wert und Status
- **schnick_zahlen**: Die von den Spielern gewählten Zahlen pro Runde
