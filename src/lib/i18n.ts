import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      dashboard: {
        greeting: "Good {{greeting}}, {{name}}",
        liveBio: "Live Bio-Metrics",
        syncActive: "Smartwatch Sync Active",
        recoveryScore: "Recovery Score",
        highStrain: "High Strain Detected",
        auraQuests: "Aura Quests",
        dailyChallenges: "Daily Challenges",
        hitProtein: "Hit Protein Goal",
        completeWorkout: "Complete Workout",
        logWater: "Log 4L Water",
        credits: "Credits",
        streak: "d Streak",
        protein: "Protein",
        calories: "Calories",
        water: "Water",
        steps: "Steps"
      }
    }
  },
  hi: {
    translation: {
      dashboard: {
        greeting: "नमस्ते, {{name}}",
        liveBio: "लाइव बायो-मेट्रिक्स",
        syncActive: "स्मार्टवॉच सिंक सक्रिय",
        recoveryScore: "रिकवरी स्कोर",
        highStrain: "उच्च तनाव का पता चला",
        auraQuests: "ऑरा क्वेस्ट",
        dailyChallenges: "दैनिक चुनौतियां",
        hitProtein: "प्रोटीन लक्ष्य प्राप्त करें",
        completeWorkout: "कसरत पूरी करें",
        logWater: "4 लीटर पानी लॉग करें",
        credits: "क्रेडिट",
        streak: "दिन की निरंतरता",
        protein: "प्रोटीन",
        calories: "कैलोरी",
        water: "पानी",
        steps: "कदम"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
