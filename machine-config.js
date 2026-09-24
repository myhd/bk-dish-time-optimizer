/**
 * Maschinenprofil — Verzögerungsstufen & Programme.
 * Programmdauern aus private/machine-reference/programmtabelle.pdf (Std:Min → Minuten).
 * Sensor: Spanne 1:25–3:00 → Planung mit 3:00.
 */
window.MACHINE_CONFIG = {
  id: 'bauknecht-default',
  name: 'Bauknecht',
  /** Sichtbarer Zeitraum vor und nach der Wunschzeit, in Minuten */
  overviewWindowMin: 60,
  /** Freiraum zwischen ausgewähltem Punkt und Scrub-Anzeige, in Pixeln */
  scrubOverlayGapPx: 16,
  /** Startverzögerung in Minuten (Reihenfolge = Tastendrücke 1…n) */
  delayStepsMin: [
    30, 60, 90, 120, 150, 180, 210, 240,
    300, 360, 420, 480, 540, 600, 660, 720,
    960, 1200, 1440
  ],
  programs: [
    // dotColor: sanfte Überblick-Markierung (nur wenn gesetzt)
    { id: 'p1', label: 'Eco', buttonLabel: '1', durationMin: 220, eligibleForAuto: true, dotColor: '#3d9a4a' },       // 3:40 · 50° · Überblick
    { id: 'p2', label: 'Sensor', buttonLabel: '2', durationMin: 180, eligibleForAuto: true, dotColor: '#2f83c5' },     // 1:25–3:00 · Planung: 3:00
    { id: 'p3', label: 'Intensiv', buttonLabel: '3', durationMin: 170, eligibleForAuto: true, dotColor: '#e85d4a' },   // 2:50 · 65° · Überblick
    { id: 'p4', label: 'Täglich', buttonLabel: '4', durationMin: 90, eligibleForAuto: true, dotColor: '#8b5cb8' },    // 1:30 · 50° · Überblick
    { id: 'p5', label: 'Nacht', buttonLabel: '5', durationMin: 210, eligibleForAuto: true }, // 3:30 · 50°
    { id: 'p6', label: 'Rapid', buttonLabel: '6', durationMin: 30, eligibleForAuto: false },  // 0:30 · 50°
    { id: 'p7', label: 'Glas', buttonLabel: '7', durationMin: 100, eligibleForAuto: false },      // 1:40 · 45°
  ]
};
