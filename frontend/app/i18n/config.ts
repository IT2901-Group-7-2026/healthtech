// src/i18n/config.ts

// Core i18next library.
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
// Bindings for React: allow components to
// re-render when language changes.
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import no from "./locales/no.json";

export const resources = {
	en: { translation: en },
	no: { translation: no },
};

i18n.use(LanguageDetector)
	// Add React bindings as a plugin.
	.use(initReactI18next)
	// Initialize the i18next instance.
	.init({
		// Config options
		resources,

		// Specifies the default language (locale) used
		// when a user visits our site for the first time.
		// We use English here, but feel free to use
		// whichever locale you want.
		lng: "en",

		// Fallback locale used when a translation is
		// missing in the active locale. Again, use your
		// preferred locale here.
		fallbackLng: "en",

		// Enables useful output in the browser’s
		// dev console.
		debug: import.meta.env.DEV,

		// Normally, we want `escapeValue: true` as it
		// ensures that i18next escapes any code in
		// translation messages, safeguarding against
		// XSS (cross-site scripting) attacks. However,
		// React does this escaping itself, so we turn
		// it off in i18next.
		interpolation: {
			escapeValue: false,
		},

		// Translation messages. Add any languages
		// you want here.
	});

export const i18nInstance = i18n;
