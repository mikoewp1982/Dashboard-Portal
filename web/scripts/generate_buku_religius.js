const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const TARGET_PATH = path.join(__dirname, "../../native-mobile-gas/app/src/main/res/raw/buku_religius.json");

const ASMAUL_HUSNA_INDO = [
  "Maha Pengasih", "Maha Penyayang", "Maha Merajai", "Maha Suci", "Maha Memberi Kesejahteraan",
  "Maha Memberi Keamanan", "Maha Mengatur", "Maha Perkasa", "Maha Gagah", "Maha Memiliki Kebesaran",
  "Maha Pencipta", "Maha Melepaskan", "Maha Membentuk Rupa", "Maha Pengampun", "Maha Menundukkan",
  "Maha Pemberi Karunia", "Maha Pemberi Rezeki", "Maha Pembuka Rahmat", "Maha Mengetahui", "Maha Menyempitkan",
  "Maha Melapangkan", "Maha Merendahkan", "Maha Meninggikan", "Maha Memuliakan", "Maha Menghinakan",
  "Maha Mendengar", "Maha Melihat", "Maha Menetapkan Hukum", "Maha Adil", "Maha Lembut",
  "Maha Mengenal", "Maha Penyantun", "Maha Agung", "Maha Pengampun", "Maha Pembalas Budi",
  "Maha Tinggi", "Maha Besar", "Maha Memelihara", "Maha Pemberi Kecukupan", "Maha Membuat Perhitungan",
  "Maha Mulia", "Maha Pemurah", "Maha Mengawasi", "Maha Mengabulkan", "Maha Luas",
  "Maha Bijaksana", "Maha Mengasihi", "Maha Mulia", "Maha Membangkitkan", "Maha Menyaksikan",
  "Maha Benar", "Maha Memelihara", "Maha Kuat", "Maha Kokoh", "Maha Melindungi",
  "Maha Terpuji", "Maha Menghitung", "Maha Memulai", "Maha Mengembalikan", "Maha Menghidupkan",
  "Maha Mematikan", "Maha Hidup", "Maha Mandiri", "Maha Penemu", "Maha Mulia",
  "Maha Tunggal", "Maha Esa", "Maha Dibutuhkan", "Maha Kuasa", "Maha Berkuasa",
  "Maha Mendahulukan", "Maha Mengakhirkan", "Maha Pertama", "Maha Akhir", "Maha Nyata",
  "Maha Gaib", "Maha Memerintah", "Maha Tinggi", "Maha Penderma", "Maha Penerima Tobat",
  "Maha Pemberi Balasan", "Maha Pemaaf", "Maha Pengasih", "Maha Pemilik Kerajaan", "Maha Pemilik Keagungan dan Kemuliaan",
  "Maha Pemberi Keadilan", "Maha Mengumpulkan", "Maha Kaya", "Maha Pemberi Kekayaan", "Maha Mencegah",
  "Maha Pemberi Kemudaratan", "Maha Pemberi Manfaat", "Maha Bercahaya", "Maha Pemberi Petunjuk", "Maha Pencipta Keindahan",
  "Maha Kekal", "Maha Pewaris", "Maha Pandai", "Maha Penyabar"
];

