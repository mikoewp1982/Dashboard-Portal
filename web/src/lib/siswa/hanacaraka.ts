/**
 * Hanacaraka Aksara Jawa Converter
 * Ported from GAS Siswa Android Native implementation
 */

const consonantMap: Record<string, string> = {
  ng: "\uA994",
  ny: "\uA99A",
  dh: "\uA99D",
  th: "\uA99B",
  b: "\uA9A7",
  c: "\uA995",
  d: "\uA9A2",
  f: "\uA9A5",
  g: "\uA992",
  h: "\uA9B2",
  j: "\uA997",
  k: "\uA98F",
  l: "\uA9AD",
  m: "\uA9A9",
  n: "\uA9A4",
  p: "\uA9A5",
  q: "\uA98F",
  r: "\uA9AB",
  s: "\uA9B1",
  t: "\uA9A0",
  v: "\uA9AE",
  w: "\uA9AE",
  x: "\uA9B1",
  y: "\uA9AA",
  z: "\uA9B1",
};

const consonantKeys = [
  "ng", "ny", "dh", "th", "b", "c", "d", "f", "g", "h", "j", "k",
  "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z",
];

const vowelIndependent: Record<string, string> = {
  a: "\uA984",
  i: "\uA986",
  u: "\uA988",
  e: "\uA98C",
  o: "\uA98E",
};

const vowelSign: Record<string, string> = {
  i: "\uA9B6",
  u: "\uA9B8",
  e: "\uA9BC",
  o: "\uA9BA\uA9B4",
};

const PANGKON = "\uA9C0";
const vowels = new Set(["a", "i", "u", "e", "o"]);

function convertWord(word: string): string {
  const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
  let result = "";
  let index = 0;

  while (index < cleanWord.length) {
    const matchedConsonant = consonantKeys
      .sort((a, b) => b.length - a.length)
      .find((k) => cleanWord.startsWith(k, index));

    if (matchedConsonant) {
      index += matchedConsonant.length;
      const base = consonantMap[matchedConsonant] || "";

      if (index < cleanWord.length && vowels.has(cleanWord[index])) {
        const vowel = cleanWord[index];
        index += 1;
        result += vowel === "a" ? base : base + (vowelSign[vowel] || "");
      } else {
        result += base + PANGKON;
      }
    } else if (vowels.has(cleanWord[index])) {
      const vowel = cleanWord[index];
      index += 1;
      result += vowelIndependent[vowel] || "";
    } else {
      index += 1;
    }
  }

  return result;
}

export function convertToHanacaraka(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => convertWord(w))
    .join(" ");
}
