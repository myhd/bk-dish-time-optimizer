(() => {
  const MINUTES_PER_DAY = 24 * 60;
  const THEME_KEY = 'dto-theme';
  const WISH_KEY = 'dto-wish-minutes';
  const PROGRAM_PREFERENCE_KEY = 'dto-program-preferences-v1';
  const config = window.MACHINE_CONFIG;
  if (!config) throw new Error('MACHINE_CONFIG missing');

  const programsById = Object.fromEntries(config.programs.map((p) => [p.id, p]));
  const programOrderById = new Map(config.programs.map((p, index) => [p.id, index]));
  let programPreferences = {};

  const state = {
    selectedProgramId: config.programs.find((p) => p.eligibleForAuto)?.id || config.programs[0].id,
    locked: false,
    wishMinutes: null,
    solution: null
  };

  const els = {
    root: document.documentElement,
    programButtons: document.getElementById('programButtons'),
    wishInput: document.getElementById('wishInput'),
    wishDayHint: document.getElementById('wishDayHint'),
    actualOdo: document.getElementById('actualOdo'),
    earlierBtn: document.getElementById('earlierBtn'),
    laterBtn: document.getElementById('laterBtn'),
    pressCount: document.getElementById('pressCount'),
    heroBadge: document.getElementById('heroBadge'),
    heroPgm: document.getElementById('heroPgm'),
    heroPgmNum: document.getElementById('heroPgmNum'),
    overviewTitle: document.getElementById('overviewTitle'),
    overviewTl: document.getElementById('overviewTl'),
    overviewTrack: document.getElementById('overviewTrack'),
    timeConnection: document.getElementById('timeConnection'),
    timeConnectionLine: document.getElementById('timeConnectionLine'),
    timeConnectionHitArea: document.getElementById('timeConnectionHitArea'),
    timeConnectionPath: document.getElementById('timeConnectionPath'),
    actualLabel: document.getElementById('actualLabel'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    themeColorMeta: document.getElementById('themeColorMeta'),
    statusBarMeta: document.getElementById('statusBarMeta')
  };

  const OVERVIEW_WINDOW_MIN =
    Number.isFinite(config.overviewWindowMin) && config.overviewWindowMin > 0
      ? config.overviewWindowMin
      : 60;
  const SCRUB_OVERLAY_GAP_PX =
    Number.isFinite(config.scrubOverlayGapPx) && config.scrubOverlayGapPx >= 0
      ? config.scrubOverlayGapPx
      : 16;

  const ICON_SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 3v1M12 20v1M4.2 4.2l.7.7M19.1 19.1l.7.7M3 12h1M20 12h1M4.2 19.8l.7-.7M19.1 4.9l.7-.7"/>';
  const ICON_MOON = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>';
  const LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  function nowMinutes() {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }

  function formatClock(mins) {
    const m = ((mins % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  function parseWishDigits(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 3) {
      const h = parseInt(digits[0], 10);
      const min = parseInt(digits.slice(1), 10);
      if (h <= 9 && min <= 59) return h * 60 + min;
      return null;
    }
    if (digits.length >= 4) {
      const h = parseInt(digits.slice(0, 2), 10);
      const min = parseInt(digits.slice(2, 4), 10);
      if (h <= 23 && min <= 59) return h * 60 + min;
      return null;
    }
    return null;
  }

  function wishAbsolute(wishMin, nowMin) {
    return wishMin <= nowMin ? wishMin + MINUTES_PER_DAY : wishMin;
  }

  function signedDiffMinutes(actualAbs, wishAbs) {
    let d = actualAbs - wishAbs;
    if (d > MINUTES_PER_DAY / 2) d -= MINUTES_PER_DAY;
    if (d <= -MINUTES_PER_DAY / 2) d += MINUTES_PER_DAY;
    return d;
  }

  function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h} h ${m} min`;
    if (h) return `${h} h`;
    return `${m} min`;
  }

  function formatPossibleDiff(diffMin) {
    return `Möglich: ${formatScrubDiff(diffMin)}`;
  }

  function formatScrubDiff(diffMin) {
    if (diffMin === 0) return '±0′';
    return `${diffMin > 0 ? '+' : '−'}${Math.abs(diffMin)}′`;
  }

  function syncOverviewLabels() {
    const range = formatMinutes(OVERVIEW_WINDOW_MIN);
    const title = `Überblick ± ${range}`;
    els.overviewTitle.textContent = title;
    els.overviewTrack.style.setProperty(
      '--scrub-overlay-gap',
      `${SCRUB_OVERLAY_GAP_PX}px`
    );
    const section = els.overviewTitle.closest('.overview');
    if (section) section.setAttribute('aria-label', title);
  }

  function allSolutions(programIds, nowMin) {
    const out = [];
    for (const id of programIds) {
      const prog = programsById[id];
      if (!prog) continue;
      config.delayStepsMin.forEach((delayMin, idx) => {
        const actualAbs = nowMin + delayMin + prog.durationMin;
        out.push({
          programId: id,
          delayMin,
          presses: idx + 1,
          actualAbs,
          actualClock: formatClock(actualAbs)
        });
      });
    }
    return out;
  }

  function programsForNav() {
    if (state.locked) return [state.selectedProgramId];
    return config.programs.filter((p) => p.eligibleForAuto).map((p) => p.id);
  }

  function bestForProgram(programId, nowMin, wishAbs) {
    const sols = allSolutions([programId], nowMin);
    let best = null;
    let bestScore = Infinity;
    for (const s of sols) {
      const diff = s.actualAbs - wishAbs;
      const score = Math.abs(diff);
      if (
        score < bestScore ||
        (score === bestScore && best && diff <= 0 && best.actualAbs - wishAbs > 0)
      ) {
        bestScore = score;
        best = s;
      }
    }
    return best;
  }

  function programGroupKey(solutions) {
    return [...new Set(solutions.map((solution) => solution.programId))]
      .sort(
        (a, b) =>
          (programOrderById.get(a) ?? Number.MAX_SAFE_INTEGER) -
          (programOrderById.get(b) ?? Number.MAX_SAFE_INTEGER)
      )
      .join(',');
  }

  function loadProgramPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRAM_PREFERENCE_KEY) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (_) {
      return {};
    }
  }

  function rememberProgramPreference(solutions, programId) {
    const key = programGroupKey(solutions);
    if (!key.includes(',') || !solutions.some((solution) => solution.programId === programId)) return;
    programPreferences[key] = programId;
    try {
      localStorage.setItem(PROGRAM_PREFERENCE_KEY, JSON.stringify(programPreferences));
    } catch (_) { /* private mode / quota */ }
  }

  /** Eine Lösung pro Endzeit; bevorzugt Auswahl, dann lokale Gruppen-History, dann Maschinenreihenfolge */
  function uniqueSortedSolutions(sols) {
    const groupsByAbs = new Map();
    for (const s of sols) {
      if (!groupsByAbs.has(s.actualAbs)) groupsByAbs.set(s.actualAbs, []);
      groupsByAbs.get(s.actualAbs).push(s);
    }

    return [...groupsByAbs.values()]
      .map((group) => {
        const selected = group.find(
          (solution) => solution.programId === state.selectedProgramId
        );
        if (selected) return selected;

        const rememberedProgramId = programPreferences[programGroupKey(group)];
        const remembered = group.find(
          (solution) => solution.programId === rememberedProgramId
        );
        if (remembered) return remembered;

        return group.reduce((preferred, solution) => {
          const preferredOrder =
            programOrderById.get(preferred.programId) ?? Number.MAX_SAFE_INTEGER;
          const solutionOrder =
            programOrderById.get(solution.programId) ?? Number.MAX_SAFE_INTEGER;
          return solutionOrder < preferredOrder ? solution : preferred;
        });
      })
      .sort((a, b) => a.actualAbs - b.actualAbs);
  }

  const ODO_CENTER_CYCLE = 2;
  const ODO_CYCLE_COUNT = 5;
  const ODO_NORMAL_DURATION_MS = 420;
  const ODO_SCRUB_DURATION_MS = 180;

  function odoCenterIndex(char) {
    return ODO_CENTER_CYCLE * 10 + parseInt(char, 10);
  }

  function ensureOdoDrum(digit, initialChar) {
    let drum = digit.querySelector('.odo-drum');
    if (drum) return drum;

    drum = document.createElement('div');
    drum.className = 'odo-drum';
    const fragment = document.createDocumentFragment();
    for (let cycle = 0; cycle < ODO_CYCLE_COUNT; cycle++) {
      for (let value = 0; value < 10; value++) {
        const span = document.createElement('span');
        span.textContent = String(value);
        fragment.appendChild(span);
      }
    }
    drum.appendChild(fragment);
    digit.replaceChildren(drum);
    drum.style.transition = 'none';
    drum.style.transform = `translateY(-${odoCenterIndex(initialChar)}em)`;
    void drum.offsetWidth;
    drum.style.transition = '';
    return drum;
  }

  function setDigitInstant(digit, char) {
    digit._odoToken = (digit._odoToken || 0) + 1;
    const existingDrum = digit.querySelector('.odo-drum');
    if (existingDrum && digit._odoFinish) {
      existingDrum.removeEventListener('transitionend', digit._odoFinish);
    }
    digit._odoFinish = null;
    if (!/^\d$/.test(char)) {
      digit.innerHTML = `<span class="odo-static">${char}</span>`;
      digit.dataset.odoChar = char;
      return;
    }

    const drum = ensureOdoDrum(digit, char);
    drum.style.transition = 'none';
    drum.style.transform = `translateY(-${odoCenterIndex(char)}em)`;
    void drum.offsetWidth;
    drum.style.transition = '';
    digit.dataset.odoChar = char;
  }

  function drumTranslateY(drum) {
    const transform = getComputedStyle(drum).transform;
    if (!transform || transform === 'none') return 0;
    try {
      return new DOMMatrixReadOnly(transform).m42;
    } catch (_) {
      const values = transform.match(/matrix(?:3d)?\((.+)\)/);
      if (!values) return 0;
      const parts = values[1].split(',').map(Number);
      return parts.length === 6 ? parts[5] : parts[13] || 0;
    }
  }

  function rollDigit(digit, fromChar, toChar, dir) {
    if (fromChar === toChar) return;
    if (!dir || !/^\d$/.test(fromChar) || !/^\d$/.test(toChar)) {
      setDigitInstant(digit, toChar);
      return;
    }

    const drum = ensureOdoDrum(digit, fromChar);
    if (digit._odoFinish) {
      drum.removeEventListener('transitionend', digit._odoFinish);
      digit._odoFinish = null;
    }
    const digitHeight = digit.getBoundingClientRect().height;
    if (digitHeight <= 0) {
      setDigitInstant(digit, toChar);
      return;
    }

    const rawIndex = -drumTranslateY(drum) / digitHeight;
    const normalizedIndex =
      ODO_CENTER_CYCLE * 10 + ((rawIndex % 10) + 10) % 10;
    let targetIndex = odoCenterIndex(toChar);
    if (dir > 0) {
      while (targetIndex <= normalizedIndex + 0.001) targetIndex += 10;
    } else {
      while (targetIndex >= normalizedIndex - 0.001) targetIndex -= 10;
    }

    const token = (digit._odoToken || 0) + 1;
    digit._odoToken = token;
    digit.dataset.odoChar = toChar;
    drum.style.transition = 'none';
    drum.style.transform = `translateY(${-normalizedIndex * digitHeight}px)`;
    void drum.offsetWidth;
    const duration = overviewScrubbing
      ? ODO_SCRUB_DURATION_MS
      : ODO_NORMAL_DURATION_MS;
    drum.style.setProperty('--odo-duration', `${duration}ms`);
    drum.style.transition = '';
    drum.style.transform = `translateY(${-targetIndex * digitHeight}px)`;

    const finish = (event) => {
      if (
        event.target !== drum ||
        event.propertyName !== 'transform' ||
        digit._odoToken !== token
      ) {
        return;
      }
      drum.removeEventListener('transitionend', finish);
      digit._odoFinish = null;
      drum.style.transition = 'none';
      drum.style.transform = `translateY(-${odoCenterIndex(toChar)}em)`;
      void drum.offsetWidth;
      drum.style.transition = '';
    };
    digit._odoFinish = finish;
    drum.addEventListener('transitionend', finish);
  }

  function syncOdoDigits(odo, chars) {
    let digits = [...odo.querySelectorAll('.odo-digit')];
    if (digits.length !== chars.length) {
      odo.innerHTML = chars
        .map((_, i) => `<span class="odo-digit" data-i="${i}"><span class="odo-static"></span></span>`)
        .join('');
      digits = [...odo.querySelectorAll('.odo-digit')];
    }
    return digits;
  }

  function setOdoInstant(odo, timeStr) {
    odo.setAttribute('data-time', timeStr);
    odo.setAttribute('aria-label', timeStr);
    const digits = timeStr.replace(':', '').split('');
    odo.querySelectorAll('.odo-digit').forEach((digit) => {
      const i = parseInt(digit.getAttribute('data-i'), 10);
      setDigitInstant(digit, digits[i]);
    });
  }

  function odoTo(odo, nextTime, dir) {
    const prev = odo.getAttribute('data-time') || '00:00';
    if (prev === nextTime) return;
    const from = prev.replace(':', '').split('');
    const to = nextTime.replace(':', '').split('');
    odo.setAttribute('data-time', nextTime);
    odo.setAttribute('aria-label', nextTime);
    odo.querySelectorAll('.odo-digit').forEach((digit) => {
      const i = parseInt(digit.getAttribute('data-i'), 10);
      rollDigit(digit, from[i], to[i], dir);
    });
  }

  function setOdoValue(odo, valueStr) {
    const next = valueStr == null || valueStr === '' ? '–' : String(valueStr);
    odo.setAttribute('data-value', next);
    odo.setAttribute('aria-label', next);
    const chars = next.split('');
    const digits = syncOdoDigits(odo, chars);
    digits.forEach((digit, i) => {
      setDigitInstant(digit, chars[i]);
    });
  }

  function odoValueTo(odo, valueStr, dir) {
    const next = valueStr == null || valueStr === '' ? '–' : String(valueStr);
    const prev = odo.getAttribute('data-value') || '–';
    if (prev === next) return;

    const width = Math.max(prev.length, next.length);
    const from = prev.padStart(width, ' ').split('');
    const toPad = next.padStart(width, ' ').split('');
    const display = next.split('');
    const offset = width - display.length;

    odo.setAttribute('data-value', next);
    odo.setAttribute('aria-label', next);

    const digits = syncOdoDigits(odo, display);
    digits.forEach((digit, i) => {
      const a = from[i + offset];
      const b = toPad[i + offset];
      if (!dir || a === ' ' || a === b || !/^\d$/.test(a) || !/^\d$/.test(b)) {
        if (a !== b || digit.dataset.odoChar !== b) setDigitInstant(digit, b);
      } else {
        rollDigit(digit, a, b, dir);
      }
    });
  }

  function valueAnimDir(prevStr, nextStr, fallback) {
    const a = parseInt(prevStr, 10);
    const b = parseInt(nextStr, 10);
    if (Number.isFinite(a) && Number.isFinite(b) && a !== b) return b > a ? 1 : -1;
    return fallback || 0;
  }

  function applyTheme(theme) {
    els.root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const dark = theme === 'dark';
    els.themeIcon.innerHTML = dark ? ICON_SUN : ICON_MOON;
    els.themeColorMeta.setAttribute('content', dark ? '#0a0a0a' : '#ffffff');
    els.statusBarMeta.setAttribute('content', dark ? 'black' : 'default');
  }

  function toggleLockOn(programId) {
    if (state.locked && state.selectedProgramId === programId) {
      state.locked = false;
    } else {
      state.selectedProgramId = programId;
      state.locked = true;
    }
  }

  function solutionsAtCurrentEndTime() {
    if (!state.solution) return [];
    const selectedProgram = programsById[state.solution.programId];
    if (!selectedProgram) return [];

    const endOffset = state.solution.delayMin + selectedProgram.durationMin;
    return programsForNav().flatMap((programId) => {
      const program = programsById[programId];
      if (!program) return [];
      const delayMin = endOffset - program.durationMin;
      const delayIndex = config.delayStepsMin.indexOf(delayMin);
      if (delayIndex < 0) return [];
      return [{
        programId,
        delayMin,
        presses: delayIndex + 1,
        actualAbs: state.solution.actualAbs,
        actualClock: state.solution.actualClock,
      }];
    });
  }

  function sharedEndTimeProgramIds() {
    const solutions = solutionsAtCurrentEndTime();
    return solutions.length > 1
      ? new Set(solutions.map((solution) => solution.programId))
      : new Set();
  }

  function chooseProgram(programId, { lock = false } = {}) {
    const currentGroup = solutionsAtCurrentEndTime();
    const sameTimeSolution =
      currentGroup.find((solution) => solution.programId === programId) || null;

    rememberProgramPreference(currentGroup, programId);
    if (lock) toggleLockOn(programId);
    else state.selectedProgramId = programId;

    if (sameTimeSolution) {
      applySolution(sameTimeSolution, { animateDir: 0 });
    } else {
      renderPrograms();
      recompute({ preserveDelay: false });
    }
  }

  function renderPrograms() {
    els.programButtons.innerHTML = '';
    for (const p of config.programs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prog';
      btn.dataset.id = p.id;
      if (!p.eligibleForAuto) btn.classList.add('is-dim');
      if (p.id === state.selectedProgramId) btn.setAttribute('aria-selected', 'true');
      if (state.locked && p.id === state.selectedProgramId) btn.classList.add('is-locked');
      btn.innerHTML = `
        <div class="prog-title-row">
          <span class="prog-name t-strong" style="--program-color: ${p.dotColor || 'var(--muted)'}">${p.label}</span>
          <span class="prog-time-indicator" aria-hidden="true"></span>
        </div>
        <div class="prog-footer">
          <span class="label">${p.buttonLabel}</span>
          <span class="prog-lock-badge">${LOCK_SVG}</span>
        </div>
      `;

      let pressTimer = null;
      let longPressed = false;

      const clearPress = () => {
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = null;
      };

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        longPressed = false;
        pressTimer = setTimeout(() => {
          longPressed = true;
          chooseProgram(p.id, { lock: true });
        }, 450);
      });

      btn.addEventListener('pointerup', () => {
        clearPress();
        if (longPressed) return;
        chooseProgram(p.id);
      });
      btn.addEventListener('pointerleave', clearPress);
      btn.addEventListener('pointercancel', clearPress);

      els.programButtons.appendChild(btn);
    }
    syncProgramSelection();
  }

  function updateHero(presses, { animateDir = 0 } = {}) {
    const pressStr = presses == null ? '–' : String(presses);
    const prog = programsById[state.selectedProgramId];
    const pgmStr = prog ? prog.buttonLabel : '–';

    const prevPress = els.pressCount.getAttribute('data-value') || '–';
    const prevPgm = els.heroPgmNum.getAttribute('data-value') || '–';
    const pressDir = valueAnimDir(prevPress, pressStr, animateDir);
    const pgmDir = valueAnimDir(prevPgm, pgmStr, animateDir);

    if (pressDir) odoValueTo(els.pressCount, pressStr, pressDir);
    else setOdoValue(els.pressCount, pressStr);

    if (pgmDir) odoValueTo(els.heroPgmNum, pgmStr, pgmDir);
    else setOdoValue(els.heroPgmNum, pgmStr);

    if (els.heroPgm) {
      els.heroPgm.setAttribute('aria-label', prog ? `Programm ${pgmStr}` : 'Programm');
    }
  }

  function navIndexFor(sol, nav) {
    let idx = nav.findIndex((s) => s.actualAbs === sol.actualAbs && s.programId === sol.programId);
    if (idx < 0) idx = nav.findIndex((s) => s.actualAbs === sol.actualAbs);
    return idx;
  }

  const MINUTE_TIMELINE_MOTION_MS = 450;
  let minuteTimelineMotionTimer = 0;
  let overviewScrubbing = false;
  let overviewScrubNowMin = null;
  let pendingMinuteUpdate = false;

  function startMinuteTimelineMotion() {
    window.clearTimeout(minuteTimelineMotionTimer);
    els.timeConnection.classList.add('is-minute-updating');
    minuteTimelineMotionTimer = window.setTimeout(() => {
      els.timeConnection.classList.remove('is-minute-updating');
      minuteTimelineMotionTimer = 0;
    }, MINUTE_TIMELINE_MOTION_MS + 50);
  }

  function stopMinuteTimelineMotion() {
    window.clearTimeout(minuteTimelineMotionTimer);
    minuteTimelineMotionTimer = 0;
    els.timeConnection.classList.remove('is-minute-updating');
  }

  function overviewMarks(wishAbs, nowMin) {
    const nav = uniqueSortedSolutions(allSolutions(programsForNav(), nowMin));
    return nav.filter((s) => {
      const d = s.actualAbs - wishAbs;
      return d >= -OVERVIEW_WINDOW_MIN && d <= OVERVIEW_WINDOW_MIN;
    });
  }

  function overviewVisibleMarks(wishAbs, nowMin) {
    const solutions = allSolutions(programsForNav(), nowMin);

    return solutions
      .filter((s) => {
        const d = s.actualAbs - wishAbs;
        return d >= -OVERVIEW_WINDOW_MIN && d <= OVERVIEW_WINDOW_MIN;
      })
      .sort((a, b) => {
        if (a.actualAbs !== b.actualAbs) return a.actualAbs - b.actualAbs;
        return (
          (programOrderById.get(a.programId) ?? Number.MAX_SAFE_INTEGER) -
          (programOrderById.get(b.programId) ?? Number.MAX_SAFE_INTEGER)
        );
      });
  }

  function overviewLeftPct(actualAbs, wishAbs) {
    const offset = actualAbs - wishAbs;
    return ((offset + OVERVIEW_WINDOW_MIN) / (OVERVIEW_WINDOW_MIN * 2)) * 100;
  }

  function moveOverviewThumb(leftPct, { instant = false } = {}) {
    const track = els.overviewTrack;
    const thumb = track && track.querySelector('.overview-thumb');
    if (!thumb || !track) return;
    const leftPx = (leftPct / 100) * track.getBoundingClientRect().width;
    if (instant) {
      thumb.style.transition = 'none';
      thumb.style.setProperty('--thumb-left', `${leftPx}px`);
      void thumb.offsetWidth;
      thumb.style.transition = '';
      return;
    }
    thumb.style.setProperty('--thumb-left', `${leftPx}px`);
  }

  let timeConnectionFrame = 0;
  let timeConnectionUntil = 0;

  function updateTimeConnection() {
    const thumb =
      els.overviewTrack && els.overviewTrack.querySelector('.overview-thumb');
    const line = els.timeConnectionLine;
    const path = els.timeConnectionPath;
    if (
      !thumb ||
      thumb.hidden ||
      !line ||
      !path ||
      !els.timeConnection ||
      !els.actualLabel
    ) {
      if (line) line.hidden = true;
      return;
    }

    const containerRect = els.timeConnection.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const labelRect = els.actualLabel.getBoundingClientRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) {
      line.hidden = true;
      return;
    }

    const startX = thumbRect.left + thumbRect.width / 2 - containerRect.left;
    const startY = thumbRect.bottom + 4 - containerRect.top;
    const endX = labelRect.left + labelRect.width / 2 - containerRect.left;
    const endY = labelRect.top - 5 - containerRect.top;
    const verticalDistance = endY - startY;
    if (verticalDistance <= 0) {
      line.hidden = true;
      return;
    }

    const horizontalDistance = Math.abs(endX - startX);
    const distanceProgress = Math.min(1, horizontalDistance / 330);
    const handleProgress = 1 - (1 - distanceProgress) ** 2.5;
    const handle = verticalDistance * 1.4 * handleProgress;
    const d = [
      `M ${startX.toFixed(1)} ${startY.toFixed(1)}`,
      `C ${startX.toFixed(1)} ${(startY + handle).toFixed(1)}`,
      `${endX.toFixed(1)} ${(endY - handle).toFixed(1)}`,
      `${endX.toFixed(1)} ${endY.toFixed(1)}`,
    ].join(' ');

    line.setAttribute(
      'viewBox',
      `0 0 ${containerRect.width.toFixed(1)} ${containerRect.height.toFixed(1)}`
    );
    path.setAttribute('d', d);
    if (els.timeConnectionHitArea) {
      els.timeConnectionHitArea.setAttribute('x', '0');
      els.timeConnectionHitArea.setAttribute('y', startY.toFixed(1));
      els.timeConnectionHitArea.setAttribute('width', containerRect.width.toFixed(1));
      els.timeConnectionHitArea.setAttribute('height', verticalDistance.toFixed(1));
    }
    line.hidden = false;
  }

  function scheduleTimeConnection(duration = 0) {
    timeConnectionUntil = Math.max(
      timeConnectionUntil,
      performance.now() + duration
    );
    if (timeConnectionFrame) return;

    const draw = (now) => {
      updateTimeConnection();
      if (now < timeConnectionUntil) {
        timeConnectionFrame = requestAnimationFrame(draw);
      } else {
        timeConnectionFrame = 0;
      }
    };
    timeConnectionFrame = requestAnimationFrame(draw);
  }

  function ensureOverviewScaffold(track) {
    let created = false;
    if (!track.querySelector('.overview-wish')) {
      const wish = document.createElement('div');
      wish.className = 'overview-wish';
      wish.title = 'Wunschzeit';
      track.appendChild(wish);
      created = true;
    }
    if (!track.querySelector('.overview-thumb')) {
      const thumb = document.createElement('div');
      thumb.className = 'overview-thumb';
      thumb.hidden = true;
      track.appendChild(thumb);
      created = true;
    }
    if (!track.querySelector('.overview-scrub-bubble')) {
      const bubble = document.createElement('div');
      bubble.className = 'overview-scrub-bubble';
      bubble.setAttribute('aria-hidden', 'true');
      track.appendChild(bubble);
      created = true;
    }
    return created;
  }

  function overviewMarkKey(solution) {
    return `${solution.programId}:${solution.delayMin}`;
  }

  function renderOverview(
    wishAbs,
    selectedSol,
    nowMin,
    { instantThumb = false, animateTimeline = false } = {}
  ) {
    const track = els.overviewTrack;
    if (!track) return;

    const scaffoldCreated = ensureOverviewScaffold(track);
    const marks = overviewVisibleMarks(wishAbs, nowMin);
    const existingMarks = new Map(
      [...track.querySelectorAll('.overview-mark')].map((element) => [
        element.dataset.key,
        element,
      ])
    );
    const desiredKeys = new Set();
    let previousAbs = null;
    let stackIndex = 0;

    for (const solution of marks) {
      stackIndex = solution.actualAbs === previousAbs ? stackIndex + 1 : 0;
      previousAbs = solution.actualAbs;

      const key = overviewMarkKey(solution);
      const program = programsById[solution.programId];
      const color = program && program.dotColor;
      let element = existingMarks.get(key);
      const isNew = !element;

      if (isNew) {
        element = document.createElement('div');
        element.className = 'overview-mark';
        element.dataset.key = key;
        if (animateTimeline) element.classList.add('is-entering');
        track.appendChild(element);
      } else {
        window.clearTimeout(element._overviewExitTimer);
        element.classList.remove('is-exiting');
      }

      desiredKeys.add(key);
      element.classList.toggle('has-color', !!color);
      element.style.left = `${overviewLeftPct(solution.actualAbs, wishAbs)}%`;
      element.style.setProperty('--stack-index', String(stackIndex));
      element.style.zIndex = String(10 - stackIndex);
      if (color) element.style.setProperty('--dot-color', color);
      else element.style.removeProperty('--dot-color');
      element.title = `${solution.actualClock}${program ? ` · ${program.label}` : ''}`;
      element.dataset.abs = String(solution.actualAbs);

      if (isNew && animateTimeline) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => element.classList.remove('is-entering'));
        });
      }
    }

    for (const [key, element] of existingMarks) {
      if (desiredKeys.has(key)) continue;
      if (!animateTimeline) {
        element.remove();
        continue;
      }
      element.classList.add('is-exiting');
      element._overviewExitTimer = window.setTimeout(() => {
        element.remove();
      }, MINUTE_TIMELINE_MOTION_MS);
    }

    const thumb = track.querySelector('.overview-thumb');
    const scrubBubble = track.querySelector('.overview-scrub-bubble');
    track.querySelectorAll('.overview-mark:not(.is-exiting)').forEach((el) => {
      el.classList.toggle(
        'is-near',
        !!(selectedSol && el.dataset.abs === String(selectedSol.actualAbs))
      );
    });

    if (selectedSol && thumb) {
      const leftPct = overviewLeftPct(selectedSol.actualAbs, wishAbs);
      const thumbColor =
        (programsById[selectedSol.programId] && programsById[selectedSol.programId].dotColor) ||
        '';
      if (thumbColor) thumb.style.setProperty('--thumb-color', thumbColor);
      else thumb.style.removeProperty('--thumb-color');
      thumb.hidden = false;
      moveOverviewThumb(leftPct, {
        instant: instantThumb || scaffoldCreated,
      });
      if (scrubBubble) {
        scrubBubble.textContent = formatScrubDiff(
          signedDiffMinutes(selectedSol.actualAbs, wishAbs)
        );
        scrubBubble.style.setProperty('--scrub-left', `${leftPct}%`);
      }
    } else if (thumb) {
      thumb.hidden = true;
    }
    scheduleTimeConnection(
      animateTimeline
        ? MINUTE_TIMELINE_MOTION_MS + 50
        : instantThumb || scaffoldCreated
          ? 0
          : 220
    );
  }

  function nearestOverviewMark(clientX, cache) {
    if (state.wishMinutes == null) return null;
    const track = els.overviewTrack;
    if (!track) return null;
    const rect = (cache && cache.rect) || track.getBoundingClientRect();
    if (rect.width <= 0) return null;

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const offsetMin = ratio * (OVERVIEW_WINDOW_MIN * 2) - OVERVIEW_WINDOW_MIN;
    const nowMin =
      overviewScrubbing && overviewScrubNowMin != null
        ? overviewScrubNowMin
        : nowMinutes();
    const wishAbs = wishAbsolute(state.wishMinutes, nowMin);
    const targetAbs = wishAbs + offsetMin;
    const marks = (cache && cache.marks) || overviewMarks(wishAbs, nowMin);
    if (!marks.length) return null;

    let best = marks[0];
    let bestD = Math.abs(best.actualAbs - targetAbs);
    for (let i = 1; i < marks.length; i++) {
      const d = Math.abs(marks[i].actualAbs - targetAbs);
      if (d < bestD) {
        bestD = d;
        best = marks[i];
      }
    }
    return best;
  }

  let scrubBubbleLeaveTimer = 0;

  function showOverviewScrubBubble() {
    const bubble =
      els.overviewTrack &&
      els.overviewTrack.querySelector('.overview-scrub-bubble');
    if (!bubble) return;
    window.clearTimeout(scrubBubbleLeaveTimer);
    bubble.classList.remove('is-leaving');
    bubble.classList.add('is-visible');
  }

  function hideOverviewScrubBubble() {
    const bubble =
      els.overviewTrack &&
      els.overviewTrack.querySelector('.overview-scrub-bubble');
    if (!bubble) return;
    bubble.classList.remove('is-visible');
    bubble.classList.add('is-leaving');
    window.clearTimeout(scrubBubbleLeaveTimer);
    scrubBubbleLeaveTimer = window.setTimeout(() => {
      bubble.classList.remove('is-leaving');
    }, 360);
  }

  function scrubOverviewTo(clientX, cache) {
    const mark = nearestOverviewMark(clientX, cache);
    if (!mark) return;
    if (state.solution && mark.actualAbs === state.solution.actualAbs) return;
    const dir =
      state.solution && mark.actualAbs > state.solution.actualAbs ? 1 : -1;
    applySolution(mark, { animateDir: dir, fromScrub: true });
  }

  function bindOverviewScrub() {
    const tl = els.overviewTl;
    if (!tl) return;
    const scrubTargets = [tl, els.timeConnectionHitArea].filter(Boolean);
    let dragging = false;
    let activePointerId = null;
    let dragCache = null;

    const onMove = (e) => {
      if (!dragging || e.pointerId !== activePointerId) return;
      scrubOverviewTo(e.clientX, dragCache);
    };

    const endDrag = (e) => {
      if (!dragging) return;
      if (e && activePointerId != null && e.pointerId !== activePointerId) return;
      dragging = false;
      overviewScrubbing = false;
      overviewScrubNowMin = null;
      activePointerId = null;
      dragCache = null;
      els.timeConnection.classList.remove('is-scrubbing');
      els.programButtons.classList.remove('is-scrubbing');
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', endDrag, true);
      window.removeEventListener('pointercancel', endDrag, true);
      hideOverviewScrubBubble();
      if (pendingMinuteUpdate) {
        pendingMinuteUpdate = false;
        requestAnimationFrame(requestMinuteRecompute);
      }
    };

    // Kein setPointerCapture: auf iOS blockiert das danach oft den ersten Tap auf andere Controls.
    const startDrag = (e) => {
      if (dragging) return; // ein zweiter Pointer darf den aktiven Drag nicht übernehmen
      if (e.button != null && e.button !== 0) return;
      stopMinuteTimelineMotion();
      dragging = true;
      overviewScrubbing = true;
      overviewScrubNowMin = nowMinutes();
      activePointerId = e.pointerId;
      const rect = els.overviewTrack && els.overviewTrack.getBoundingClientRect();
      dragCache =
        rect && state.wishMinutes != null
          ? {
              rect,
              marks: overviewMarks(
                wishAbsolute(state.wishMinutes, overviewScrubNowMin),
                overviewScrubNowMin
              ),
            }
          : null;
      els.timeConnection.classList.add('is-scrubbing');
      els.programButtons.classList.add('is-scrubbing');
      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', endDrag, true);
      window.addEventListener('pointercancel', endDrag, true);
      scrubOverviewTo(e.clientX, dragCache);
      showOverviewScrubBubble();
      e.preventDefault();
    };
    scrubTargets.forEach((target) => {
      target.addEventListener('pointerdown', startDrag);
    });
  }

  function setStepEnabled(btn, enabled) {
    // Kein btn.disabled: iOS/WebKit schluckt sonst oft den ersten Tap nach Re-Enable.
    btn.classList.toggle('is-disabled', !enabled);
    btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  }

  function bindArmedTap(btn, onActivate) {
    // pointerup statt click: nach Timeline-Gesten liefert iOS oft kein click auf dem ersten Tap.
    const disabled = () => btn.classList.contains('is-disabled');
    let armed = false;
    btn.addEventListener('pointerdown', (e) => {
      if (disabled()) return;
      if (e.button != null && e.button !== 0) return;
      armed = true;
    });
    btn.addEventListener('pointerup', (e) => {
      if (!armed) return;
      armed = false;
      if (disabled()) return;
      if (e.button != null && e.button !== 0) return;
      onActivate();
    });
    btn.addEventListener('pointercancel', () => {
      armed = false;
    });
    btn.addEventListener('pointerleave', () => {
      armed = false;
    });
    btn.addEventListener('click', (e) => {
      // Tastatur (Enter/Space): detail === 0; Touch/Maus bereits per pointerup
      if (e.detail !== 0) {
        e.preventDefault();
        return;
      }
      if (disabled()) {
        e.preventDefault();
        return;
      }
      onActivate();
    });
  }

  function bindStepButton(btn, dir) {
    bindArmedTap(btn, () => stepSolution(dir));
  }

  function applySolution(
    sol,
    { animateDir = 0, fromScrub = false, fromMinuteUpdate = false } = {}
  ) {
    if (fromMinuteUpdate) startMinuteTimelineMotion();
    else stopMinuteTimelineMotion();

    const prevProgram = state.selectedProgramId;
    state.solution = sol;
    state.selectedProgramId = sol.programId;

    if (animateDir) odoTo(els.actualOdo, sol.actualClock, animateDir);
    else setOdoInstant(els.actualOdo, sol.actualClock);

    const nowMin =
      fromScrub && overviewScrubNowMin != null
        ? overviewScrubNowMin
        : nowMinutes();
    const wishAbs = wishAbsolute(state.wishMinutes, nowMin);
    els.actualLabel.textContent = formatPossibleDiff(
      signedDiffMinutes(sol.actualAbs, wishAbs)
    );

    const wishOnNextDay = state.wishMinutes <= nowMin;
    const actualOnNextDay = sol.actualAbs >= MINUTES_PER_DAY;
    els.wishDayHint.textContent = wishOnNextDay || actualOnNextDay ? 'morgen' : '';

    updateHero(sol.presses, { animateDir });

    const nav = overviewMarks(wishAbs, nowMin);
    setStepEnabled(
      els.earlierBtn,
      nav.some((candidate) => candidate.actualAbs < sol.actualAbs)
    );
    setStepEnabled(
      els.laterBtn,
      nav.some((candidate) => candidate.actualAbs > sol.actualAbs)
    );

    renderOverview(wishAbs, sol, nowMin, {
      instantThumb: !fromScrub && !animateDir && !fromMinuteUpdate,
      animateTimeline: fromMinuteUpdate,
    });
    if (fromScrub) syncProgramSelection();
    else if (prevProgram !== sol.programId) renderPrograms();
    else syncProgramSelection();
  }

  function syncProgramSelection() {
    const matchingProgramIds = sharedEndTimeProgramIds();
    els.programButtons.querySelectorAll('.prog').forEach((btn) => {
      const id = btn.dataset.id;
      const selected = id === state.selectedProgramId;
      if (selected) btn.setAttribute('aria-selected', 'true');
      else btn.removeAttribute('aria-selected');
      btn.classList.toggle('is-locked', state.locked && selected);
      btn.classList.toggle('has-shared-end-time', matchingProgramIds.has(id));
    });
  }

  function solutionFromDelay(programId, delayMin, nowMin) {
    const prog = programsById[programId];
    const idx = config.delayStepsMin.indexOf(delayMin);
    if (!prog || idx < 0) return null;
    const actualAbs = nowMin + delayMin + prog.durationMin;
    return {
      programId,
      delayMin,
      presses: idx + 1,
      actualAbs,
      actualClock: formatClock(actualAbs)
    };
  }

  function recompute({ preserveDelay = false, fromMinuteUpdate = false } = {}) {
    if (state.wishMinutes == null) return;
    const nowMin = nowMinutes();
    const wishAbs = wishAbsolute(state.wishMinutes, nowMin);

    let sol = null;
    if (preserveDelay && state.solution) {
      sol = solutionFromDelay(state.solution.programId, state.solution.delayMin, nowMin);
    }
    if (!sol) sol = bestForProgram(state.selectedProgramId, nowMin, wishAbs);
    if (!sol) return;
    applySolution(sol, { animateDir: 0, fromMinuteUpdate });
  }

  function requestMinuteRecompute() {
    if (overviewScrubbing) {
      pendingMinuteUpdate = true;
      return;
    }
    recompute({ preserveDelay: true, fromMinuteUpdate: true });
  }

  function stepSolution(dir) {
    if (state.wishMinutes == null || !state.solution) return;
    const nowMin = nowMinutes();
    const wishAbs = wishAbsolute(state.wishMinutes, nowMin);
    const nav = overviewMarks(wishAbs, nowMin);
    if (!nav.length) return;

    const idx = navIndexFor(state.solution, nav);
    if (idx < 0) {
      const candidates = nav.filter((candidate) =>
        dir < 0
          ? candidate.actualAbs < state.solution.actualAbs
          : candidate.actualAbs > state.solution.actualAbs
      );
      if (!candidates.length) return;
      const next = dir < 0 ? candidates[candidates.length - 1] : candidates[0];
      applySolution(next, { animateDir: dir });
      return;
    }

    const next = idx + dir;
    if (next < 0 || next >= nav.length) return;
    applySolution(nav[next], { animateDir: dir });
  }

  function saveWishMinutes(mins) {
    state.wishMinutes = mins;
    try {
      localStorage.setItem(WISH_KEY, String(mins));
    } catch (_) { /* private mode / quota */ }
  }

  function loadWishMinutes() {
    try {
      const raw = localStorage.getItem(WISH_KEY);
      if (raw == null || raw === '') return null;
      const mins = parseInt(raw, 10);
      if (Number.isFinite(mins) && mins >= 0 && mins < 24 * 60) return mins;
    } catch (_) { /* ignore */ }
    return null;
  }

  function commitWishFromInput(raw, { blur = false } = {}) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 3 && parseWishDigits(digits) != null) {
      const mins = parseWishDigits(digits);
      saveWishMinutes(mins);
      els.wishInput.value = formatClock(mins);
      recompute();
      return true;
    }
    if (digits.length >= 4) {
      const mins = parseWishDigits(digits.slice(0, 4));
      if (mins != null) {
        saveWishMinutes(mins);
        els.wishInput.value = formatClock(mins);
        recompute();
        return true;
      }
    }
    if (blur) {
      if (state.wishMinutes != null) els.wishInput.value = formatClock(state.wishMinutes);
      else els.wishInput.value = '';
    }
    return false;
  }

  // Init
  programPreferences = loadProgramPreferences();
  syncOverviewLabels();
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light');

  const toggleTheme = () => {
    applyTheme(els.root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  };
  bindArmedTap(els.themeToggle, toggleTheme);

  els.wishInput.addEventListener('focus', () => {
    requestAnimationFrame(() => els.wishInput.select());
  });
  els.wishInput.addEventListener('pointerup', (e) => {
    // iOS: Auswahl nach Tap nicht sofort wieder aufheben
    e.preventDefault();
    els.wishInput.select();
  });

  els.wishInput.addEventListener('input', () => {
    const digits = els.wishInput.value.replace(/\D/g, '').slice(0, 4);
    els.wishInput.value = digits;
    if (digits.length === 4) commitWishFromInput(digits);
  });

  els.wishInput.addEventListener('blur', () => {
    commitWishFromInput(els.wishInput.value, { blur: true });
  });

  bindStepButton(els.earlierBtn, -1);
  bindStepButton(els.laterBtn, 1);
  bindOverviewScrub();

  window.addEventListener('resize', () => scheduleTimeConnection());
  if ('ResizeObserver' in window && els.timeConnection) {
    const connectionResizeObserver = new ResizeObserver(() => {
      scheduleTimeConnection();
    });
    connectionResizeObserver.observe(els.timeConnection);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => scheduleTimeConnection());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recompute({ preserveDelay: true });
  });
  setInterval(requestMinuteRecompute, 60000);

  state.wishMinutes = loadWishMinutes() ?? (6 * 60 + 30);
  els.wishInput.value = formatClock(state.wishMinutes);
  renderPrograms();
  recompute({ preserveDelay: false });
})();
