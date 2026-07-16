# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- 2026-07-16 13:15 — Mehrfach erreichbare Endzeiten mit stabil angeordneten Programm-Dots, Programmindikatoren und lokal gelernter Programmauswahl ergänzt.
- 2026-07-16 13:07 — Projektregel ergänzt, die bei signifikanten Änderungen automatisch kurze Changelog-Einträge mit Datum und Uhrzeit verlangt.
- Maschinenprofil `machine-config.js` (Programme, Dauern, Delay-Stufen; Quelle `programmtabelle.pdf`)
- Überblick-Timeline (±1 h um Wunschzeit) mit farbigen Programm-Dots (`dotColor`)
- Timeline-Scrub: Ist-Zeit per Slide wählen, Thumb gleitet mit
- Split-Pill früher/später mit Odometer für die tatsächliche Zeit
- Hero unten: Pgm-Nummer + Verzögerungstaste (`n ×` + Delay-Icon)
- Odometer-Animation auch für Pgm und Tastendrücke
- Programm-Lock per Long-press (L2+L3 Footer)
- Theme-Toggle (Hell/Dunkel) mit `localStorage`
- Wunschzeit-Persistenz (`dto-wish-minutes`)
- Kurz-Eingabe Wunschzeit (3-/4-Ziffern, z. B. `630` → 06:30)
- Design-Doku: `docs/design-decisions.md`, Layout-/Überblick-Previews
- Delay-Icon als Inline-SVG (`assets/time-delay-icon.svg`)

### Changed

- 2026-07-16 13:15 — Timeline-Dots, Bézierverbindung, Scrub-Fläche und visuelle Ebenen für eine ruhigere und leichter bedienbare Übersicht überarbeitet.
- 2026-07-16 13:13 — Zeitabweichung über dem Split-Button auf die kompakte Schreibweise der Scrub-Bubble (`−20′`, `±0′`, `+10′`) umgestellt.
- UI neu aufgebaut: Programme → Überblick → Wunsch/Ist → Hero
- Früher/später navigiert erreichbare Endzeiten über `eligibleForAuto`-Programme (mit Lock nur festes Programm)
- Soft-Clamp: Wunschzeit frei, Ist = frühest Mögliches
- „morgen“-Hinweis bei Fertig am Folgetag
- iOS-Homescreen-Meta/Manifest angepasst; kein Scroll/Zoom im App-Rahmen

### Removed

- Best Select, Presets, Custom-Zahlen-Tastatur
- Emoji-/Font-Awesome-Icons (ersetzt durch Inline-SVG)

### Fixed

- 2026-07-16 13:15 — Scrub-Bubble bleibt beim Überqueren der Null-Linie sichtbar; erster Theme-Klick nach dem Scrubben wird wieder verarbeitet.
- Erster Tap auf Split-Pill nach Timeline-Scrub (kein `setPointerCapture` / Hits über Face)
- Hero-Flash-Clipping auf iOS (entfernt; kein Scale/Ring mehr beim Update)
