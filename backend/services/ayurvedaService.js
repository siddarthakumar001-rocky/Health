/**
 * Ayurvedic Suggestion Engine
 * Maps health conditions to traditional Ayurvedic remedies and lifestyle tips.
 */

const DISCLOSURE = "NOTE: These are holistic wellness suggestions based on traditional Ayurvedic principles. They are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a certified healthcare practitioner before starting any new supplement or treatment.";

const MAPPINGS = {
  "High Stress": {
    medicines: [
      { name: "Ashwagandha (Withania somnifera)", benefit: "Adaptogen that helps the body manage stress and cortisol levels." },
      { name: "Brahmi (Bacopa monnieri)", benefit: "Supports cognitive function and reduces anxiety." },
      { name: "Jatamansi", benefit: "Known for its calming effect on the nervous system." }
    ],
    lifestyleTips: [
      "Practice 'Pranayama' (deep breathing exercises) for 10 minutes daily.",
      "Perform 'Abhyanga' (warm oil self-massage) before bathing.",
      "Ensure a consistent sleep schedule, ideally retiring by 10 PM."
    ],
    dietTips: [
      "Favor warm, grounding foods like soups and stews.",
      "Avoid excessive caffeine and carbonated drinks."
    ]
  },
  "Fatigue": {
    medicines: [
      { name: "Chyawanprash", benefit: "A nutrient-rich herbal jam that boosts energy and immunity." },
      { name: "Shatavari", benefit: "Helps in refreshing the body and improving vitality." },
      { name: "Guduchi", benefit: "Supports strength and detoxification." }
    ],
    lifestyleTips: [
      "Incorporate moderate Yogasana (like Surya Namaskar) into your morning routine.",
      "Take 15-minute power naps if needed, but avoid long daytime sleep.",
      "Spend at least 15 minutes in natural sunlight daily."
    ],
    dietTips: [
      "Include dates, almonds, and fresh seasonal fruits in your diet.",
      "Drink warm milk with a pinch of turmeric at night."
    ]
  },
  "Possible Infection": {
    medicines: [
      { name: "Tulsi (Holy Basil)", benefit: "Strong antimicrobial and anti-inflammatory properties." },
      { name: "Giloy (Guduchi) Juice", benefit: "Powerful immuno-modulator and antipyretic." },
      { name: "Neem", benefit: "Natural blood purifier and anti-infective." }
    ],
    lifestyleTips: [
      "Gargle with warm salt water and turmeric if there is a throat issue.",
      "Practice 'Nasya' (applying a drop of oil in nostrils) to protect respiratory tract.",
      "Rest adequately to allow the body's immune system to fight back."
    ],
    dietTips: [
      "Sip on warm water throughout the day.",
      "Consume light, easily digestible meals (Mung dal Khichdi)."
    ]
  },
  "Cardiac Risk": {
    medicines: [
      { name: "Arjuna (Terminalia arjuna)", benefit: "Traditional heart tonic that strengthens cardiac muscles." },
      { name: "Guggul", benefit: "Helps maintain healthy cholesterol levels." },
      { name: "Pushkarmool", benefit: "Supports respiratory and cardiac health." }
    ],
    lifestyleTips: [
      "Engage in low-impact walking for 30 minutes daily.",
      "Practice 'Shavasana' (corpse pose) to regulate blood pressure.",
      "Avoid sudden heavy physical exertion."
    ],
    dietTips: [
      "Reduce intake of deep-fried and extremely salty foods.",
      "Include garlic and ginger in your daily cooking."
    ]
  },
  "Lifestyle Health Risk": {
    medicines: [
      { name: "Triphala", benefit: "Supports detoxification and healthy digestion." },
      { name: "Aloe Vera", benefit: "Helps in metabolic health and detoxification." },
      { name: "Karela (Bitter Gourd)", benefit: "Helps regulate blood sugar levels." }
    ],
    lifestyleTips: [
      "Implement a fixed time for all meals.",
      "Reduce screen time at least one hour before sleep.",
      "Walk 100 steps after dinner (Shatpavali)."
    ],
    dietTips: [
      "Increase fiber intake with green leafy vegetables.",
      "Replace refined sugar with natural sweeteners like Jaggery in moderation."
    ]
  },
  "Normal": {
    medicines: [
      { name: "Amritarishta", benefit: "General health tonic for longevity." }
    ],
    lifestyleTips: [
      "Maintain your current healthy routine.",
      "Practice seasonal detoxification (Ritucharya)."
    ],
    dietTips: [
      "Follow a balanced diet tailored to your Prakriti (body type)."
    ]
  }
};

const getAyurvedicRecommendations = (condition) => {
  const recommendations = MAPPINGS[condition] || MAPPINGS["Normal"];
  return {
    ...recommendations,
    disclaimer: DISCLOSURE
  };
};

module.exports = { getAyurvedicRecommendations };
