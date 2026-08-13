console.log('🍅 [JopPomidorko WebView] Script loaded!');

// i18n loaded from i18n-data.js
const I18N = window.PomidorkoI18n || { LOCALES: [], BUILTIN: { en: {} }, buildDict: () => ({}), detectLocale: () => 'en', t: (d,k) => k };

let state = {
    timerState: 'idle',
    phase: 'work',
    secondsElapsed: 0,
    totalSeconds: 1500,
    remaining: 1500,
    formattedElapsed: '00:00:00',
    formattedRemaining: '00:25:00',
    formattedTotal: '00:25:00',
    currentTask: { name: '', identifier: '', url: '' },
    settings: {
        workMinutes: 25, restMinutes: 5,
        allowModeSwitch: true, displayMode: 3,
        showPause: true, showStop: true, showStart: true,
        playSound: true, warnOnPause: false, warnOnStop: true,
        locale: 'auto',
        customTranslations: '{}',
        timerBgColor1: '#0052CC',
        statsBgColor1: '#0052CC',
    },
    records: [],
    locale: 'en',
    dictionary: {},
    locales: [],
    builtin: {},
    customTranslations: {},
};

let displayMode = 3;
let accordions = { timer: true, settings: false, stats: false, translations: false };

// Register message handler EARLY
webviewApi.onMessage((event) => {
    const msg = event.message || event;
    if (msg.type === 'update') {
        state = msg.state;
        if (state.settings) displayMode = state.settings.displayMode;
        render();
    } else if (msg.type === 'playSound') {
        if (state.settings && state.settings.playSound) playAlarm();
    }
});

function playAlarm() {
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const now = ctx.currentTime;
        const notes = [880, 1108.73, 1318.51];
        const nd = 0.3, gap = 0.15;
        notes.forEach((freq, i) => {
            const st = now + i * (nd + gap);
            const osc = ctx.createOscillator();
            osc.type = 'sine'; osc.frequency.value = freq;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, st);
            gain.gain.linearRampToValueAtTime(0.3, st + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, st + nd);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(st); osc.stop(st + nd);
        });
        setTimeout(() => ctx.close(), 2000);
    } catch (e) { console.error('Sound error:', e); }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function darkenColor(hex, amount = 0.25) {
    try {
        const c = hex.replace('#', '');
        const r = parseInt(c.slice(0, 2), 16);
        const g = parseInt(c.slice(2, 4), 16);
        const b = parseInt(c.slice(4, 6), 16);
        const nr = Math.max(0, Math.round(r * (1 - amount)));
        const ng = Math.max(0, Math.round(g * (1 - amount)));
        const nb = Math.max(0, Math.round(b * (1 - amount)));
        return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
    } catch { return hex; }
}

function tr(key, fallback) {
    return I18N.t(state.dictionary, key, fallback);
}

function getActionLabel(action) {
    const map = {
        'start': tr('stats.action.start', 'Start'),
        'pause': tr('stats.action.pause', 'Pause'),
        'resume': tr('stats.action.resume', 'Resume'),
        'stop': tr('stats.action.stop', 'Stop'),
        'complete': tr('stats.action.complete', 'Completed'),
    };
    return map[action] || action;
}

function getActionClass(action) {
    const map = {
        'start': 'action-start',
        'pause': 'action-pause',
        'resume': 'action-resume',
        'stop': 'action-stop',
        'complete': 'action-complete',
    };
    return map[action] || '';
}

function getModeIcon(mode) {
    // Monochrome geometric icons
    const map = ['◷', '◐', '◔', '◑'];
    return map[mode] || '◷';
}

function getModeName(mode) {
    const keys = ['timer.mode.remaining', 'timer.mode.elapsed', 'timer.mode.remainingOfTotal', 'timer.mode.elapsedOfTotal'];
    return tr(keys[mode], '');
}

function getTimeDisplay() {
    switch (displayMode) {
        case 0: return state.formattedRemaining;
        case 1: return state.formattedElapsed;
        case 2: return `${state.formattedRemaining} / ${state.formattedTotal}`;
        case 3: return `${state.formattedElapsed} / ${state.formattedTotal}`;
        default: return state.formattedRemaining;
    }
}

