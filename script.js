// Constants and Configuration
const CONSTANTS = {
    // Time-related constants
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
    MINUTES_PER_DAY: 24 * 60,
    HALF_DAY_MINUTES: 12 * 60,

    // Timer settings (in minutes)
    TIMER_SETTINGS: [
        30, 60, 90, 120, 150, 180, 210, 240,
        300, 360, 420, 480, 540, 600, 660, 720,
        960, 1200, 1440
    ],

    // UI timing
    INACTIVITY_TIMEOUT: 1500,
    FLASH_DURATION: 500,
    UPDATE_INTERVAL: 60000,

    // Time adjustment
    TIME_ADJUSTMENT_STEP: 10,

    // Program durations (in minutes)
    PROGRAM_DURATIONS: {
        'p1': 220, // Eco
        'p3': 170, // Sanitize
        'p4': 90,  // Fast
        'p5': 210  // Silent
    },

    // Program descriptions
    PROGRAM_DESCRIPTIONS: {
        'p1': '🌱 Eco',
        'p3': '🦠 Sanitize',
        'p4': '⚡ Fast',
        'p5': '🔇 Silent'
    },

    // Emoji thresholds for time difference feedback
    EMOJI_THRESHOLDS: [
        { min: -Infinity, max: -60, emoji: '🤯' },
        { min: -60, max: -30, emoji: '😕' },
        { min: -30, max: -15, emoji: '😐' },
        { min: -15, max: -6, emoji: '😊' },
        { min: -5, max: 0, emoji: '😍' },
        { min: 1, max: 5, emoji: '😊' },
        { min: 6, max: 15, emoji: '😕' },
        { min: 16, max: Infinity, emoji: '🤯' }
    ],

    // DOM element IDs
    ELEMENT_IDS: {
        DIGITS: ['digit1', 'digit2', 'digit3', 'digit4'],
        FINISH_TIME: 'finishTime',
        TIME_DIFF_TEXT: 'timeDiffText',
        TIMER_SETTING: 'timerSetting',
        MAGIC_LINK: 'magicLink',
        SUBTRACT_TIME: 'subtractTime',
        ADD_TIME: 'addTime'
    },

    // CSS classes
    CSS_CLASSES: {
        SELECTED: 'selected',
        PRESSED: 'pressed',
        HIGHLIGHT: 'highlight',
        FLASH_RED: 'flash-red',
        PROGRAM_BUTTON: 'program-button',
        PRESET_BUTTON: 'preset-button',
        KEYPAD_BUTTON: 'keypad-button',
        TIME_ADJUST_BUTTON: 'time-adjust-button'
    }
};

// Program information object
const programInfo = {
    'p1': { duration: CONSTANTS.PROGRAM_DURATIONS.p1, description: CONSTANTS.PROGRAM_DESCRIPTIONS.p1 },
    'p3': { duration: CONSTANTS.PROGRAM_DURATIONS.p3, description: CONSTANTS.PROGRAM_DESCRIPTIONS.p3 },
    'p4': { duration: CONSTANTS.PROGRAM_DURATIONS.p4, description: CONSTANTS.PROGRAM_DESCRIPTIONS.p4 },
    'p5': { duration: CONSTANTS.PROGRAM_DURATIONS.p5, description: CONSTANTS.PROGRAM_DESCRIPTIONS.p5 }
};

// Global state
let selectedProgram = 'p1';
let currentDigitIndex = 0;
let inactivityTimer;

// DOM elements
const programButtons = document.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.PROGRAM_BUTTON}`);
const digits = CONSTANTS.ELEMENT_IDS.DIGITS;

// Initialize program buttons
programButtons.forEach(button => {
    button.addEventListener('click', () => {
        programButtons.forEach(btn => btn.classList.remove(CONSTANTS.CSS_CLASSES.SELECTED));
        button.classList.add(CONSTANTS.CSS_CLASSES.SELECTED);
        selectedProgram = button.id;
        calculateTimerSetting();
    });
});

// Inactivity timer management
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        currentDigitIndex = 0;
        highlightCurrentDigit();
    }, CONSTANTS.INACTIVITY_TIMEOUT);
}

// Highlight current digit input
function highlightCurrentDigit() {
    digits.forEach((id, index) => {
        const field = document.getElementById(id);
        if (index === currentDigitIndex) {
            field.classList.add(CONSTANTS.CSS_CLASSES.HIGHLIGHT);
        } else {
            field.classList.remove(CONSTANTS.CSS_CLASSES.HIGHLIGHT);
        }
    });
    resetInactivityTimer();
}

// Initialize digit highlighting
highlightCurrentDigit();

// Input validation
function isValidInput(digit) {
    const hour1 = document.getElementById('digit1').value;
    const hour2 = document.getElementById('digit2').value;
    const min1 = document.getElementById('digit3').value;
    const min2 = document.getElementById('digit4').value;

    switch (currentDigitIndex) {
        case 0:
            return digit <= '2';
        case 1:
            return hour1 === '2' ? digit <= '3' : true;
        case 2:
            return digit <= '5';
        case 3:
            return true;
        default:
            return false;
    }
}

// Preset button handlers
const presetButtons = document.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.PRESET_BUTTON}`);
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const timeStr = button.textContent.replace(':', '');
        if (isValidTime(timeStr)) {
            setTimePreset(timeStr);
        }
    });
});