const ISTIGHOTSAH_DATA = [
  {
    number: 1,
    arab: "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيْمِ",
    translation: "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang."
  },
  {
    number: 2,
    arab: "أَلْفَاتِحَة... (إِلَى حَضْرَةِ النَّبِيِّ الْمُصْطَفَى مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ)",
    translation: "Membaca Surat Al-Fatihah (ditujukan kepada junjungan Nabi Mulia Muhammad SAW...)."
  },
  {
    number: 3,
    arab: "أَسْتَغْفِرُ اللهَ الْعَظِيْمَ (٣ kali)",
    translation: "Aku memohon ampun kepada Allah Yang Maha Agung (3x)."
  },
  {
    number: 4,
    arab: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيْمِ (٣ kali)",
    translation: "Tiada daya dan kekuatan kecuali dengan pertolongan Allah Yang Maha Tinggi lagi Maha Agung (3x)."
  },
  {
    number: 5,
    arab: "أَللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ (٣ kali)",
    translation: "Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad beserta keluarganya (3x)."
  },
  {
    number: 6,
    arab: "يَا اللهُ يَا قَدِيْمُ (٣٣ kali)",
    translation: "Wahai Allah, Wahai Dzat Yang Maha Dahulu (33x)."
  },
  {
    number: 7,
    arab: "يَا سَمِيْعُ يَا بَصِيْرُ (٣٣ kali)",
    translation: "Wahai Dzat Yang Maha Mendengar lagi Maha Melihat (33x)."
  },
  {
    number: 8,
    arab: "يَا مُبْدِئُ يَا خَالِقُ (٣٣ kali)",
    translation: "Wahai Dzat Yang Maha Memulai lagi Maha Pencipta (33x)."
  },
  {
    number: 9,
    arab: "يَا حَفِيْظُ يَا نَصِيْرُ يَا وَكِيْلُ يَا اللهُ (٣٣ kali)",
    translation: "Wahai Dzat Yang Maha Memelihara, Wahai Dzat Yang Maha Penolong, Wahai Dzat Yang Maha Melindungi, Wahai Allah (33x)."
  },
  {
    number: 10,
    arab: "يَا حَيُّ يَا قَيُّوْمُ بِرَحْمَتِكَ أَسْتَغِيْثُ (٣٣ kali)",
    translation: "Wahai Dzat Yang Maha Hidup lagi Maha Mandiri, dengan rahmat-Mu aku memohon pertolongan (33x)."
  },
  {
    number: 11,
    arab: "يَا لَطِيْفُ (١٢٩ kali)",
    translation: "Wahai Dzat Yang Maha Lembut (129x)."
  },
  {
    number: 12,
    arab: "أَسْتَغْفِرُ اللهَ الْعَظِيْمَ إِنَّهُ كَانَ غَفَّارًا (٣ kali)",
    translation: "Aku memohon ampun kepada Allah Yang Maha Agung, sesungguhnya Dia adalah Maha Pengampun (3x)."
  },
  {
    number: 13,
    arab: "أَللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِيْنَا بِهَا مِنْ جَمِيْعِ الْأَهْوَALِ وَالْآفَاتِ، وَتَقْضِيْ لَنَا بِهَا جَمِيْعَ الْحَاجَاتِ، وَتُطَهِّرُنَا بِهَا مِنْ جَمِيْعِ السَّيِّئَاتِ، وَتَرْفَعُنَا بِهَا عِنْدَكَ أَعْلَى الدَّرَجَاتِ، وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيْعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ.",
    translation: "Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad, yang dengan berkah shalawat itu Engkau menyelamatkan kami dari setiap keadaan yang menakutkan dan dari bencana; Engkau tunaikan semua hajat kami; Engkau bersihkan kami dari semua keburukan; Engkau angkat derajat kami ke tempat tertinggi di sisi-Mu; dan Engkau sampaikan tujuan kami pada batas terjauh dari segala kebaikan baik semasa hidup maupun setelah mati."
  }
];