function computeStats() {
    const records = state.records || [];
    const dayStats = {};
    let totalSessions = 0, totalCompleted = 0, totalPaused = 0, totalStopped = 0, totalTimeWorked = 0;

    records.forEach((r) => {
        const d = new Date(r.timestamp);
        const day = d.toDateString();
        if (!dayStats[day]) dayStats[day] = { sessions: 0, completed: 0, paused: 0, stopped: 0, timeWorked: 0 };
        const ds = dayStats[day];
        if (r.action === 'start') { ds.sessions++; totalSessions++; }
        if (r.action === 'complete') { ds.completed++; totalCompleted++; }
        if (r.action === 'pause') { ds.paused++; totalPaused++; }
        if (r.action === 'stop') { ds.stopped++; totalStopped++; }
        if (['pause','stop','complete'].includes(r.action)) {
            const dur = r.duration || 0;
            ds.timeWorked += dur;
            totalTimeWorked += dur;
        }
    });
    return { dayStats, total: { sessions: totalSessions, completed: totalCompleted, paused: totalPaused, stopped: totalStopped, timeWorked: totalTimeWorked } };
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderTimerSection() {
    const s = state;
    const settings = s.settings;
    const statusClass = s.timerState === 'running' ? 'status-running' :
        s.timerState === 'paused' ? 'status-paused' : 'status-idle';
    const statusText = s.timerState === 'running' ? tr('timer.status.running', 'Running') :
        s.timerState === 'paused' ? tr('timer.status.paused', 'Paused') :
            tr('timer.status.ready', 'Ready');
    const phaseLabel = s.phase === 'rest' ? tr('timer.phase.rest', 'Break') : tr('timer.phase.work', 'Work');

    const modeIcon = getModeIcon(displayMode);
    const timeDisplay = getTimeDisplay();
    const modeClickAttr = settings.allowModeSwitch ? `onclick="cycleMode()" title="${escapeHtml(tr('timer.modeSwitchHint','Click to switch mode'))}"` : `title="${escapeHtml(tr('timer.modeSwitchDisabled','Disabled'))}"`;

    let buttonsHtml = '';
    if (settings.showStart && (s.timerState === 'idle' || s.timerState === 'paused')) {
        const btnText = s.timerState === 'idle' ? tr('timer.btn.start','Start') : tr('timer.btn.continue','Continue');
        buttonsHtml += `<button class="btn btn-primary" onclick="sendMessage('start')">▷ ${btnText}</button>`;
    }
    if (settings.showPause && s.timerState === 'running') {
        buttonsHtml += `<button class="btn btn-warning" onclick="sendMessage('pause')">❙❙ ${tr('timer.btn.pause','Pause')}</button>`;
    }
    if (settings.showStop && s.timerState !== 'idle') {
        buttonsHtml += `<button class="btn btn-danger" onclick="sendMessage('stop')">■ ${tr('timer.btn.stop','Stop')}</button>`;
    }

    const taskDisplay = s.currentTask && s.currentTask.name ?
        `<div class="current-task">◉ ${escapeHtml(s.currentTask.name)}</div>` : '';

    const timerBg1 = settings.timerBgColor1 || '#0052CC';
    const timerBg2 = darkenColor(timerBg1, 0.25);

    return `
        <div class="timer-section">
            <div class="timer-status ${statusClass}">
                <span class="status-dot"></span>
                <span>${phaseLabel} • ${statusText}</span>
            </div>
            ${taskDisplay}
            <div class="timer-display ${settings.allowModeSwitch ? 'timer-clickable' : ''}" ${modeClickAttr} style="--timer-bg1: ${timerBg1}; --timer-bg2: ${timerBg2};">
                <div class="timer-mode-icon">${modeIcon}</div>
                <div class="timer-time">${timeDisplay}</div>
                <div class="timer-mode-name">${getModeName(displayMode)}</div>
            </div>
            <div class="timer-buttons">
                ${buttonsHtml || `<span class="no-buttons">${escapeHtml(tr('timer.noButtons','No buttons enabled'))}</span>`}
            </div>
            ${s.timerState === 'running' ? `
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${((s.secondsElapsed / s.totalSeconds) * 100).toFixed(1)}%; background: ${timerBg1};"></div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderSettingsSection() {
    const s = state.settings;
    const locales = state.locales || [];

    let localeOptions = `<option value="auto" ${s.locale === 'auto' ? 'selected' : ''}>${escapeHtml(tr('settings.langAuto','Auto'))}</option>`;
    locales.forEach((loc) => {
        localeOptions += `<option value="${loc.id}" ${s.locale === loc.id ? 'selected' : ''}>${escapeHtml(loc.name)}</option>`;
    });

    return `
        <div class="settings-section">
            <div class="setting-row">
                <label>${escapeHtml(tr('settings.workInterval','Work interval (min)'))}</label>
                <input type="number" id="setWorkMinutes" value="${s.workMinutes}" min="1" max="180">
            </div>
            <div class="setting-row">
                <label>${escapeHtml(tr('settings.restInterval','Rest interval (min)'))}</label>
                <input type="number" id="setRestMinutes" value="${s.restMinutes}" min="1" max="60">
            </div>
            <div class="setting-row">
                <label>${escapeHtml(tr('settings.language','Interface language'))}</label>
                <select id="setLocale" onchange="onLocaleChange(this.value)">
                    ${localeOptions}
                </select>
            </div>
            <div class="setting-row">
                <label>${escapeHtml(tr('settings.displayMode','Display mode'))}</label>
                <select id="setDisplayMode">
                    <option value="0" ${s.displayMode === 0 ? 'selected' : ''}>${escapeHtml(tr('timer.mode.remaining','Remaining'))}</option>
                    <option value="1" ${s.displayMode === 1 ? 'selected' : ''}>${escapeHtml(tr('timer.mode.elapsed','Elapsed'))}</option>
                    <option value="2" ${s.displayMode === 2 ? 'selected' : ''}>${escapeHtml(tr('timer.mode.remainingOfTotal','Remaining of Total'))}</option>
                    <option value="3" ${s.displayMode === 3 ? 'selected' : ''}>${escapeHtml(tr('timer.mode.elapsedOfTotal','Elapsed of Total'))}</option>
                </select>
            </div>
            <div class="setting-row">
                <label>${escapeHtml(tr('settings.timerBgColor','Timer background'))}</label>
                <input type="color" id="setTimerBgColor1" value="${s.timerBgColor1 || '#0052CC'}">
            </div>
            <div class="setting-row">
                <label>${escapeHtml(tr('settings.statsBgColor','Statistics background'))}</label>
                <input type="color" id="setStatsBgColor1" value="${s.statsBgColor1 || '#0052CC'}">
            </div>
            <div class="setting-row checkbox-row">
                <label>
                    <span>${escapeHtml(tr('settings.allowModeSwitch','Allow mode switching'))}</span>
                    <input type="checkbox" id="setAllowModeSwitch" ${s.allowModeSwitch ? 'checked' : ''}>
                </label>
            </div>
            <div class="setting-row checkbox-row">
                <label>
                    <span>${escapeHtml(tr('settings.showPause','Show Pause button'))}</span>
                    <input type="checkbox" id="setShowPause" ${s.showPause ? 'checked' : ''}>
                </label>
            </div>
            <div class="setting-row checkbox-row">
                <label>
                    <span>${escapeHtml(tr('settings.showStop','Show Stop button'))}</span>
                    <input type="checkbox" id="setShowStop" ${s.showStop ? 'checked' : ''}>
                </label>
            </div>
            <div class="setting-row checkbox-row">
                <label>
                    <span>${escapeHtml(tr('settings.showStart','Show Start button'))}</span>
                    <input type="checkbox" id="setShowStart" ${s.showStart ? 'checked' : ''}>
                </label>
            </div>
            <div class="setting-row checkbox-row">
                <label>
                    <span>${escapeHtml(tr('settings.playSound','Play sound on complete'))}</span>
                    <input type="checkbox" id="setPlaySound" ${s.playSound ? 'checked' : ''}>
                </label>
            </div>
            <div class="setting-row checkbox-row">
                <label>
                    <span>${escapeHtml(tr('settings.warnOnPause','Warn before pausing'))}</span>
                    <input type="checkbox" id="setWarnOnPause" ${s.warnOnPause ? 'checked' : ''}>
                </label>
            </div>
            <div class="setting-row checkbox-row">
                <label>
                    <span>${escapeHtml(tr('settings.warnOnStop','Warn before stopping'))}</span>
                    <input type="checkbox" id="setWarnOnStop" ${s.warnOnStop ? 'checked' : ''}>
                </label>
            </div>
            <div class="settings-buttons">
                <button class="btn btn-primary" onclick="saveSettings()">▣ ${escapeHtml(tr('settings.save','Save'))}</button>
                <button class="btn btn-secondary" onclick="sendMessage('getInitialState')">✕ ${escapeHtml(tr('settings.cancel','Cancel'))}</button>
            </div>
        </div>
    `;
}

function renderTranslationsSection() {
    const currentLocale = state.locale || 'en';
    const builtin = state.builtin || {};
    const custom = state.customTranslations || {};
    const baseEn = builtin.en || {};
    const keys = Object.keys(baseEn).sort();
    const userForLocale = custom[currentLocale] || {};

    let rows = '';
    keys.forEach((key) => {
        const enText = baseEn[key] || '';
        const currentValue = userForLocale[key] || '';
        rows += `
            <div class="tr-row">
                <div class="tr-cell tr-en" title="${escapeHtml(enText)}">${escapeHtml(enText)}</div>
                <div class="tr-cell tr-key">${escapeHtml(key)}</div>
                <div class="tr-cell tr-val">
                    <input type="text" data-key="${escapeHtml(key)}" class="tr-input" value="${escapeHtml(currentValue)}" placeholder="${escapeHtml(enText)}">
                </div>
            </div>
        `;
    });

    return `
        <div class="translations-section">
            <p class="translations-hint">${escapeHtml(tr('settings.translationsHint','Edit translations for selected language. Empty = use English.'))}</p>
            <div class="translations-table">
                <div class="tr-row tr-header">
                    <div class="tr-cell tr-en">${escapeHtml(tr('settings.trEnglish','English'))}</div>
                    <div class="tr-cell tr-key">${escapeHtml(tr('settings.trKey','Key'))}</div>
                    <div class="tr-cell tr-val">${escapeHtml(tr('settings.trValue','Translation'))} <span class="tr-locale-tag">[${escapeHtml(currentLocale)}]</span></div>
                </div>
                ${rows}
            </div>
            <div class="settings-buttons">
                <button class="btn btn-primary" onclick="saveTranslations()">▣ ${escapeHtml(tr('settings.trSave','Save translations'))}</button>
            </div>
            <div class="settings-buttons">
                <button class="btn btn-primary" onclick="saveTranslations()">▣ ${escapeHtml(tr('settings.trSave','Save translations'))}</button>
                <button class="btn btn-secondary" onclick="exportTranslations()">⇩ ${escapeHtml(tr('settings.trExport','Export JSON'))}</button>
                <label class="btn btn-secondary" style="cursor:pointer;">
                    ⇧ ${escapeHtml(tr('settings.trImport','Import JSON'))}
                    <input type="file" accept=".json,application/json" style="display:none;" onchange="onImportFile(this)">
                </label>
            </div>
        </div>
    `;
}

function renderStatsSection() {
    const stats = computeStats();
    const total = stats.total;
    const timeWorkedFormatted = formatTime(total.timeWorked);
    const statsBg1 = state.settings.statsBgColor1 || '#0052CC';
    const statsBg2 = darkenColor(statsBg1, 0.25);

    let statsHtml = `
        <div class="stats-header">
            <div class="stats-total" style="--stats-bg1: ${statsBg1}; --stats-bg2: ${statsBg2};">
                <div class="stat-item">
                    <span class="stat-value">${total.sessions}</span>
                    <span class="stat-label">${escapeHtml(tr('stats.sessions','Sessions'))}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${total.completed}</span>
                    <span class="stat-label">${escapeHtml(tr('stats.completed','Completed'))}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${total.paused}</span>
                    <span class="stat-label">${escapeHtml(tr('stats.paused','Pauses'))}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${total.stopped}</span>
                    <span class="stat-label">${escapeHtml(tr('stats.stopped','Stops'))}</span>
                </div>
                <div class="stat-item wide">
                    <span class="stat-value">${timeWorkedFormatted}</span>
                    <span class="stat-label">${escapeHtml(tr('stats.totalTime','Total time'))}</span>
                </div>
            </div>
        </div>
    `;

    const dayGroups = {};
    (state.records || []).forEach((r) => {
        const d = new Date(r.timestamp);
        const dayKey = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
        dayGroups[dayKey].push(r);
    });

    const sortedDays = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a));

    if (sortedDays.length === 0) {
        statsHtml += `<div class="stats-empty">${escapeHtml(tr('stats.empty','No records yet'))}</div>`;
    } else {
        sortedDays.forEach((dayKey) => {
            const dayRecords = dayGroups[dayKey];
            const dayDate = new Date(dayRecords[0].timestamp);
            const dayLabel = dayDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

            const dayStarts = dayRecords.filter(r => r.action === 'start').length;
            const dayCompleted = dayRecords.filter(r => r.action === 'complete').length;
            const dayTime = dayRecords.filter(r => ['pause','stop','complete'].includes(r.action))
                .reduce((sum, r) => sum + (r.duration || 0), 0);

            statsHtml += `
                <div class="day-group">
                    <div class="day-header">
                        <span class="day-date">${dayLabel}</span>
                        <span class="day-summary">
                            ▷${dayStarts} ✓${dayCompleted} ◷${formatTime(dayTime)}
                        </span>
                    </div>
                    <div class="day-records">
            `;

            dayRecords.forEach((r) => {
                const time = new Date(r.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const taskName = r.taskName || tr('stats.noTask', '—');
                statsHtml += `
                    <div class="record-item">
                        <span class="record-time">${time}</span>
                        <span class="record-action ${getActionClass(r.action)}">${escapeHtml(getActionLabel(r.action))}</span>
                        <span class="record-task" title="${escapeHtml(r.taskIdentifier || '')}">${escapeHtml(taskName)}</span>
                        <span class="record-duration">◷ ${formatTime(r.duration || 0)}</span>
                    </div>
                `;
            });

            statsHtml += `
                    </div>
                </div>
            `;
        });
    }

    statsHtml += `
        <div class="stats-actions">
            <button class="btn btn-danger btn-small" onclick="clearStats()">✕ ${escapeHtml(tr('stats.clear','Clear statistics'))}</button>
        </div>
    `;

    return `<div class="stats-section">${statsHtml}</div>`;
}

