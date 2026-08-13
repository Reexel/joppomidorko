var LOCALES = [
    { id: 'en', name: 'English' },
    { id: 'ru', name: 'Русский' },
    { id: 'de', name: 'Deutsch' },
    { id: 'es', name: 'Español' },
    { id: 'pt', name: 'Português' },
    { id: 'fr', name: 'Français' },
    { id: 'sr', name: 'Српски' },
    { id: 'zh', name: '中文' },
    { id: 'ja', name: '日本語' },
];

var BUILTIN = {
    en: {
        'timer.status.ready': 'Ready',
        'timer.status.running': 'Running',
        'timer.status.paused': 'Paused',
        'timer.mode.remaining': 'Remaining',
        'timer.mode.elapsed': 'Elapsed',
        'timer.mode.remainingOfTotal': 'Remaining of Total',
        'timer.mode.elapsedOfTotal': 'Elapsed of Total',
        'timer.btn.start': 'Start',
        'timer.btn.continue': 'Continue',
        'timer.btn.pause': 'Pause',
        'timer.btn.stop': 'Stop',
        'timer.modeSwitchHint': 'Click to switch mode',
        'timer.modeSwitchDisabled': 'Mode switching disabled',
        'timer.noButtons': 'No buttons enabled in settings',
        'dialog.title': 'Start Pomodoro',
        'dialog.hint': 'Specify the task you will work on. You may leave it empty.',
        'dialog.taskName': 'Task name',
        'dialog.identifier': 'Note UUID',
        'dialog.url': 'Note URL',
        'dialog.emptyHint': 'If all fields are empty — task won\'t be tracked in statistics.',
        'dialog.launch': 'Launch',
        'dialog.cancel': 'Cancel',
        'dialog.defaultTaskName': 'Untitled',
        'confirm.pause': 'Are you sure you want to pause the timer?',
        'confirm.stop': 'Are you sure you want to stop the timer? Progress will be lost.',
        'settings.title': 'Settings',
        'settings.workInterval': 'Work interval (min)',
        'settings.restInterval': 'Rest interval (min)',
        'settings.allowModeSwitch': 'Allow switching display modes',
        'settings.displayMode': 'Display mode',
        'settings.showPause': 'Show Pause button',
        'settings.showStop': 'Show Stop button',
        'settings.showStart': 'Show Start button',
        'settings.playSound': 'Play sound on completion',
        'settings.warnOnPause': 'Warn before pausing',
        'settings.warnOnStop': 'Warn before stopping',
        'settings.language': 'Interface language',
        'settings.langAuto': 'Auto (use Joplin language)',
        'settings.timerBgColor': 'Timer background',
        'settings.statsBgColor': 'Statistics background',
        'settings.save': 'Save',
        'settings.cancel': 'Cancel',
        'settings.translations': 'Custom translations',
        'settings.translationsHint': 'Edit translations for the selected language. Empty fields fall back to English.',
        'settings.trEnglish': 'English',
        'settings.trKey': 'Key',
        'settings.trValue': 'Translation',
        'settings.trSave': 'Save translations',
        'settings.trSaved': 'Translations saved',
        'settings.trExport': 'Export JSON',
        'settings.trImport': 'Import JSON',
        'settings.trImported': 'Translations imported!',
        'settings.trExported': 'Translations exported!',
        'settings.trInvalid': 'Invalid translation file',
        'stats.title': 'Statistics',
        'stats.sessions': 'Sessions',
        'stats.completed': 'Completed',
        'stats.paused': 'Pauses',
        'stats.stopped': 'Stops',
        'stats.totalTime': 'Total time',
        'stats.empty': 'No records yet. Start your first pomodoro!',
        'stats.clear': 'Clear statistics',
        'stats.clearConfirm': 'Are you sure you want to clear all statistics?',
        'stats.action.start': 'Start',
        'stats.action.pause': 'Pause',
        'stats.action.resume': 'Resume',
        'stats.action.stop': 'Stop',
        'stats.action.complete': 'Completed',
        'stats.noTask': '—',
        'accordion.timer': 'Timer',
        'accordion.settings': 'Settings',
        'accordion.stats': 'Statistics',
        'timer.phase.work': 'Work',
        'timer.phase.rest': 'Break',
    },
    ru: {
        'timer.status.ready': 'Готов',
        'timer.status.running': 'Работает',
        'timer.status.paused': 'На паузе',
        'timer.mode.remaining': 'Осталось',
        'timer.mode.elapsed': 'Прошло',
        'timer.mode.remainingOfTotal': 'Осталось из Задано',
        'timer.mode.elapsedOfTotal': 'Прошло из Задано',
        'timer.btn.start': 'Старт',
        'timer.btn.continue': 'Продолжить',
        'timer.btn.pause': 'Пауза',
        'timer.btn.stop': 'Стоп',
        'timer.modeSwitchHint': 'Кликните для переключения режима',
        'timer.modeSwitchDisabled': 'Переключение отключено',
        'timer.noButtons': 'Нет активных кнопок в настройках',
        'dialog.title': 'Запуск Помидоро',
        'dialog.hint': 'Укажите задачу, над которой будете работать. Можно оставить пустым.',
        'dialog.taskName': 'Название задачи',
        'dialog.identifier': 'Идентификатор (UUID заметки)',
        'dialog.url': 'URL заметки',
        'dialog.emptyHint': 'Если все поля пустые — задача не будет зафиксирована в статистике.',
        'dialog.launch': 'Запустить',
        'dialog.cancel': 'Отмена',
        'dialog.defaultTaskName': 'Без названия',
        'confirm.pause': 'Вы уверены, что хотите поставить таймер на паузу?',
        'confirm.stop': 'Вы уверены, что хотите остановить таймер? Прогресс будет сброшен.',
        'settings.title': 'Настройки',
        'settings.workInterval': 'Интервал работы (мин)',
        'settings.restInterval': 'Интервал отдыха (мин)',
        'settings.allowModeSwitch': 'Позволить переключать режимы отображения',
        'settings.displayMode': 'Режим отображения',
        'settings.showPause': 'Отображать кнопку «Пауза»',
        'settings.showStop': 'Отображать кнопку «Стоп»',
        'settings.showStart': 'Отображать кнопку «Старт»',
        'settings.playSound': 'Проигрывать звук по завершении',
        'settings.warnOnPause': 'Предупреждать о нажатии «Пауза»',
        'settings.warnOnStop': 'Предупреждать о нажатии «Стоп»',
        'settings.language': 'Язык интерфейса',
        'settings.langAuto': 'Авто (язык Joplin)',
        'settings.timerBgColor': 'Фон таймера',
        'settings.statsBgColor': 'Фон статистики',
        'settings.save': 'Сохранить',
        'settings.cancel': 'Отмена',
        'settings.translations': 'Пользовательские переводы',
        'settings.translationsHint': 'Отредактируйте переводы для выбранного языка. Пустые поля подставятся из английского.',
        'settings.trEnglish': 'Английский',
        'settings.trKey': 'Ключ',
        'settings.trValue': 'Перевод',
        'settings.trSave': 'Сохранить переводы',
        'settings.trSaved': 'Переводы сохранены',
        'settings.trExport': 'Экспорт JSON',
        'settings.trImport': 'Импорт JSON',
        'settings.trImported': 'Переводы импортированы!',
        'settings.trExported': 'Переводы экспортированы!',
        'settings.trInvalid': 'Некорректный файл переводов',
        'stats.title': 'Статистика',
        'stats.sessions': 'Сессий',
        'stats.completed': 'Завершено',
        'stats.paused': 'Пауз',
        'stats.stopped': 'Остановок',
        'stats.totalTime': 'Всего времени',
        'stats.empty': 'Нет записей. Запустите первый помидоро!',
        'stats.clear': 'Очистить статистику',
        'stats.clearConfirm': 'Вы уверены, что хотите очистить всю статистику?',
        'stats.action.start': 'Старт',
        'stats.action.pause': 'Пауза',
        'stats.action.resume': 'Возобновление',
        'stats.action.stop': 'Стоп',
        'stats.action.complete': 'Завершено',
        'stats.noTask': '—',
        'accordion.timer': 'Таймер',
        'accordion.settings': 'Настройки',
        'accordion.stats': 'Статистика',
        'timer.phase.work': 'Работа',
        'timer.phase.rest': 'Отдых',
    },
    de: {}, es: {}, pt: {}, fr: {}, sr: {}, zh: {}, ja: {},
};

