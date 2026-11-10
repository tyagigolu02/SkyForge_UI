import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  en: {
    translation: {
      brand: {
        title: 'SKYFORGE',
        badge: 'SPATIAL 2030',
        subtitle: 'ATMOSPHERIC NEURAL TELEMETRY',
      },
      header: {
        cacheActive: 'CACHE: ACTIVE',
        purging: 'PURGING PIPELINE...',
        redisEdge: 'REDIS EDGE · HIT',
        operatorPro: 'OPERATOR PRO // UNLIMITED',
        signInOperator: 'SIGN IN // OPERATOR',
        searchesLeft: 'SEARCHES LEFT',
        disconnect: 'DISCONNECT',
        resetQuota: 'RESET 3/3',
        coldStartNotice: 'RENDER SERVER WAKING UP...',
      },
      search: {
        placeholder: 'Query any global coordinate or station (e.g. Reykjavik, Zurich, Tokyo)...',
        button: 'SEARCH',
        transmitting: 'TRANSMITTING...',
        guestAccess: 'GUEST ACCESS',
        guestLimitLocked: 'GUEST LIMIT: 0/3 (LOCKED)',
        remaining: 'REMAINING',
        atmosphericHubs: 'ATMOSPHERIC HUBS:',
      },
      hud: {
        station: 'STATION',
        solarPeak: 'SOLAR PEAK',
        sensorSync: 'SENSOR MESH: SYNCHRONIZED',
        celsius: 'Celsius',
        fahrenheit: 'Fahrenheit',
        high: 'HIGH',
        low: 'LOW',
        feelsLike: 'FEELS LIKE',
      },
      metrics: {
        windVelocity: 'WIND VELOCITY',
        gustsTo: 'Gusts to',
        humidityIndex: 'HUMIDITY INDEX',
        uvRadiation: 'UV RADIATION',
        index: 'INDEX',
        visibility: 'VISIBILITY',
        atmosphericPressure: 'ATMOSPHERIC PRESSURE',
        isobarChamber: 'ISOBAR CHAMBER',
      },
      timeline: {
        chronoForecast: 'CHRONO-FORECAST // 24H ROTATION',
        draggable: '(DRAGGABLE GLASS TIMELINE)',
        swipeHint: 'SWIPE OR SCRUB HORIZONTALLY',
        pop: 'POP',
      },
      auth: {
        guestQuotaExhausted: 'GUEST QUOTA EXHAUSTED (3/3)',
        operatorEnclave: 'OPERATOR ENCLAVE',
        unlockPremium: 'Unlock SkyForge Premium',
        limitMessage: 'Your 3 guest telemetry queries have been exhausted. Elevate your session for unlimited queries, 4ms Redis edge bursts, and global orbital streams.',
        operatorMessage: 'Authenticate your operator identity to unlock ultra-low latency weather streams.',
        signInWithGoogle: 'SIGN IN WITH GOOGLE',
        orEmail: 'OR AUTHENTICATE VIA CREDENTIALS',
        operatorLogin: 'OPERATOR LOGIN',
        createAccount: 'CREATE ACCOUNT',
        username: 'OPERATOR USERNAME',
        email: 'NEURAL EMAIL IDENTIFIER',
        passkey: 'CRYPTOGRAPHIC PASSKEY',
        authenticating: 'AUTHENTICATING ENCLAVE...',
        loginBtn: 'INITIALIZE OPERATOR SESSION →',
        registerBtn: 'REGISTER & UNLOCK UNLIMITED →',
      },
    },
  },
  hi: {
    translation: {
      brand: {
        title: 'स्काईफोर्ज',
        badge: 'स्थानिक 2030',
        subtitle: 'वायुमंडलीय न्यूरल टेलीमेट्री',
      },
      header: {
        cacheActive: 'कैश: सक्रिय',
        purging: 'पाइपलाइन रीसेट हो रही है...',
        redisEdge: 'रेडिस एज · हिट',
        operatorPro: 'ऑपरेटर प्रो // असीमित',
        signInOperator: 'साइन इन // ऑपरेटर',
        searchesLeft: 'खोजें शेष',
        disconnect: 'डिस्कनेक्ट',
        resetQuota: 'रीसेट 3/3',
        coldStartNotice: 'सर्वर प्रारंभ हो रहा है...',
      },
      search: {
        placeholder: 'किसी भी शहर या स्टेशन को खोजें (उदा. दिल्ली, मुंबई, टोक्यो)...',
        button: 'खोजें',
        transmitting: 'खोज जारी...',
        guestAccess: 'अतिथि पहुंच',
        guestLimitLocked: 'अतिथि सीमा: 0/3 (लॉक)',
        remaining: 'शेष',
        atmosphericHubs: 'वायुमंडलीय केंद्र:',
      },
      hud: {
        station: 'स्टेशन',
        solarPeak: 'सौर शिखर',
        sensorSync: 'सेंसर जाल: सिंक किया गया',
        celsius: 'सेल्सियस',
        fahrenheit: 'फ़ारेनहाइट',
        high: 'अधिकतम',
        low: 'न्यूनतम',
        feelsLike: 'महसूस',
      },
      metrics: {
        windVelocity: 'हवा का वेग',
        gustsTo: 'झोंके',
        humidityIndex: 'आर्द्रता सूचकांक',
        uvRadiation: 'यूवी विकिरण',
        index: 'सूचकांक',
        visibility: 'दृश्यता',
        atmosphericPressure: 'वायुमंडलीय दबाव',
        isobarChamber: 'आइसोबार कक्ष',
      },
      timeline: {
        chronoForecast: 'समय-पूर्वानुमान // 24 घंटे चक्र',
        draggable: '(ड्रैग करने योग्य ग्लास टाइमलाइन)',
        swipeHint: 'क्षैतिज रूप से स्वाइप या स्क्रॉल करें',
        pop: 'बारिश %',
      },
      auth: {
        guestQuotaExhausted: 'अतिथि कोटा समाप्त (3/3)',
        operatorEnclave: 'ऑपरेटर एन्क्लेव',
        unlockPremium: 'स्काईफोर्ज प्रीमियम अनलॉक करें',
        limitMessage: 'आपकी 3 अतिथि खोज सीमा समाप्त हो चुकी है। असीमित खोज, 4ms रेडिस एज कैश और वैश्विक उपग्रह टेलीमेट्री के लिए साइन इन करें।',
        operatorMessage: 'अल्ट्रा-लो लेटेंसी मौसम स्ट्रीम अनलॉक करने के लिए अपनी पहचान प्रमाणित करें।',
        signInWithGoogle: 'गूगल से साइन इन करें',
        orEmail: 'या क्रेडेंशियल से प्रमाणित करें',
        operatorLogin: 'ऑपरेटर लॉगिन',
        createAccount: 'खाता बनाएं',
        username: 'ऑपरेटर यूज़रनेम',
        email: 'न्यूरल ईमेल पता',
        passkey: 'क्रिप्टोग्राफ़िक पासकी',
        authenticating: 'प्रमाणीकरण जारी...',
        loginBtn: 'ऑपरेटर सत्र प्रारंभ करें →',
        registerBtn: 'पंजीकरण करें और अनलॉक करें →',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