// Time validation
function isValidTime(timeStr) {
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

// Set time from preset
function setTimePreset(timeStr) {
    document.getElementById('digit1').value = timeStr.charAt(0);
    document.getElementById('digit2').value = timeStr.charAt(1);
    document.getElementById('digit3').value = timeStr.charAt(2);
    document.getElementById('digit4').value = timeStr.charAt(3);
    currentDigitIndex = 0;
    highlightCurrentDigit();
    calculateTimerSetting();
    resetInactivityTimer();
}

// Main timer calculation function
function calculateTimerSetting() {
    let hours = parseInt(document.getElementById('digit1').value + document.getElementById('digit2').value);
    let minutes = parseInt(document.getElementById('digit3').value + document.getElementById('digit4').value);
    if (isNaN(hours)) hours = 0;
    if (isNaN(minutes)) minutes = 0;

    const now = new Date();
    const currentTimeMinutes = now.getHours() * CONSTANTS.MINUTES_PER_HOUR + now.getMinutes();

    let finishTimeMinutes = hours * CONSTANTS.MINUTES_PER_HOUR + minutes;

    if (finishTimeMinutes <= currentTimeMinutes) {
        finishTimeMinutes += CONSTANTS.MINUTES_PER_DAY;
    }

    let timeDiff = finishTimeMinutes - currentTimeMinutes;
    if (timeDiff < 0) {
        timeDiff += CONSTANTS.MINUTES_PER_DAY;
    }

    const programDuration = programInfo[selectedProgram].duration;
    let delayTime = timeDiff - programDuration;

    let closestTimerSetting = CONSTANTS.TIMER_SETTINGS.reduce((prev, curr) => {
        return (Math.abs(curr - delayTime) < Math.abs(prev - delayTime) ? curr : prev);
    });

    let actualFinishMinutes = currentTimeMinutes + closestTimerSetting + programDuration;
    const daysLater = Math.floor(actualFinishMinutes / CONSTANTS.MINUTES_PER_DAY);
    actualFinishMinutes %= CONSTANTS.MINUTES_PER_DAY;

    let timeDiffMinutes = actualFinishMinutes - finishTimeMinutes;
    if (daysLater > 0) {
        timeDiffMinutes += daysLater * CONSTANTS.MINUTES_PER_DAY;
    }
    if (timeDiffMinutes <= -CONSTANTS.HALF_DAY_MINUTES) {
        timeDiffMinutes += CONSTANTS.MINUTES_PER_DAY;
    } else if (timeDiffMinutes > CONSTANTS.HALF_DAY_MINUTES) {
        timeDiffMinutes -= CONSTANTS.MINUTES_PER_DAY;
    }
    const earlierLater = timeDiffMinutes <= 0 ? "früher" : "später";
    const absDiffMinutes = Math.abs(timeDiffMinutes);
    const diffHours = Math.floor(absDiffMinutes / CONSTANTS.MINUTES_PER_HOUR);
    const diffMins = absDiffMinutes % CONSTANTS.MINUTES_PER_HOUR;

    let timeDiffStr = '';
    if (diffHours > 0) {
        timeDiffStr += `${diffHours}"`;
    }
    if (diffMins > 0 || diffHours === 0) {
        timeDiffStr += `${diffMins}'`;
    }

    let buttonPresses = CONSTANTS.TIMER_SETTINGS.indexOf(closestTimerSetting) + 1;

    let timerSettingStr;
    if (closestTimerSetting < 240) {
        timerSettingStr = (closestTimerSetting / CONSTANTS.MINUTES_PER_HOUR).toFixed(1).replace('.5', ':30').replace('.0', '') + ' h';
    } else {
        timerSettingStr = (closestTimerSetting / CONSTANTS.MINUTES_PER_HOUR) + ' h';
    }

    const actualFinishTimeStr = ('0' + Math.floor(actualFinishMinutes / CONSTANTS.MINUTES_PER_HOUR)).slice(-2) + ':' + ('0' + (actualFinishMinutes % CONSTANTS.MINUTES_PER_HOUR)).slice(-2);

    document.getElementById(CONSTANTS.ELEMENT_IDS.FINISH_TIME).textContent = actualFinishTimeStr;

    const timeDiffText = document.getElementById(CONSTANTS.ELEMENT_IDS.TIME_DIFF_TEXT);
    const emoji = getEmoji(timeDiffMinutes);
    timeDiffText.innerHTML = `<span class="emoji">${emoji}</span> ${timeDiffStr} ${earlierLater} beendet`;

    document.getElementById(CONSTANTS.ELEMENT_IDS.TIMER_SETTING).innerHTML = `Wähle <span style="background-color: rgb(250, 232, 31); padding: 2px 4px; border-radius: 4px;">${buttonPresses}×P</span> oder <a href="#" id="${CONSTANTS.ELEMENT_IDS.MAGIC_LINK}">BestSelect</a>`;

    document.getElementById(CONSTANTS.ELEMENT_IDS.MAGIC_LINK).addEventListener('click', (e) => {
        e.preventDefault();
        const finishTimeMinutes = parseInt(document.getElementById('digit1').value + document.getElementById('digit2').value) * CONSTANTS.MINUTES_PER_HOUR +
            parseInt(document.getElementById('digit3').value + document.getElementById('digit4').value);
        selectOptimalProgram(finishTimeMinutes);
    });
}

// Get emoji based on time difference
function getEmoji(timeDiffMinutes) {
    const matchedEmoji = CONSTANTS.EMOJI_THRESHOLDS.find(range => timeDiffMinutes >= range.min && timeDiffMinutes <= range.max);
    return matchedEmoji ? matchedEmoji.emoji : '';
}

// Select optimal program based on desired finish time
function selectOptimalProgram(desiredFinishTime) {
    const now = new Date();
    const currentTimeMinutes = now.getHours() * CONSTANTS.MINUTES_PER_HOUR + now.getMinutes();

    let bestProgram = null;
    let smallestDiff = Infinity;

    for (const [programId, info] of Object.entries(programInfo)) {
        if (info.duration >= CONSTANTS.MINUTES_PER_HOUR) {
            let programDuration = info.duration;
            let timeDiff = desiredFinishTime - currentTimeMinutes;

            if (timeDiff <= 0) {
                timeDiff += CONSTANTS.MINUTES_PER_DAY;
            }

            let delayTime = timeDiff - programDuration;

            let closestTimerSetting = CONSTANTS.TIMER_SETTINGS.reduce((prev, curr) => {
                return (Math.abs(curr - delayTime) < Math.abs(prev - delayTime) ? curr : prev);
            });

            let actualFinishTime = (currentTimeMinutes + closestTimerSetting + programDuration) % CONSTANTS.MINUTES_PER_DAY;
            let actualTimeDiff = (actualFinishTime - desiredFinishTime + CONSTANTS.MINUTES_PER_DAY) % CONSTANTS.MINUTES_PER_DAY;

            if (actualTimeDiff > CONSTANTS.HALF_DAY_MINUTES) {
                actualTimeDiff = actualTimeDiff - CONSTANTS.MINUTES_PER_DAY;
            }

            if (actualTimeDiff <= 0 && Math.abs(actualTimeDiff) <= Math.abs(smallestDiff)) {
                smallestDiff = actualTimeDiff;
                bestProgram = programId;
            }
        }
    }

    if (bestProgram) {
        document.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.PROGRAM_BUTTON}`).forEach(btn => {
            btn.classList.remove(CONSTANTS.CSS_CLASSES.SELECTED);
            if (btn.id === bestProgram) {
                btn.classList.add(CONSTANTS.CSS_CLASSES.SELECTED);
            }
        });
        selectedProgram = bestProgram;
        calculateTimerSetting();
    } else {
        document.body.classList.add(CONSTANTS.CSS_CLASSES.FLASH_RED);
        setTimeout(() => {
            document.body.classList.remove(CONSTANTS.CSS_CLASSES.FLASH_RED);
        }, CONSTANTS.FLASH_DURATION);
    }
}

// Add press effect for buttons
function addPressEffect(button) {
    const pressHandler = (e) => {
        e.preventDefault();
        button.classList.add(CONSTANTS.CSS_CLASSES.PRESSED);

        if (button.classList.contains(CONSTANTS.CSS_CLASSES.KEYPAD_BUTTON)) {
            const digit = button.textContent;
            if (isValidInput(digit)) {
                const currentField = document.getElementById(digits[currentDigitIndex]);
                currentField.value = digit;
                currentDigitIndex = (currentDigitIndex + 1) % 4;
                highlightCurrentDigit();
                calculateTimerSetting();
                resetInactivityTimer();
            }
        } else if (button.classList.contains(CONSTANTS.CSS_CLASSES.PROGRAM_BUTTON)) {
            programButtons.forEach(btn => btn.classList.remove(CONSTANTS.CSS_CLASSES.SELECTED));
            button.classList.add(CONSTANTS.CSS_CLASSES.SELECTED);
            selectedProgram = button.id;
            calculateTimerSetting();
        } else if (button.classList.contains(CONSTANTS.CSS_CLASSES.PRESET_BUTTON)) {
            const timeStr = button.textContent.replace(':', '');
            if (isValidTime(timeStr)) {
                setTimePreset(timeStr);
            }
        } else if (button.id === CONSTANTS.ELEMENT_IDS.SUBTRACT_TIME) {
            adjustTime(-CONSTANTS.TIME_ADJUSTMENT_STEP);
        } else if (button.id === CONSTANTS.ELEMENT_IDS.ADD_TIME) {
            adjustTime(CONSTANTS.TIME_ADJUSTMENT_STEP);
        }
    };

    const releaseHandler = (e) => {
        e.preventDefault();
        button.classList.remove(CONSTANTS.CSS_CLASSES.PRESSED);
    };

    button.addEventListener('touchstart', pressHandler);
    button.addEventListener('touchend', releaseHandler);
    button.addEventListener('mousedown', pressHandler);
    button.addEventListener('mouseup', releaseHandler);
}

// Apply press effects to all interactive buttons
document.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.PROGRAM_BUTTON}, .${CONSTANTS.CSS_CLASSES.PRESET_BUTTON}, .${CONSTANTS.CSS_CLASSES.KEYPAD_BUTTON}, .${CONSTANTS.CSS_CLASSES.TIME_ADJUST_BUTTON}`).forEach(addPressEffect);

// Time adjustment handlers
document.getElementById(CONSTANTS.ELEMENT_IDS.SUBTRACT_TIME).addEventListener('click', () => adjustTime(-CONSTANTS.TIME_ADJUSTMENT_STEP));
document.getElementById(CONSTANTS.ELEMENT_IDS.ADD_TIME).addEventListener('click', () => adjustTime(CONSTANTS.TIME_ADJUSTMENT_STEP));

// Adjust time by specified minutes
function adjustTime(minutes) {
    let hours = parseInt(document.getElementById('digit1').value + document.getElementById('digit2').value) || 0;
    let mins = parseInt(document.getElementById('digit3').value + document.getElementById('digit4').value) || 0;

    let totalMinutes = hours * CONSTANTS.MINUTES_PER_HOUR + mins + minutes;
    if (totalMinutes < 0) totalMinutes += CONSTANTS.MINUTES_PER_DAY;
    totalMinutes %= CONSTANTS.MINUTES_PER_DAY;

    hours = Math.floor(totalMinutes / CONSTANTS.MINUTES_PER_HOUR);
    mins = totalMinutes % CONSTANTS.MINUTES_PER_HOUR;

    document.getElementById('digit1').value = Math.floor(hours / 10);
    document.getElementById('digit2').value = hours % 10;
    document.getElementById('digit3').value = Math.floor(mins / 10);
    document.getElementById('digit4').value = mins % 10;

    calculateTimerSetting();
    resetInactivityTimer();
}

// Update program end times
function updateProgramEndTimes() {
    const now = new Date();
    const currentMinutes = now.getHours() * CONSTANTS.MINUTES_PER_HOUR + now.getMinutes();

    programButtons.forEach(button => {
        const duration = parseInt(button.dataset.duration);
        const endTimeMinutes = (currentMinutes + duration) % CONSTANTS.MINUTES_PER_DAY;
        const endHours = Math.floor(endTimeMinutes / CONSTANTS.MINUTES_PER_HOUR);
        const endMins = endTimeMinutes % CONSTANTS.MINUTES_PER_HOUR;
        const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

        const endTimeSpan = button.querySelector('.end-time');
        if (endTimeSpan) {
            endTimeSpan.textContent = `Endet ${endTimeStr}`;
        }
    });
}

// Keyboard input handler
document.addEventListener('keydown', (event) => {
    if (/^[0-9]$/.test(event.key)) {
        const digit = event.key;
        if (isValidInput(digit)) {
            const currentField = document.getElementById(digits[currentDigitIndex]);
            currentField.value = digit;
            currentDigitIndex = (currentDigitIndex + 1) % 4;
            highlightCurrentDigit();
            calculateTimerSetting();
            resetInactivityTimer();
        }
    }
});

// Initialize app when DOM is loaded
window.onload = function () {
    highlightCurrentDigit();
    const firstPresetButton = document.querySelector(`.${CONSTANTS.CSS_CLASSES.PRESET_BUTTON}`);
    if (firstPresetButton) {
        firstPresetButton.click();
    }
    calculateTimerSetting();
    resetInactivityTimer();

    updateProgramEndTimes();
    setInterval(updateProgramEndTimes, CONSTANTS.UPDATE_INTERVAL);
};
