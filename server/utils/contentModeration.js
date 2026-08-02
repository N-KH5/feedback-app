const blockedWords = [
  // English
  "asshole",
  "bastard",
  "bitch",
  "bullshit",
  "cunt",
  "dick",
  "dickhead",
  "dipshit",
  "douche",
  "douchebag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "idiot",
  "jackass",
  "motherfucker",
  "moron",
  "prick",
  "retard",
  "shit",
  "shithead",
  "slut",
  "stupid",
  "twat",
  "wanker",
  "whore",

  // German
  "arsch",
  "arschloch",
  "blödmann",
  "depp",
  "drecksau",
  "drecksschwein",
  "dummkopf",
  "fotze",
  "fresse",
  "hure",
  "hurensohn",
  "mistkerl",
  "penner",
  "schlampe",
  "scheiße",
  "scheisse",
  "schwein",
  "spast",
  "trottel",
  "vollidiot",
  "wichser",

  // Abbreviations
  "gtfo",
  "stfu",
];

const characterReplacements = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[013457@$!]/g, (character) => {
      return characterReplacements[character] || character;
    })
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9äöüß\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsBlockedContent(value = "") {
  const normalizedText = normalizeText(value);

  if (!normalizedText) {
    return false;
  }

  const words = normalizedText.split(" ");

  return blockedWords.some((blockedWord) => {
    const normalizedBlockedWord = normalizeText(blockedWord);

    return words.includes(normalizedBlockedWord);
  });
}

function findInappropriateField(fields = {}) {
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (containsBlockedContent(fieldValue)) {
      return fieldName;
    }
  }

  return null;
}

module.exports = {
  containsBlockedContent,
  findInappropriateField,
};