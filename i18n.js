/**
 * Mehrsprachigkeit: Deutsch ist Quellsprache, alle Locales fallen bei
 * fehlenden Keys automatisch auf Deutsch zurück, damit neue Texte nie
 * einfach verschwinden. Kontext-Notizen zu den Keys stehen in
 * private/i18n-reference.csv (Arbeitsdokument, nicht Teil des Repos).
 */
window.I18N = (function () {
  const STORAGE_KEY = 'dto-lang';
  const DEFAULT_LOCALE = 'de';
  const FALLBACK_LOCALE = 'en';

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
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
      'actual.actualPrefix': 'Tatsächlich: ',
      'actual.onTime': 'pünktlich',
      'actual.ariaLabelFallback': 'Tatsächliche Zielzeit',
      'nav.earlier': 'Früher',
      'nav.later': 'Später',
      'nav.overviewHint': 'Zum Wählen tippen',
      'day.tomorrowHint': 'morgen',
      'delay.label': 'Verzögerungstaste',
      'delay.pressCountAriaLabel': 'Tastendrücke',
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
      'actual.actualPrefix': 'Actual: ',
      'actual.onTime': 'on time',
      'actual.ariaLabelFallback': 'Actual finish time',
      'nav.earlier': 'Earlier',
      'nav.later': 'Later',
      'nav.overviewHint': 'Tap to select',
      'day.tomorrowHint': 'tomorrow',
      'delay.label': 'Delay button',
      'delay.pressCountAriaLabel': 'Button presses',
    },
  };

  let current = DEFAULT_LOCALE;

  function supportedCodes() {
    return LANGUAGES.map((l) => l.code);
  }

  function detectLocale() {
    const candidates = (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || FALLBACK_LOCALE]
    ).map((tag) => String(tag).slice(0, 2).toLowerCase());
    const supported = supportedCodes();
    const match = candidates.find((code) => supported.includes(code));
    return match || FALLBACK_LOCALE;
  }

  function getLocale() {
    return current;
  }

  function setLocale(code, opts) {
    const persist = !opts || opts.persist !== false;
    current = supportedCodes().includes(code) ? code : FALLBACK_LOCALE;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, current);
      } catch (e) {
        /* localStorage kann in Private-Mode fehlschlagen — Sprache bleibt nur für die Sitzung gesetzt */
      }
    }
    document.documentElement.setAttribute('lang', current);
  }

  function t(key, vars) {
    const table = locales[current] || {};
    const fallback = locales[DEFAULT_LOCALE] || {};
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
