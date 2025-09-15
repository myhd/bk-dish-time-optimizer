# Design Decisions — Dish Time Optimizer

Stand: 2026-07-15. Quelle: Redesign-Gespräch + `docs/layout-preview.html`.

## Zweck

Die Maschine stellt nur eine **Startverzögerung** in diskreten Stufen. Die App rechnet auf eine **Fertigzeit** um und sagt, wie oft die Verzögerungstaste zu drücken ist.

## Behalten

- Programme oben (sichtbar beim Tippen, Wechsel erkennbar)
- Wunschzeit + **tatsächliche** Zielzeit (beide sichtbar, gelabelt)
- Hero: `n ×` + Delay-Icon + Label „Verzögerungstaste“
- iOS Homescreen (Meta + Manifest; volle PWA später ok)

## Entfernt

- Best Select (for now)
- Presets
- Custom-Zahlen-Tastatur
- Emoji-Icons / Font Awesome

## UX-Modell

| Thema | Entscheidung |
|--------|----------------|
| Wunschzeit vs. Ist | Beide anzeigen. Beim Springen ändert sich **nur die Ist-Zeit**. |
| Früher / später | Springt zur nächsten **erreichbaren** Endzeit (diskrete Stufen × Programme). |
| Programm unlocked | Sprünge über `eligibleForAuto`-Programme; Programm wechselt mit. |
| Programm locked | Nur Endzeiten dieses Programms; Long-press zum Togglen. |
| Lock-UI | L2+L3: Footer mit Nummer links, Mini-Badge-Lock rechts. |
| Ist-Steuerung | Split-Pill: linke Hälfte früher, rechte später; enge Chevrons; Hit-Feedback **hinter** Face; **Odometer** für die Uhrzeit. |
| Unmöglich / zu früh | Soft: Wunschzeit frei; Ist = frühest Mögliches; „früher“ am Minimum disabled. |
| Über Nacht | Label **„morgen“** wenn Fertig am Folgetag. |
| Kurz-Eingabe | Gültige frühe AM-Zeit mit 3 Ziffern (z. B. `630` → 06:30) → auto close; sonst nach 4 Ziffern. |
| Uhr-Drift (v1) | Recalc jede Minute + bei `visibilitychange`; Hero kurz flashen wenn sich `n×` ändert. |
| Theme | Light ≈ weiß / Dark ≈ fast schwarz; Toggle (Debug); Persistenz `localStorage`. Produktiv-Verhalten später. |

## Typo & Layout

- IBM Plex Sans, linksausgerichtet
- Zwei Schriftgrößen: 16 (body/strong) + 40 (Display)
- Zwei Gewichte: 400 / 600 — kein Kursiv als Standard
- Icons: Tabler-ähnlich, **inline SVG** (kein CDN-Webfont)
- Delay-Icon: `docs/assets/time-delay-icon.svg` (auch unter `assets/`)

## Config

Maschinenprofil (eine Datei, erweiterbar):

- `programs[]`: `id`, `label`, `buttonLabel`, `durationMin`, `eligibleForAuto`
- `delayStepsMin[]`: Verzögerungsstufen in Minuten
- Taste `n` = Index der gewählten Stufe + 1 (wie bisher)

## Layout-Hierarchie (gewählt)

1. Programme (wrap, 2 Zeilen ok)
2. **Überblick** — Linie ±1 h um Wunschzeit; Caps `−1 h` / `+1 h` auf Linienhöhe (keine End-Ticks); mögliche Ist-Zeiten als Punkte; gewählt hervorgehoben (Variante E)
3. Wunschzeit | Tatsächlich (Display-Größe, aligned)
4. Split-Pill an der Ist-Spalte
5. Hero Verzögerungstaste unten

Preview-Referenz: `docs/layout-preview.html` (G + Lock L2+L3), `docs/overview-preview.html` (Überblick E).