const DOA_PENDEK_DATA = [
  {
    title: "Doa Sebelum Belajar",
    arab: "رَضِتُ بِاللهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا وَرَسُولًا رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا",
    latin: "Rodhitu billahi rabba, wabil islaami diina, wabimuhammadin nabiyya warasuula. Rabbi zidnii 'ilmaa warzuqnii fahmaa",
    translation: "Aku rida Allah sebagai Tuhanku, Islam sebagai agamaku, dan Nabi Muhammad sebagai Nabi dan Rasulku. Ya Allah, tambahkanlah kepadaku ilmu dan berikanlah aku pengertian yang baik."
  },
  {
    title: "Doa Sesudah Belajar",
    arab: "اللَّهُمَّ أَرِنَا الْحَقَّ حَقًّا وَارْزُقْنَا اتِّبَاعَهُ وَأَرِنَا الْبَاطِلَ بَاطِلًا وَارْزُقْنَا اجْتِنَابَهُ",
    latin: "Allahumma arinal haqqa haqqan warzuqnat tibaa'ah, wa arinal baathila baathilan warzuqnaj tinaabah",
    translation: "Ya Allah, tunjukkanlah kepada kami yang benar itu benar dan berilah kami kekuatan untuk mengikutinya, dan tunjukkanlah kepada kami yang salah itu salah dan berilah kami kekuatan untuk menjauhinya."
  },
  {
    title: "Doa Kedua Orang Tua",
    arab: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    latin: "Rabbighfir lii waliwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa",
    translation: "Ya Tuhanku, ampunilah dosaku dan dosa kedua orang tuaku, dan sayangilah mereka berdua sebagaimana mereka memelihara aku pada waktu kecil."
  },
  {
    title: "Doa Kebaikan Dunia Akhirat (Sapu Jagad)",
    arab: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbanaa aatinaa fid dunyaa hasanatan wafil aakhirati hasanatan waqinaa 'adzaaban naar",
    translation: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka."
  },
  {
    title: "Doa Sebelum Makan",
    arab: "اللَّهُمَّ بَارِكْ لَنَا فِيْمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ",
    latin: "Allahumma baarik lanaa fiimaa razaqtanaa waqinaa 'adzaaban naar",
    translation: "Ya Allah, berkahilah rezeki yang telah Engkau berikan kepada kami, dan peliharalah kami dari siksa neraka."
  },
  {
    title: "Doa Sesudah Makan",
    arab: "الْحَمْدُ للهِ الَّذِيْ أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ",
    latin: "Alhamdu lillahil ladzii ath'amanaa wasaqaanaa waja'alanaa muslimiin",
    translation: "Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami termasuk golongan orang-orang muslim."
  },
  {
    title: "Doa Sebelum Tidur",
    arab: "بِاسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ",
    latin: "Bismika allahumma ahya wa amuutu",
    translation: "Dengan nama-Mu ya Allah aku hidup dan aku mati."
  },
  {
    title: "Doa Bangun Tidur",
    arab: "الْحَمْدُ للهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    latin: "Alhamdu lillahil ladzii ahyaanaa ba'da maa amaatanaa wa ilaihin nusyuur",
    translation: "Segala puji bagi Allah yang telah menghidupkan kami kembali setelah mematikan kami, dan hanya kepada-Nya kami kembali."
  }
];

async function fetchSurah(number) {
  console.log(`Fetching Surah ${number}...`);
  const res = await fetch(`https://quran-api-id.vercel.app/surah/${number}`);
  if (!res.ok) throw new Error(`Gagal mengunduh surah ${number}: ${res.statusText}`);
  const body = await res.json();
  const data = body.data;

  return {
    number: data.number,
    name: data.name.transliteration.id,
    translation: data.name.translation.id,
    numberOfVerses: data.numberOfVerses,
    verses: data.verses.map(v => ({
      number: v.number.inSurah,
      arab: v.text.arab,
      latin: v.text.transliteration.en,
      translation: v.translation.id
    }))
  };
}

async function fetchAsmaulHusna() {
  console.log("Fetching Asmaul Husna from AlAdhan API...");
  const res = await fetch("http://api.aladhan.com/v1/asmaAlHusna");
  if (!res.ok) throw new Error("Gagal mengunduh Asmaul Husna");
  const body = await res.json();
  
  return body.data.map(item => {
    const idx = item.number - 1;
    return {
      number: item.number,
      arab: item.name,
      latin: item.transliteration,
      translation: ASMAUL_HUSNA_INDO[idx] || item.en.meaning
    };
  });
}

async function run() {
  try {
    // 1. Fetch Surahs
    const yasin = await fetchSurah(36);
    const arRahman = await fetchSurah(55);
    const alWaqiah = await fetchSurah(56);
    const alMulk = await fetchSurah(67);

    // 2. Fetch Asmaul Husna
    const asmaulHusna = await fetchAsmaulHusna();

    // 3. Compile Book JSON
    const book = {
      surahs: [arRahman, alWaqiah, yasin, alMulk],
      istighotsah: ISTIGHOTSAH_DATA,
      asmaul_husna: asmaulHusna,
      doa_pendek: DOA_PENDEK_DATA
    };

    // 4. Ensure target directory exists
    const dir = path.dirname(TARGET_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 5. Write to File
    fs.writeFileSync(TARGET_PATH, JSON.stringify(book, null, 2), "utf8");
    console.log(`\nBUKU PEMBIASAAN RELIGIUS BERHASIL DI-GENERATE!`);
    console.log(`Lokasi file: ${TARGET_PATH}`);
    console.log(`Ukuran file: ${(fs.statSync(TARGET_PATH).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error("Gagal menggenerate buku religius:", error);
    process.exit(1);
  }
}

run();