function detectLocale(joplinLocale) {
    var l = String(joplinLocale || '').toLowerCase();
    var prefs = ['ru', 'de', 'es', 'pt', 'fr', 'sr', 'zh', 'ja'];
    for (var i = 0; i < prefs.length; i++) {
        if (l.indexOf(prefs[i]) === 0) return prefs[i];
    }
    return 'en';
}

function buildDict(locale, custom) {
    var base = BUILTIN.en || {};
    var lang = BUILTIN[locale] || {};
    var user = (custom && custom[locale]) || {};
    var result = {};
    var key;
    for (key in base) { if (base.hasOwnProperty(key)) result[key] = base[key]; }
    for (key in lang) { if (lang.hasOwnProperty(key) && lang[key]) result[key] = lang[key]; }
    for (key in user) { if (user.hasOwnProperty(key) && user[key]) result[key] = user[key]; }
    return result;
}

function t(dict, key, fallback) {
    if (dict && dict[key]) return dict[key];
    if (BUILTIN.en && BUILTIN.en[key]) return BUILTIN.en[key];
    return fallback !== undefined ? fallback : key;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LOCALES: LOCALES, BUILTIN: BUILTIN, buildDict: buildDict, detectLocale: detectLocale, t: t };
} else if (typeof window !== 'undefined') {
    window.PomidorkoI18n = { LOCALES: LOCALES, BUILTIN: BUILTIN, buildDict: buildDict, detectLocale: detectLocale, t: t };
}
