import joplin from './api';
import { SettingItemType } from './api/types';
const i18n = require('./i18n-data');

const { LOCALES, BUILTIN, buildDict, detectLocale, t } = i18n;

interface PomodoroRecord {
    id: string;
    timestamp: number;
    action: 'start' | 'pause' | 'resume' | 'stop' | 'complete';
    taskName: string;
    taskIdentifier: string;
    taskUrl: string;
    duration: number;
    workInterval: number;
    restInterval: number;
}

interface PluginSettings {
    workMinutes: number;
    restMinutes: number;
    allowModeSwitch: boolean;
    displayMode: number;
    showPause: boolean;
    showStop: boolean;
    showStart: boolean;
    playSound: boolean;
    warnOnPause: boolean;
    warnOnStop: boolean;
    statistics: string;
    locale: string;
    customTranslations: string;
    timerBgColor1: string;
    statsBgColor1: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
    workMinutes: 25,
    restMinutes: 5,
    allowModeSwitch: true,
    displayMode: 3,
    showPause: true,
    showStop: true,
    showStart: true,
    playSound: true,
    warnOnPause: false,
    warnOnStop: true,
    statistics: '[]',
    locale: 'auto',
    customTranslations: '{}',
    timerBgColor1: '#0052CC',
    statsBgColor1: '#0052CC',
};