function render() {
    let container = document.getElementById('app');
    if (!container) {
        container = document.createElement('div');
        container.id = 'app';
        document.body.appendChild(container);
    }

    container.innerHTML = `
        <div class="jop-pomidorko">
            <div class="accordion">
                <div class="accordion-header ${accordions.timer ? 'open' : ''}" onclick="toggleAccordion('timer')">
                    <span class="accordion-icon">${accordions.timer ? '▾' : '▸'}</span>
                    <span>◷ ${escapeHtml(tr('accordion.timer','Timer'))}</span>
                    ${state.timerState === 'running' ? '<span class="pulse-dot"></span>' : ''}
                </div>
                <div class="accordion-body ${accordions.timer ? 'open' : ''}">
                    ${renderTimerSection()}
                </div>
            </div>

            <div class="accordion">
                <div class="accordion-header ${accordions.settings ? 'open' : ''}" onclick="toggleAccordion('settings')">
                    <span class="accordion-icon">${accordions.settings ? '▾' : '▸'}</span>
                    <span>⚙ ${escapeHtml(tr('accordion.settings','Settings'))}</span>
                </div>
                <div class="accordion-body ${accordions.settings ? 'open' : ''}">
                    ${renderSettingsSection()}
                </div>
            </div>

            <div class="accordion">
                <div class="accordion-header ${accordions.translations ? 'open' : ''}" onclick="toggleAccordion('translations')">
                    <span class="accordion-icon">${accordions.translations ? '▾' : '▸'}</span>
                    <span>⚐ ${escapeHtml(tr('settings.translations','Translations'))}</span>
                </div>
                <div class="accordion-body ${accordions.translations ? 'open' : ''}">
                    ${renderTranslationsSection()}
                </div>
            </div>

            <div class="accordion">
                <div class="accordion-header ${accordions.stats ? 'open' : ''}" onclick="toggleAccordion('stats')">
                    <span class="accordion-icon">${accordions.stats ? '▾' : '▸'}</span>
                    <span>▦ ${escapeHtml(tr('accordion.stats','Statistics'))}</span>
                    <span class="stats-badge">${(state.records || []).length}</span>
                </div>
                <div class="accordion-body ${accordions.stats ? 'open' : ''}">
                    ${renderStatsSection()}
                </div>
            </div>
        </div>
    `;
}

