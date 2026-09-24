/**
 * Machine profile: delay steps and dishwasher programs.
 * Durations are based on private/machine-reference/programmtabelle.pdf.
 * The Sensor program spans 1:25–3:00; planning uses the 3:00 maximum.
 */
window.MACHINE_CONFIG = {
  id: 'bauknecht-default',
  name: 'Bauknecht',
  /** Available delayed-start settings in minutes; array order equals button presses. */
  delayStepsMin: [
    30, 60, 90, 120, 150, 180, 210, 240,
    300, 360, 420, 480, 540, 600, 660, 720,
    960, 1200, 1440
  ],
  programs: [
    {
      id: 'p1',
      names: { de: 'Eco', en: 'Eco', es: 'Eco', fr: 'Eco', nl: 'Eco' },
      buttonLabel: '1',
      durationMin: 220,
      includedInAutomaticSelection: true,
    }, // 3:40 · 50°C
    {
      id: 'p2',
      names: { de: 'Sensor', en: 'Sensor', es: 'Sensor', fr: 'Sensor', nl: 'Sensor' },
      buttonLabel: '2',
      durationMin: 180,
      includedInAutomaticSelection: true,
    }, // 1:25–3:00 · planning duration: 3:00
    {
      id: 'p3',
      names: { de: 'Intensiv', en: 'Intensive', es: 'Intensivo', fr: 'Intensif', nl: 'Intensief' },
      buttonLabel: '3',
      durationMin: 170,
      includedInAutomaticSelection: true,
    }, // 2:50 · 65°C
    {
      id: 'p4',
      names: { de: 'Täglich', en: 'Daily', es: 'Diario', fr: 'Quotidien', nl: 'Dagelijks' },
      buttonLabel: '4',
      durationMin: 90,
      includedInAutomaticSelection: true,
    }, // 1:30 · 50°C
    {
      id: 'p5',
      names: { de: 'Nacht', en: 'Night', es: 'Nocturno', fr: 'Nuit', nl: 'Nacht' },
      buttonLabel: '5',
      durationMin: 210,
      includedInAutomaticSelection: true,
    }, // 3:30 · 50°C
    {
      id: 'p6',
      names: { de: 'Rapid', en: 'Rapid', es: 'Rápido', fr: 'Rapide', nl: 'Snel' },
      buttonLabel: '6',
      durationMin: 30,
      includedInAutomaticSelection: false,
    }, // 0:30 · 50°C
    {
      id: 'p7',
      names: { de: 'Glas', en: 'Glass', es: 'Cristal', fr: 'Verre', nl: 'Glas' },
      buttonLabel: '7',
      durationMin: 100,
      includedInAutomaticSelection: false,
    }, // 1:40 · 45°C
  ]
};