joplin.plugins.register({
    onStart: async function() {
        console.log('🍅 [JopPomidorko] Plugin starting...');

        await joplin.settings.registerSettings({
            workMinutes: { value: DEFAULT_SETTINGS.workMinutes, type: SettingItemType.Int, public: false, label: 'Work interval (minutes)' },
            restMinutes: { value: DEFAULT_SETTINGS.restMinutes, type: SettingItemType.Int, public: false, label: 'Rest interval (minutes)' },
            allowModeSwitch: { value: DEFAULT_SETTINGS.allowModeSwitch, type: SettingItemType.Bool, public: false, label: 'Allow mode switch' },
            displayMode: { value: DEFAULT_SETTINGS.displayMode, type: SettingItemType.Int, public: false, label: 'Display mode' },
            showPause: { value: DEFAULT_SETTINGS.showPause, type: SettingItemType.Bool, public: false, label: 'Show pause button' },
            showStop: { value: DEFAULT_SETTINGS.showStop, type: SettingItemType.Bool, public: false, label: 'Show stop button' },
            showStart: { value: DEFAULT_SETTINGS.showStart, type: SettingItemType.Bool, public: false, label: 'Show start button' },
            playSound: { value: DEFAULT_SETTINGS.playSound, type: SettingItemType.Bool, public: false, label: 'Play sound' },
            warnOnPause: { value: DEFAULT_SETTINGS.warnOnPause, type: SettingItemType.Bool, public: false, label: 'Warn on pause' },
            warnOnStop: { value: DEFAULT_SETTINGS.warnOnStop, type: SettingItemType.Bool, public: false, label: 'Warn on stop' },
            statistics: { value: DEFAULT_SETTINGS.statistics, type: SettingItemType.String, public: false, label: 'Statistics data' },
            locale: { value: DEFAULT_SETTINGS.locale, type: SettingItemType.String, public: false, label: 'Locale' },
            customTranslations: { value: DEFAULT_SETTINGS.customTranslations, type: SettingItemType.String, public: false, label: 'Custom translations' },
            timerBgColor1: { value: DEFAULT_SETTINGS.timerBgColor1, type: SettingItemType.String, public: false, label: 'Timer background color' },
            statsBgColor1: { value: DEFAULT_SETTINGS.statsBgColor1, type: SettingItemType.String, public: false, label: 'Stats background color' },
        });

        console.log('🍅 [JopPomidorko] Creating panel...');
        const panel = await joplin.views.panels.create('jopPomidorko_panel');
        await joplin.views.panels.addScript(panel, './i18n-data.js');
        await joplin.views.panels.addScript(panel, './webview.css');
        await joplin.views.panels.addScript(panel, './webview.js');

        try {
            await joplin.views.panels.show(panel);
            const isVisible = await joplin.views.panels.visible(panel);
            console.log('🍅 [JopPomidorko] Panel visible:', isVisible);
        } catch (e) {
            console.error('🍅 [JopPomidorko] Error showing panel:', e);
        }

        await joplin.commands.register({
            name: 'toggleJopPomidorko',
            label: 'JopPomidorko - Toggle Timer',
            execute: async () => {
                const isVisible = await joplin.views.panels.visible(panel);
                await joplin.views.panels.show(panel, !isVisible);
            },
        });

        await joplin.views.toolbarButtons.create(
            'jopPomidorkoButton',
            'toggleJopPomidorko',
            'fa-clock-o'
        );

        let timerState: 'idle' | 'running' | 'paused' = 'idle';
        let timerInterval: NodeJS.Timeout | null = null;
        let secondsElapsed = 0;
        let totalSeconds = DEFAULT_SETTINGS.workMinutes * 60;
        let currentTask = { name: '', identifier: '', url: '' };
        let currentSettings: PluginSettings = { ...DEFAULT_SETTINGS };
        let browserLanguage = '';
        let phase: 'work' | 'rest' = 'work';

        async function resolveLocale(): Promise<string> {
            const chosen = currentSettings.locale;
            if (chosen && chosen !== 'auto') return chosen;
            try {
                const joplinLocale = await joplin.settings.globalValue('locale');
                if (joplinLocale) return detectLocale(joplinLocale);
            } catch (e) {}
            if (browserLanguage) return detectLocale(browserLanguage);
            return 'en';
        }

        async function loadSettings(): Promise<PluginSettings> {
            const settings: PluginSettings = {
                workMinutes: await joplin.settings.value('workMinutes') as number,
                restMinutes: await joplin.settings.value('restMinutes') as number,
                allowModeSwitch: await joplin.settings.value('allowModeSwitch') as boolean,
                displayMode: await joplin.settings.value('displayMode') as number,
                showPause: await joplin.settings.value('showPause') as boolean,
                showStop: await joplin.settings.value('showStop') as boolean,
                showStart: await joplin.settings.value('showStart') as boolean,
                playSound: await joplin.settings.value('playSound') as boolean,
                warnOnPause: await joplin.settings.value('warnOnPause') as boolean,
                warnOnStop: await joplin.settings.value('warnOnStop') as boolean,
                statistics: await joplin.settings.value('statistics') as string,
                locale: (await joplin.settings.value('locale') as string) || 'auto',
                customTranslations: (await joplin.settings.value('customTranslations') as string) || '{}',
                timerBgColor1: (await joplin.settings.value('timerBgColor1') as string) || '#0052CC',
                statsBgColor1: (await joplin.settings.value('statsBgColor1') as string) || '#0052CC',
            };
            currentSettings = settings;
            return settings;
        }

        async function saveStatistics(records: PomodoroRecord[]) {
            await joplin.settings.setValue('statistics', JSON.stringify(records));
        }

        function getRecords(): PomodoroRecord[] {
            try {
                return JSON.parse(currentSettings.statistics);
            } catch {
                return [];
            }
        }

        function formatTime(seconds: number): string {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        function syncTotals() {
            if (timerState === 'idle') {
                totalSeconds = (phase === 'work' ? currentSettings.workMinutes : currentSettings.restMinutes) * 60;
                secondsElapsed = 0;
            }
        }

        function addRecord(action: 'start' | 'pause' | 'resume' | 'stop' | 'complete') {
            const records = getRecords();
            const record: PomodoroRecord = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                timestamp: Date.now(),
                action,
                taskName: currentTask.name,
                taskIdentifier: currentTask.identifier,
                taskUrl: currentTask.url,
                duration: secondsElapsed,
                workInterval: currentSettings.workMinutes,
                restInterval: currentSettings.restMinutes,
            };
            records.unshift(record);
            saveStatistics(records);
        }

        async function getSelectedNoteInfo() {
            try {
                const note = await joplin.workspace.selectedNote();
                if (note) {
                    return {
                        name: note.title || t(await getDictionary(), 'dialog.defaultTaskName', 'Untitled'),
                        identifier: note.id,
                        url: `joplin://${note.id}`,
                    };
                }
            } catch (e) {
                console.error('Error getting selected note:', e);
            }
            return { name: '', identifier: '', url: '' };
        }

        async function getDictionary() {
            const locale = await resolveLocale();
            let custom: Record<string, Record<string, string>> = {};
            try { custom = JSON.parse(currentSettings.customTranslations); } catch {}
            return buildDict(locale, custom);
        }

        async function showTaskDialog() {
            const noteInfo = await getSelectedNoteInfo();
            const dict = await getDictionary();

            const dialog = await joplin.views.dialogs.create('jopPomidorko_taskDialog');
            await joplin.views.dialogs.setHtml(dialog, `
                <div style="font-family: var(--joplin-font-family); padding: 10px;">
                    <h3 style="color:#505F79;">${t(dict, 'dialog.title')}</h3>
                    <p style="margin-bottom:12px; color: #505F79; opacity:0.7;">
                        ${t(dict, 'dialog.hint')}
                    </p>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; margin-bottom:4px; font-weight:600; color:#505F79;">${t(dict, 'dialog.taskName')}:</label>
                        <input type="text" id="taskName" value="${noteInfo.name}" style="width:100%; padding:6px; border:1px solid #DFE1E6; border-radius:4px; color:#505F79;">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; margin-bottom:4px; font-weight:600; color:#505F79;">${t(dict, 'dialog.identifier')}:</label>
                        <input type="text" id="taskIdentifier" value="${noteInfo.identifier}" style="width:100%; padding:6px; border:1px solid #DFE1E6; border-radius:4px; color:#505F79;">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; margin-bottom:4px; font-weight:600; color:#505F79;">${t(dict, 'dialog.url')}:</label>
                        <input type="text" id="taskUrl" value="${noteInfo.url}" style="width:100%; padding:6px; border:1px solid #DFE1E6; border-radius:4px; color:#505F79;">
                    </div>
                    <p style="color:#505F79; opacity:0.6; font-size:0.85em;">
                        ${t(dict, 'dialog.emptyHint')}
                    </p>
                </div>
            `);
            await joplin.views.dialogs.setButtons(dialog, [
                { id: 'ok', title: `▷ ${t(dict, 'dialog.launch')}` },
                { id: 'cancel', title: t(dict, 'dialog.cancel') },
            ]);

            const result = await joplin.views.dialogs.open(dialog);
            if (result.id === 'ok') {
                const formData = result.formData || {};
                return {
                    confirmed: true,
                    taskName: formData.taskName || '',
                    taskIdentifier: formData.taskIdentifier || '',
                    taskUrl: formData.taskUrl || '',
                };
            }
            return { confirmed: false, taskName: '', taskIdentifier: '', taskUrl: '' };
        }

        async function updatePanel() {
            try {
                const settings = await loadSettings();
                const records = getRecords();
                const remaining = Math.max(0, totalSeconds - secondsElapsed);
                const locale = await resolveLocale();
                const dict = await getDictionary();
                let custom: Record<string, Record<string, string>> = {};
                try { custom = JSON.parse(settings.customTranslations); } catch {}

                await joplin.views.panels.postMessage(panel, {
                    type: 'update',
                    state: {
                        timerState,
                        phase,
                        secondsElapsed,
                        totalSeconds,
                        remaining,
                        formattedElapsed: formatTime(secondsElapsed),
                        formattedRemaining: formatTime(remaining),
                        formattedTotal: formatTime(totalSeconds),
                        currentTask,
                        settings,
                        records: records.slice(0, 200),
                        locale,
                        dictionary: dict,
                        locales: LOCALES,
                        builtin: BUILTIN,
                        customTranslations: custom,
                    },
                });
            } catch (e) {
                console.error('Error updating panel:', e);
            }
        }

        function startTimerInterval() {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (timerState === 'running') {
                    secondsElapsed++;
                    if (secondsElapsed >= totalSeconds) {
                        clearInterval(timerInterval!);
                        timerInterval = null;
                        timerState = 'idle';
                        addRecord('complete');
                        // Переключаем фазу: работа -> отдых, отдых -> работа
                        phase = (phase === 'work') ? 'rest' : 'work';
                        syncTotals();
                        updatePanel();
                        joplin.views.panels.postMessage(panel, { type: 'playSound' });
                        return;
                    }
                    updatePanel();
                }
            }, 1000);
        }

        async function startTimer() {
            if (timerState === 'running') return;

            if (timerState === 'idle') {
                const result = await showTaskDialog();
                if (!result.confirmed) return;
                currentTask = {
                    name: result.taskName,
                    identifier: result.taskIdentifier,
                    url: result.taskUrl,
                };
                totalSeconds = (phase === 'work' ? currentSettings.workMinutes : currentSettings.restMinutes) * 60;
                secondsElapsed = 0;
                addRecord('start');
            } else if (timerState === 'paused') {
                addRecord('resume');
            }

            timerState = 'running';
            startTimerInterval();
            await updatePanel();
        }

        async function pauseTimer() {
            if (timerState !== 'running') return;
            const dict = await getDictionary();

            if (currentSettings.warnOnPause) {
                const dialog = await joplin.views.dialogs.showMessageBox(t(dict, 'confirm.pause'));
                if (dialog !== 0) return;
            }

            timerState = 'paused';
            addRecord('pause');
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            await updatePanel();
        }

        async function stopTimer() {
            if (timerState === 'idle') return;
            const dict = await getDictionary();

            if (currentSettings.warnOnStop) {
                const dialog = await joplin.views.dialogs.showMessageBox(t(dict, 'confirm.stop'));
                if (dialog !== 0) return;
            }

            addRecord('stop');
            timerState = 'idle';
            phase = 'work';
            syncTotals();
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            await updatePanel();
        }

        async function saveSettings(newSettings: Partial<PluginSettings>) {
            const keys: (keyof PluginSettings)[] = [
                'workMinutes', 'restMinutes', 'allowModeSwitch', 'displayMode',
                'showPause', 'showStop', 'showStart', 'playSound',
                'warnOnPause', 'warnOnStop', 'locale', 'customTranslations',
                'timerBgColor1', 'statsBgColor1',
            ];
            for (const k of keys) {
                if (newSettings[k] !== undefined) {
                    await joplin.settings.setValue(k, newSettings[k]);
                }
            }
            await loadSettings();
            syncTotals();
            await updatePanel();
        }

        await joplin.views.panels.onMessage(panel, async (message: any) => {
            try {
                switch (message.type) {
                    case 'start': await startTimer(); break;
                    case 'pause': await pauseTimer(); break;
                    case 'stop': await stopTimer(); break;
                    case 'resume':
                        if (timerState === 'paused') {
                            timerState = 'running';
                            addRecord('resume');
                            startTimerInterval();
                            await updatePanel();
                        }
                        break;
                    case 'saveSettings': await saveSettings(message.settings); break;
                    case 'saveTranslations':
                        await joplin.settings.setValue('customTranslations', JSON.stringify(message.translations || {}));
                        await loadSettings();
                        await updatePanel();
                        break;
                    case 'cycleMode':
                        if (currentSettings.allowModeSwitch) {
                            const newMode = (currentSettings.displayMode + 1) % 4;
                            await joplin.settings.setValue('displayMode', newMode);
                            await loadSettings();
                            await updatePanel();
                        }
                        break;
                    case 'clearStatistics':
                        const dict = await getDictionary();
                        const confirmResult = await joplin.views.dialogs.showMessageBox(t(dict, 'stats.clearConfirm'));
                        if (confirmResult === 0) {
                            await saveStatistics([]);
                            await updatePanel();
                        }
                        break;
                    case 'getInitialState':
                        if (message.browserLanguage) browserLanguage = message.browserLanguage;
                        await updatePanel();
                        break;
                }
            } catch (e) {
                console.error('Error handling message:', e);
            }
        });

        await loadSettings();
        syncTotals();
        await updatePanel();
    },
});
