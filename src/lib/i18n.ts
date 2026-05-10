interface Translation {
  [key: string]: {
    English: string;
    Hindi: string;
  };
}

export const translations: Translation = {
  emergency_sos: {
    English: "Emergency SOS",
    Hindi: "आपातकालीन SOS"
  },
  sending: {
    English: "Sending...",
    Hindi: "भेजा जा रहा है..."
  },
  doses_remaining: {
    English: "Doses Remaining",
    Hindi: "खुराक शेष"
  },
  full_registry: {
    English: "Full Registry",
    Hindi: "पूर्ण रजिस्ट्री"
  },
  todays_schedule: {
    English: "Today's Schedule",
    Hindi: "आज की समय सारणी"
  },
  adherence_history: {
    English: "Adherence History",
    Hindi: "अनुपालन इतिहास"
  },
  add_med: {
    English: "Add Med",
    Hindi: "दवा जोड़ें"
  },
  scan_rx: {
    English: "Scan RX",
    Hindi: "पर्चा स्कैन करें"
  },
  clinical: {
    English: "Clinical",
    Hindi: "क्लिनिकल"
  },
  history: {
    English: "History",
    Hindi: "इतिहास"
  },
  chat: {
    English: "Chat",
    Hindi: "चैट"
  },
  alerts: {
    English: "Alerts",
    Hindi: "सूचनाएं"
  },
  elderly_mode: {
    English: "Elderly Mode",
    Hindi: "बुजुर्ग मोड"
  },
  health_narrative: {
    English: "Health Narrative",
    Hindi: "स्वास्थ्य विवरण"
  },
  risk_gauge_label: {
    English: "Adherence Risk Gauge",
    Hindi: "अनुपालन जोखिम गेज"
  },
  refill_alert: {
    English: "Refill Alert",
    Hindi: "रिफिल अलर्ट"
  },
  order_refill: {
    English: "Order Refill",
    Hindi: "रिफिल ऑर्डर करें"
  },
  fetching_briefing: {
    English: "Gathering adherence vectors for health projection...",
    Hindi: "स्वास्थ्य प्रक्षेपण के लिए डेटा एकत्र किया जा रहा है..."
  },
  no_doses: {
    English: "No doses found",
    Hindi: "कोई खुराक नहीं मिली"
  },
  no_doses_desc: {
    English: "Your medication schedule is currently empty. Add your first medication or use demo data to explore features.",
    Hindi: "आपकी दवा अनुसूची वर्तमान में खाली है। अपनी पहली दवा जोड़ें या डेमो डेटा का उपयोग करें।"
  },
  seed_demo: {
    English: "Seed Demo Environment",
    Hindi: "डेमो वातावरण शुरू करें"
  },
  sos_transmitting: {
    English: "SOS Signal Transmitting",
    Hindi: "एसओएस सिग्नल भेज रहा है"
  },
  sos_desc: {
    English: "Emergency responders and your caregiver circle are being notified with your current clinical profile.",
    Hindi: "आपातकालीन प्रतिक्रियाकर्ताओं और आपके देखभालकर्ता सर्कल को आपके वर्तमान प्रोफ़ाइल के साथ सूचित किया जा रहा है।"
  },
  cancel_alert: {
    English: "Cancel Alert",
    Hindi: "अलर्ट रद्द करें"
  },
  reminder_settings: {
    English: "Reminder Settings",
    Hindi: "अनुस्मारक सेटिंग्स"
  },
  reminder_sound: {
    English: "Reminder Sound",
    Hindi: "अनुस्मारक ध्वनि"
  },
  vibration_pattern: {
    English: "Vibration Pattern",
    Hindi: "कंपन पैटर्न"
  },
  save_settings: {
    English: "Save Settings",
    Hindi: "सेटिंग्स सहेजें"
  },
  test_reminder: {
    English: "Test Reminder",
    Hindi: "परीक्षण अनुस्मारक"
  }
};

export function t(key: string, lang: "English" | "Hindi") {
  return translations[key]?.[lang] || key;
}
