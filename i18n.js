/**
 * Shared interface translations. English is the source and fallback locale.
 * Machine-specific program names live in machine-config.js so each machine
 * profile remains self-contained. Translation context notes are stored in
 * private/i18n-reference.csv and are not part of the public repository.
 */
window.I18N = (function () {
  const STORAGE_KEY = 'dto-lang';
  const SOURCE_LOCALE = 'en';

  // Keep this list sorted alphabetically by label for the language popover.
  const LANGUAGES = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'nl', label: 'Nederlands' },
  ];

  const locales = {
    de: {
      'program.label': 'Programm',
      'program.ariaLabelWithNumber': 'Programm {number}',
      'theme.toggleAriaLabel': 'Hell/Dunkel umschalten',
      'theme.title': 'Theme',
      'lang.toggleAriaLabel': 'Sprache wechseln',
      'lang.title': 'Sprache',
      'overview.titleTemplate': 'Überblick ± {range}',
      'time.hourUnit': 'h',
      'time.minuteUnit': 'min',
      'wish.label': 'Wunschzeit',
      'actual.actualPrefix': 'Tatsächlich ',
      'actual.onTime': 'pünktlich',
      'actual.ariaLabelFallback': 'Tatsächliche Zielzeit',
      'nav.earlier': 'Früher',
      'nav.later': 'Später',
      'nav.overviewHint': 'Zum Wählen tippen',
      'day.tomorrowHint': 'morgen',
      'delay.pressCountAriaLabel': 'Tastendrücke',
      'hero.instruction': 'Maschine: Programm und Verzögerung einstellen',
    },
    en: {
      'program.label': 'Program',
      'program.ariaLabelWithNumber': 'Program {number}',
      'theme.toggleAriaLabel': 'Toggle light/dark mode',
      'theme.title': 'Theme',
      'lang.toggleAriaLabel': 'Change language',
      'lang.title': 'Language',
      'overview.titleTemplate': 'Overview ± {range}',
      'time.hourUnit': 'h',
      'time.minuteUnit': 'min',
      'wish.label': 'Target time',
      'actual.actualPrefix': 'Actual ',
      'actual.onTime': 'on time',
      'actual.ariaLabelFallback': 'Actual finish time',
      'nav.earlier': 'Earlier',
      'nav.later': 'Later',
      'nav.overviewHint': 'Tap to select',
      'day.tomorrowHint': 'tomorrow',
      'delay.pressCountAriaLabel': 'Button presses',
      'hero.instruction': 'Dishwasher: Set program and delay',
    },
    es: {
      'program.label': 'Programa',
      'program.ariaLabelWithNumber': 'Programa {number}',
      'theme.toggleAriaLabel': 'Cambiar modo claro/oscuro',
      'theme.title': 'Tema',
      'lang.toggleAriaLabel': 'Cambiar idioma',
      'lang.title': 'Idioma',
      'overview.titleTemplate': 'Resumen ± {range}',
      'time.hourUnit': 'h',
      'time.minuteUnit': 'min',
      'wish.label': 'Hora deseada',
      'actual.actualPrefix': 'Real ',
      'actual.onTime': 'a tiempo',
      'actual.ariaLabelFallback': 'Hora real de finalización',
      'nav.earlier': 'Antes',
      'nav.later': 'Después',
      'nav.overviewHint': 'Toca para elegir',
      'day.tomorrowHint': 'mañana',
      'delay.pressCountAriaLabel': 'Pulsaciones',
      'hero.instruction': 'Lavavajillas: Configurar programa y retraso',
    },
    fr: {
      'program.label': 'Programme',
      'program.ariaLabelWithNumber': 'Programme {number}',
      'theme.toggleAriaLabel': 'Changer le mode clair/sombre',
      'theme.title': 'Thème',
      'lang.toggleAriaLabel': 'Changer de langue',
      'lang.title': 'Langue',
      'overview.titleTemplate': 'Aperçu ± {range}',
      'time.hourUnit': 'h',
      'time.minuteUnit': 'min',
      'wish.label': 'Heure souhaitée',
      'actual.actualPrefix': 'Réel ',
      'actual.onTime': "à l'heure",
      'actual.ariaLabelFallback': 'Heure de fin réelle',
      'nav.earlier': 'Plus tôt',
      'nav.later': 'Plus tard',
      'nav.overviewHint': 'Toucher pour choisir',
      'day.tomorrowHint': 'demain',
      'delay.pressCountAriaLabel': 'Nombre de pressions',
      'hero.instruction': 'Lave-vaisselle : Programme et départ différé',
    },
    nl: {
      'program.label': 'Programma',
      'program.ariaLabelWithNumber': 'Programma {number}',
      'theme.toggleAriaLabel': 'Licht/donker wisselen',
      'theme.title': 'Thema',
      'lang.toggleAriaLabel': 'Taal wijzigen',
      'lang.title': 'Taal',
      'overview.titleTemplate': 'Overzicht ± {range}',
      'time.hourUnit': 'u',
      'time.minuteUnit': 'min',
      'wish.label': 'Gewenste tijd',
      'actual.actualPrefix': 'Werkelijk ',
      'actual.onTime': 'op tijd',
      'actual.ariaLabelFallback': 'Werkelijke eindtijd',
      'nav.earlier': 'Eerder',
      'nav.later': 'Later',
      'nav.overviewHint': 'Tik om te kiezen',
      'day.tomorrowHint': 'morgen',
      'delay.pressCountAriaLabel': 'Aantal drukken',
      'hero.instruction': 'Vaatwasser: Programma en vertraging instellen',
    },
  };

  let current = SOURCE_LOCALE;

  function supportedCodes() {
    return LANGUAGES.map((l) => l.code);
  }

  function detectLocale() {
    const candidates = (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || SOURCE_LOCALE]
    ).map((tag) => String(tag).slice(0, 2).toLowerCase());
    const supported = supportedCodes();
    const match = candidates.find((code) => supported.includes(code));
    return match || SOURCE_LOCALE;
  }

  function getLocale() {
    return current;
  }

  function setLocale(code, opts) {
    const persist = !opts || opts.persist !== false;
    current = supportedCodes().includes(code) ? code : SOURCE_LOCALE;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, current);
      } catch (e) {
        /* Storage may fail in private browsing; keep the locale for this session only. */
      }
    }
    document.documentElement.setAttribute('lang', current);
  }

  function t(key, vars) {
    const table = locales[current] || {};
    const fallback = locales[SOURCE_LOCALE] || {};
    let str = Object.prototype.hasOwnProperty.call(table, key)
      ? table[key]
      : fallback[key] !== undefined
        ? fallback[key]
        : key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
      });
    }
    return str;
  }

  function applyStaticTranslations(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  function init() {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    setLocale(saved && supportedCodes().includes(saved) ? saved : detectLocale(), {
      persist: false,
    });
    applyStaticTranslations();
  }

  return {
    LANGUAGES,
    init,
    t,
    getLocale,
    setLocale,
    applyStaticTranslations,
  };
})();