function toggleAccordion(name) {
    accordions[name] = !accordions[name];
    render();
}

function cycleMode() {
    webviewApi.postMessage({ type: 'cycleMode' });
}

function sendMessage(type, data) {
    webviewApi.postMessage({ type, ...(data || {}) });
}

function onLocaleChange(newValue) {
    // Instant update: switch dictionary locally, then save
    const locale = newValue === 'auto' ? I18N.detectLocale(navigator.language) : newValue;
    state.locale = locale;
    state.dictionary = I18N.buildDict(locale, state.customTranslations || {});
    render();
    // Persist to settings
    webviewApi.postMessage({ type: 'saveSettings', settings: { locale: newValue } });
}

function saveSettings() {
    const settings = {
        workMinutes: parseInt(document.getElementById('setWorkMinutes').value) || 25,
        restMinutes: parseInt(document.getElementById('setRestMinutes').value) || 5,
        allowModeSwitch: document.getElementById('setAllowModeSwitch').checked,
        displayMode: parseInt(document.getElementById('setDisplayMode').value),
        showPause: document.getElementById('setShowPause').checked,
        showStop: document.getElementById('setShowStop').checked,
        showStart: document.getElementById('setShowStart').checked,
        playSound: document.getElementById('setPlaySound').checked,
        warnOnPause: document.getElementById('setWarnOnPause').checked,
        warnOnStop: document.getElementById('setWarnOnStop').checked,
        locale: document.getElementById('setLocale').value,
        timerBgColor1: document.getElementById('setTimerBgColor1').value,
        statsBgColor1: document.getElementById('setStatsBgColor1').value,
    };
    webviewApi.postMessage({ type: 'saveSettings', settings });
}

