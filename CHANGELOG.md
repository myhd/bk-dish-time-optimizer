# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

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

- UI neu aufgebaut: Programme → Überblick → Wunsch/Ist → Hero
- Früher/später navigiert erreichbare Endzeiten über `eligibleForAuto`-Programme (mit Lock nur festes Programm)
- Soft-Clamp: Wunschzeit frei, Ist = frühest Mögliches
- „morgen“-Hinweis bei Fertig am Folgetag
- iOS-Homescreen-Meta/Manifest angepasst; kein Scroll/Zoom im App-Rahmen

### Removed

- Best Select, Presets, Custom-Zahlen-Tastatur
- Emoji-/Font-Awesome-Icons (ersetzt durch Inline-SVG)

### Fixed

- Erster Tap auf Split-Pill nach Timeline-Scrub (kein `setPointerCapture` / Hits über Face)
- Hero-Flash-Clipping auf iOS (entfernt; kein Scale/Ring mehr beim Update)
