import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import no from "./locales/no.json";

export const resources = {
	en: { translation: en },
	no: { translation: no },
};

i18n.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		load: "languageOnly",
		debug: import.meta.env.DEV, // Enables debug mode in development
		supportedLngs: Object.keys(resources),

		// Normally, we want `escapeValue: true` as it ensures that i18next escapes any code in translation messages,
		// safeguarding against XSS (cross-site scripting) attacks. However, React does this escaping itself, so we turn
		// it off in i18next.
		interpolation: {
			escapeValue: false,
		},

		detection: {
			order: ["localStorage", "navigator"],
			caches: ["localStorage"],
			lookupLocalStorage: "i18nextLng",

			// en-US → en
			convertDetectedLanguage: (language) => language.replace(/-.*/, ""),
		},
	});

export const i18nInstance = i18n;