function saveTranslations() {
    const custom = state.customTranslations || {};
    const locale = state.locale || 'en';
    if (!custom[locale]) custom[locale] = {};

    document.querySelectorAll('.tr-input').forEach((input) => {
        const key = input.getAttribute('data-key');
        const value = input.value.trim();
        if (key) {
            if (value) custom[locale][key] = value;
            else delete custom[locale][key];
        }
    });

    state.customTranslations = custom;
    state.dictionary = I18N.buildDict(state.locale, custom);
    webviewApi.postMessage({ type: 'saveTranslations', translations: custom });
    render();
}

function exportTranslations() {
    const data = {
        plugin: 'jopPomidorko',
        version: 1,
        locale: state.locale,
        translations: state.customTranslations || {},
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'joppomidorko-translations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(tr('settings.trExported', 'Translations exported!'));
}

function onImportFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            const incoming = parsed.translations || parsed;
            const custom = state.customTranslations || {};
            Object.keys(incoming).forEach((loc) => {
                custom[loc] = Object.assign({}, custom[loc], incoming[loc]);
            });
            state.customTranslations = custom;
            state.dictionary = I18N.buildDict(state.locale, custom);
            webviewApi.postMessage({ type: 'saveTranslations', translations: custom });
            render();
            alert(tr('settings.trImported', 'Translations imported!'));
        } catch (err) {
            alert(tr('settings.trInvalid', 'Invalid translation file') + ': ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function clearStats() {
    if (confirm(tr('stats.clearConfirm', 'Clear all statistics?'))) {
        webviewApi.postMessage({ type: 'clearStatistics' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render();
    webviewApi.postMessage({ type: 'getInitialState', browserLanguage: navigator.language });
});
if (document.readyState !== 'loading') {
    render();
    webviewApi.postMessage({ type: 'getInitialState', browserLanguage: navigator.language });
}

