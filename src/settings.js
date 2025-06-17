import { en } from './locales/en.js';
import { es } from './locales/es.js';

let onLanguageChangeCallback = () => { };

const languages = {
    en: { name: 'English', pack: en },
    es: { name: 'Español', pack: es },
};

let currentLanguageCode = 'en';

export function setLanguage(langCode) {
    if (languages[langCode]) {
        currentLanguageCode = langCode;
        onLanguageChangeCallback();
    }
}

export function subscribe(callback) {
    onLanguageChangeCallback = callback;
}

export const settings = {
    get language() {
        return languages[currentLanguageCode].pack;
    },
    get currentLanguageCode() {
        return currentLanguageCode;
    },
    get availableLanguages() {
        return languages;
    }
};
