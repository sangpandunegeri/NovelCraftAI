import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { Character, Location, NovelObject } from '../types';

const API_KEY = AIzaSyDLCjC3k8fa9nLP0yMhu3pN9lTo8-lJhvQ;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = ai.models;

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes('failed to fetch') || lowerCaseMessage.includes('networkerror')) {
            return 'Tidak dapat terhubung ke layanan AI. Silakan periksa koneksi internet Anda dan coba lagi.';
        }
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Terjadi kesalahan tak terduga. Silakan coba lagi.';
};

export const generateSynopsis = async (premise: string, genre: string): Promise<string> => {
    const prompt = `Anda adalah seorang ahli strategi narasi dan penulis skenario berpengalaman. Berdasarkan premis dan genre berikut, buatlah sinopsis tiga babak yang ringkas namun menarik.

**Premis Cerita:**
"${premise}"

**Genre:**
${genre}

**Instruksi:**
- **Babak 1 (Pengenalan):** Jelaskan dunia normal protagonis, perkenalkan karakter-karakter kunci, dan bangun insiden pemicu yang memulai cerita.
- **Babak 2 (Konfrontasi):** Uraikan rintangan utama, konflik yang meningkat, dan titik tengah di mana pertaruhannya menjadi lebih tinggi.
- **Babak 3 (Penyelesaian):** Jelaskan klimaks cerita, bagaimana konflik utama diselesaikan, dan keadaan dunia atau karakter setelahnya.

Pastikan setiap babak mengalir secara logis ke babak berikutnya. Berikan jawaban Anda dalam format teks biasa, dengan judul yang jelas untuk setiap babak.

**Contoh Format:**
Babak 1 (Pengenalan): [Teks Anda di sini]

Babak 2 (Konfrontasi): [Teks Anda di sini]

Babak 3 (Penyelesaian): [Teks Anda di sini]
`;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for synopsis generation: ${message}`, error);
        throw new Error(message);
    }
};

export const generateStoryStarters = async (
    synopsis: string, 
    genre: string
): Promise<{ openings: string[], incidents: string[] }> => {
    const prompt = `Anda adalah asisten penulisan kreatif. Berdasarkan sinopsis tiga babak dan genre yang diberikan, buatlah 4 saran yang berbeda dan menarik untuk 'adegan pembuka' dan 4 saran untuk 'insiden pemicu'. Saran harus ringkas dan secara langsung menginspirasi bab pertama.

**Sinopsis:**
${synopsis}

**Genre:**
${genre}

**Instruksi:**
- **Adegan Pembuka**: Harus membangun latar awal, suasana, dan memperkenalkan dunia normal protagonis.
- **Insiden Pemicu**: Harus menjadi peristiwa spesifik yang memulai plot utama dan mengganggu dunia protagonis.

Hanya kembalikan respons dalam format JSON sesuai dengan skema yang diberikan.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            openings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Empat saran untuk adegan pembuka."
            },
            incidents: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Empat saran untuk insiden pemicu."
            }
        },
        required: ["openings", "incidents"]
    };

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        return JSON.parse(response.text) as { openings: string[], incidents: string[] };
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for story starter generation: ${message}`, error);
        throw new Error(message);
    }
};


export const generateChapterContent = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await model.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Gemini API call failed for chapter generation: ${message}`, error);
    throw new Error(message);
  }
};

export const generateChapterTitle = async (
    chapterContent: string,
    genre: string,
    writingStyle: string
): Promise<string> => {
    const prompt = `Anda adalah seorang editor sastra yang ahli dalam membuat judul yang menarik. Berdasarkan konten bab, genre, dan gaya penulisan berikut, buatlah satu judul bab yang ringkas, relevan, dan memikat.

**Genre:** ${genre}
**Gaya Penulisan:** ${writingStyle}

**Konten Bab (Potongan):**
"${chapterContent.trim().split(/\s+/).slice(0, 300).join(' ')}..."

**Instruksi:**
- Judul harus singkat (2-5 kata).
- Judul harus mencerminkan peristiwa atau suasana utama bab tersebut.
- Jangan gunakan tanda kutip atau format apa pun.
- Hanya kembalikan teks judulnya saja.

Judul Bab:`;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim().replace(/["*#_]/g, '');
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for title generation: ${message}`, error);
        throw new Error(message);
    }
};

export const generateSummary = async (chapterContent: string): Promise<string> => {
    const prompt = `Anda adalah asisten editor yang sangat baik. Ringkaslah bab novel berikut dalam 2-4 kalimat. Fokus pada peristiwa plot kunci, perkembangan karakter utama, dan petunjuk apa pun yang relevan untuk bab-bab mendatang. Jangan sertakan opini atau analisis. Hindari penggunaan markdown (seperti *, #) atau penanda non-standar lainnya.

    Teks Bab:
    """
    ${chapterContent}
    """

    Ringkasan:`;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for summary generation: ${message}`, error);
        throw new Error(message);
    }
};

export const analyzeAssetWithSchema = async <T,>(prompt: string, base64Image: string | null, schema: any): Promise<T> => {
    try {
        const parts: any[] = [{ text: prompt }];
        if (base64Image) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image,
                }
            });
        }

        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        return JSON.parse(response.text) as T;
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for asset analysis: ${message}`, error);
        throw new Error(message);
    }
};

export const analyzeWritingWithSchema = async (text: string) => {
    const prompt = `Anda adalah seorang editor naskah profesional. Analisis teks novel berikut dan berikan umpan balik yang membangun dalam format JSON.
    
    Fokus pada:
    1.  **Tata Bahasa dan Ejaan**: Temukan salah ketik, kesalahan tata bahasa, dan masalah tanda baca.
    2.  **Alur dan Keterbacaan**: Identifikasi paragraf yang terlalu panjang atau kalimat yang berbelit-belit.
    3.  **Pemeriksaan Dialog**: Evaluasi apakah dialog terasa alami dan jika tag dialog (misalnya, "ucapnya") terlalu sering digunakan.
    4.  **Pilihan Kata**: Cari kata-kata yang diulang, kalimat pasif yang tidak efektif, atau klise.

    Berikan 3-5 saran perbaikan yang paling penting. Untuk setiap saran, sertakan 'kutipan' (teks asli yang bermasalah, buat sesingkat mungkin), 'masalah' (penjelasan singkat tentang masalahnya), dan 'saran' (teks pengganti yang diperbaiki untuk 'kutipan').

    Teks untuk dianalisis:
    """
    ${text}
    """`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        quote: { type: Type.STRING },
                        issue: { type: Type.STRING },
                        suggestion: { type: Type.STRING }
                    },
                }
            }
        }
    };

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        return JSON.parse(response.text) as { suggestions: { quote: string, issue: string, suggestion: string }[] };
    } catch (error)
 {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for writing analysis: ${message}`, error);
        throw new Error(message);
    }
};

export const extractAndLinkAssets = async (
    chapterText: string,
    existingCharacters: Character[],
    existingLocations: Location[],
    existingObjects: NovelObject[]
) => {
    const prompt = `Anda adalah seorang analis cerita dan pembangun dunia yang sangat teliti. Baca teks bab berikut. Saya akan memberikan daftar aset yang sudah ada. Tugas Anda adalah:
1.  **Identifikasi Aset yang Ada**: Pindai teks untuk menemukan penyebutan aset yang sudah ada dari daftar yang diberikan.
2.  **Ekstrak Aset Baru**: Identifikasi dan ekstrak setiap karakter, lokasi, atau objek BARU yang diperkenalkan dalam teks. Jangan sertakan aset yang sudah ada di daftar baru Anda.
3.  **Detail Karakter Baru**: Untuk setiap karakter BARU, ekstrak informasi berikut untuk membuat profil database yang lengkap: 'name' (harus unik), 'role' (fungsi naratif mereka, misalnya, Protagonis, Antagonis, Karakter Pendukung), 'gender', 'age', 'country', 'faceDescription', 'hairDescription', 'clothingDescription', 'accessoryDescription', 'height', 'weight', dan 'bodyShape'. Jika sebuah detail tidak disebutkan secara eksplisit, buatlah kesimpulan yang masuk akal dari konteksnya. Jika tidak ada konteks, biarkan bidang yang sesuai kosong.
4.  **Detail Lokasi & Objek Baru**: Untuk setiap lokasi atau objek BARU, berikan 'name' (harus unik) dan 'description' (deskripsi singkat berdasarkan teks).
5.  **Format Output**: Hanya balas dengan objek JSON yang sesuai dengan skema yang diberikan.

Aset yang Ada (jangan diekstrak sebagai baru):
- Karakter: ${existingCharacters.map(c => `"${c.name}"`).join(', ') || '[]'}
- Lokasi: ${existingLocations.map(l => `"${l.name}"`).join(', ') || '[]'}
- Objek: ${existingObjects.map(o => `"${o.name}"`).join(', ') || '[]'}

Teks Bab untuk Dianalisis:
"""
${chapterText}
"""`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            mentionedExistingCharacterNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            mentionedExistingLocationNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            mentionedExistingObjectNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            newCharacters: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Nama karakter baru yang unik." },
                        role: { type: Type.STRING, description: "Peran naratif karakter (misalnya, Protagonis, Antagonis, Karakter Pendukung)." },
                        gender: { type: Type.STRING, description: "Jenis kelamin yang disimpulkan dari karakter (misalnya, Pria, Wanita, Tidak ditentukan)." },
                        age: { type: Type.STRING, description: "Perkiraan usia dari konteks (misalnya, 20-an, Remaja, Tua)." },
                        country: { type: Type.STRING, description: "Negara asal atau kebangsaan yang disimpulkan, jika disebutkan." },
                        faceDescription: { type: Type.STRING, description: "Deskripsi fitur wajah, jika disebutkan." },
                        hairDescription: { type: Type.STRING, description: "Deskripsi rambut, jika disebutkan." },
                        clothingDescription: { type: Type.STRING, description: "Deskripsi pakaian, jika disebutkan." },
                        accessoryDescription: { type: Type.STRING, description: "Deskripsi aksesori atau barang pribadi lainnya, jika disebutkan." },
                        height: { type: Type.STRING, description: "Perkiraan tinggi badan, jika disebutkan (misalnya, Tinggi, Pendek, Rata-rata)." },
                        weight: { type: Type.STRING, description: "Perkiraan berat badan atau perawakan, jika disebutkan (misalnya, Kurus, Berotot)." },
                        bodyShape: { type: Type.STRING, description: "Deskripsi bentuk tubuh atau perawakan, jika disebutkan." },
                    }
                }
            },
            newLocations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Nama lokasi baru yang unik." },
                        description: { type: Type.STRING, description: "Deskripsi singkat berdasarkan teks." }
                    }
                }
            },
            newObjects: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Nama objek baru yang unik." },
                        description: { type: Type.STRING, description: "Deskripsi singkat berdasarkan teks." }
                    }
                }
            }
        }
    };
    
    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        return JSON.parse(response.text) as {
            mentionedExistingCharacterNames: string[];
            mentionedExistingLocationNames: string[];
            mentionedExistingObjectNames: string[];
            newCharacters: Partial<Character>[];
            newLocations: { name: string, description: string }[];
            newObjects: { name: string, description: string }[];
        };
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for asset extraction: ${message}`, error);
        throw new Error(message);
    }
};

export const improveManuscript = async (
    manuscriptText: string,
    improvementOptions: string[],
    writingStyle: string
) => {
    let optionsPrompt = improvementOptions.map(option => {
        switch(option) {
            case 'paragraphs': return '- **Perbaikan Keterbacaan & Alur**: Analisis kalimat yang terlalu panjang atau canggung dan tawarkan perbaikan untuk kejelasan dan aliran yang lebih baik. Pecah paragraf yang sangat panjang dan perbaiki struktur kalimat yang berbelit-belit untuk meningkatkan keterbacaan.';
            case 'descriptions': return '- **Pengayaan Deskripsi**: Jadikan deskripsi lebih hidup, sensoris, dan menggugah imajinasi.';
            case 'dialogue': return '- **Peningkatan Dialog**: Analisis dialog untuk memastikannya terasa alami, sesuai dengan kepribadian setiap karakter, dan secara aktif memajukan plot atau pengembangan karakter. Sarankan perubahan untuk menghilangkan dialog yang kaku, tidak perlu, atau tidak sesuai dengan karakter.';
            case 'characterExpression': return '- **Analisis Ekspresi Karakter**: Analisis dialog dalam naskah untuk meningkatkan kedalaman karakter dan kejelasan emosional. Sarankan penambahan bahasa tubuh, ekspresi wajah, atau tindakan non-verbal yang menyertai dialog untuk memberikan kejelasan dan nuansa pada interaksi karakter.';
            case 'writingStyle': return writingStyle ? `- **Analisis & Konsistensi Gaya Penulisan**: Analisis naskah untuk memeriksa konsistensi dengan gaya penulisan "${writingStyle}". Identifikasi kalimat atau paragraf yang menyimpang dari gaya ini dalam hal nada, pilihan kata, atau struktur kalimat. Berikan saran untuk menyelaraskan bagian-bagian ini dengan gaya yang ditargetkan.` : '';
            case 'grammar': return `- **Analisis Tata Bahasa Lanjutan**: Gunakan panduan tata bahasa terperinci yang disediakan di bawah untuk menganalisis penggunaan jenis kata. Berikan saran untuk diversifikasi, kejelasan, dan dampak yang lebih baik.`;
            case 'paragraphStructure': return '- **Analisis Struktur Paragraf**: Evaluasi setiap paragraf berdasarkan prinsip Kesatuan (satu gagasan utama), Kepaduan (alur logis antar kalimat), dan Kelengkapan (informasi yang cukup).';
            case 'descriptiveParagraphs': return '- **Analisis Paragraf Deskriptif**: Evaluasi paragraf deskriptif berdasarkan jenis (Imajinatif, Faktual) dan pola pengembangan (Subjektif, Spatial, Objektif) untuk meningkatkan kejelasan dan dampak.';
            case 'paragraphTypes': return '- **Analisis Jenis Paragraf**: Identifikasi dan evaluasi peran setiap jenis paragraf (Deskriptif, Naratif, Dialog, Eksposisi, Reflektif, Persuasif) untuk memastikan mereka berfungsi secara efektif dalam cerita.';
            case 'plotPacing': return '- **Analisis Struktur Plot & Alur Cerita**: Analisis garis besar cerita berikut, yang terdiri dari ringkasan bab. Identifikasi potensi lubang plot, masalah alur cerita, atau inkonsistensi karakter. Sarankan penyesuaian pada struktur plot atau bab-bab individual untuk meningkatkan alur dan koherensi naratif secara keseluruhan.';
            case 'paragraphPatterns': return '- **Analisis Pola Pengembangan Paragraf**: Identifikasi dan evaluasi pola pengembangan paragraf (misalnya, Definisi, Analogi, Contoh, Sebab-Akibat) untuk memastikan mereka digunakan secara efektif untuk menjelaskan dan memperkuat ide.';
            case 'punctuation': return '- **Analisis Tanda Baca**: Evaluasi penggunaan tanda baca (titik, koma, seru, dll.) berdasarkan panduan yang diberikan untuk memastikan kebenaran dan kejelasan.';
            case 'effectiveSentences': return '- **Analisis Kalimat Efektif**: Evaluasi kalimat berdasarkan prinsip-prinsip Keefektifan (Sistematis, Tidak Ambigu, Tidak Bertele-tele, Logis) menggunakan panduan yang diberikan.';
            default: return '';
        }
    }).filter(Boolean).join('\n');

    const grammarGuide = `kalimat itu menjadi sempurna kalau kita bisa memilih kata yang sesuai dengan maksud dari kalimat tersebut. Pelajaran Bahasa Indonesia cocok banget nih untuk kamu biar kamu belajar lebih banyak mengenai kata-kata. Nah, jenis-jenis kata bisa terbagi berdasarkan bentuk dan kategorinya, yaitu:

1. Kata dasar

Pelajaran Bahasa Indonesia yang pertama adalah membahas tentang kata awal sebelum mengalami perubahan bentuk, fungsi, dan makna atau belum memiliki imbuhan. Untuk contoh dan bagaimana perubahannya, kamu dapat membacanya di sini. 

2. Kata Ulang

Kata ulang adalah kata yang mengalami pengulangan, bisa dalam bentuk asli ataupun perubahan suku kata dan imbuhan yaitu yang mengubah makna kata sebelumnya.

3. Kata Majemuk

Kata majemuk adalah gabungan dua kata yang kemudian membentuk makna baru. Jika kata majemuk terpisah, kata tersebut bisa kembali dengan makna aslinya. Nah, kata majemuk itu bisa terbagi sesuai dengan bentuk penulisan dan makna nya. 

4. Kata Serapan

Kata serapan adalah kata yang berasal bukan dari Bahasa Indonesia (bahasa daerah/bahasa asing) dan berhubungan dengan Bahasa Indonesia untuk menambah kosakata.

Jenis Kata Berdasarkan Kategori

Berdasarkan kategori, jenis kata bisa terbagi menjadi:

1. Kata Keterangan

Kata keterangan adalah kata yang menerangkan atau memperjelas kata kerja, kata sifat dan kata keterangan lainnya, tapi tidak menerangkan kata benda dan kata ganti nama. Nah, kata keterangan adalah kata yang menerangkan atau memperjelas kata kerja, kata sifat dan kata keterangan lainnya, namun tidak menerangkan kata benda dan kata ganti nama.

Kata keterangan dapat dibagi menjadi beberapa jenis yaitu, kata keterangan waktu, kata keterangan tempat, kata keterangan alat, kata keterangan syarat, dan kata keterangan sebab. 

2. Kata Sifat

Kata ini adalah kata yang menerangkan kata benda dan kata ganti nama dan terbagi menjadi dua jenis, yaitu kata sifat bertaraf dan kata sifat tak bertaraf yang di dalamnya terbagi lagi menjadi beberapa kategori. Tidak hanya sebagai keterangan, kata sifat juga bisa menjadi predikat. 

3. Kata Sambung

Kata sambung atau konjungsi adalah kata yang menghubungkan kata dengan kata, frasa dengan frasa, klausa dengan klausa, kalimat dengan kalimat ataupun paragraf dengan paragraf agar saling berkaitan. Ada banyak jenis kata sambung yang memiliki maksud berbeda-beda.

4. Kata Ganti

Ini adalah kata yang menggantikan kata benda yang sudah diketahui sebelumnya agar tidak disebut berulang kali. Kata ganti bisa menjadi subjek atau objek dalam suatu kalimat. 

5. Kata Depan

Ini adalah kata yang berada sebelum kata benda, kata kerja dan kata keterangan lain yang memiliki hubungan makna. Kata ini terbagi memiliki beberapa jenis dan fungsi yang berbeda-beda.

6. Kata Bilangan

Kata bilangan adalah kata yang menyatakan jumlah benda, atau urutan benda dalam suatu deretan.

7. Kata Benda

Kata benda adalah kata yang menyatakan wujud atau kebendaan yang dapat dibagi menjadi kata benda umum dan kata benda khusus.

8. Kata Sandang

Kata sandang adalah kata yang membatasi kata benda yang tidak memiliki makna jika digunakan sendirian seperti si, para, dll.
`;

    const paragraphGuide = `1. KESATUAN
Sebuah paragraf harus memiliki satu gagasan utama. Semua kalimat penunjang harus mendukung gagasan utama ini dan tidak membahas hal lain yang tidak relevan.

2. KEPADUAN (KOHERENSI)
Kalimat-kalimat dalam paragraf harus memiliki hubungan yang logis dan mengalir. Gunakan kata atau frasa transisi untuk menghubungkan ide, seperti: 'selanjutnya', 'di samping itu' (tambahan); 'meskipun', 'namun', 'sebaliknya' (pertentangan); 'oleh karena itu', 'akibatnya' (akibat); 'kemudian', 'sesudah itu' (waktu); 'pendeknya', 'misalnya' (singkatan).

3. KELENGKAPAN
Paragraf harus memberikan informasi yang cukup untuk mendukung gagasan utamanya. Jangan biarkan pembaca bertanya-tanya 'mengapa' atau 'bagaimana'. Berikan detail, contoh, atau penjelasan yang diperlukan untuk membuat poin Anda jelas dan meyakinkan.
`;

    const descriptiveParagraphGuide = `
Jenis-Jenis Paragraf Deskripsi:
Paragraf deskripsi memiliki beberapa jenis yang disesuaikan dengan objek yang digambarkan.
1. Deskripsi Imajinatif: Melukiskan ruang atau tempat berlangsungnya suatu peristiwa. Penulis menjelaskan kejadian yang dilihat atau dialami. Tujuannya agar pembaca memahami dan merasakan sendiri bagaimana peristiwa tersebut terjadi.
2. Deskripsi Faktual: Menggambarkan suatu hal atau orang dengan mengungkapkan identitasnya secara apa adanya sehingga pembaca dapat membayangkan keadaan sebenarnya.

Pola Pengembangan Paragraf Deskripsi:
1. Paragraf Deskripsi Subjektif: Gambaran subjektif sesuai dengan apa yang dipahami, dilihat, dan dialami oleh penulis. Isinya bergantung pada pengetahuan dan wawasan penulis, dan bisa mengandung opini (misalnya, "pemandangan indah").
2. Paragraf Deskripsi Spatial: Penggambaran suatu objek yang hanya berupa benda atau sesuatu yang tidak bernyawa (tempat, benda, ruangan, bangunan).
3. Paragraf Deskripsi Objektif: Penggambaran objek sesuai dengan keadaan yang sebenar-benarnya tanpa adanya tambahan opini penulis. Seluruh informasi disampaikan sesuai kondisi aktual dan hasil pengamatan.
`;

    const paragraphTypesGuide = `Peran dan fungsi paragraf dalam novel:
1. Paragraf Deskriptif: Melukiskan latar, suasana, atau karakter secara detail. Tujuannya adalah untuk "menunjukkan", bukan "memberitahu", agar pembaca ikut merasakan. Fokus pada detail yang relevan, jangan berlebihan.
2. Paragraf Naratif: Tulang punggung cerita. Menceritakan peristiwa atau rangkaian tindakan secara kronologis. Harus menjaga alur dan menciptakan koneksi emosional dengan pembaca, bukan sekadar daftar kejadian.
3. Paragraf Dialog: Tempat karakter berinteraksi. Harus mengungkapkan karakteristik tokoh dan memajukan plot, bukan hanya percakapan biasa.
4. Paragraf Eksposisi: Memberikan penjelasan, informasi latar belakang, atau membangun logika dunia fiksi. Bertanggung jawab untuk mencegah "cacat logika" dan menghubungkan akal pembaca dengan cerita.
5. Paragraf Reflektif atau Internal: Mengungkapkan pikiran dan perasaan terdalam karakter. Membangun empati dan koneksi pembaca dengan karakter. Harus relevan dan tidak bertele-tele.
6. Paragraf Persuasi: Berisi ajakan, bujukan, atau upaya untuk mempengaruhi karakter lain (atau pembaca). Sering ditemukan dalam dialog atau monolog.
`;

    const plotPacingGuide = `
**Panduan Analisis Plot & Alur Cerita (Referensi Wajib):**
Saat menganalisis struktur naratif, fokus pada area-area kunci berikut:
1.  **Lubang Plot (Plot Holes)**: Cari kontradiksi atau kesenjangan logika dalam cerita. Apakah suatu peristiwa terjadi yang bertentangan dengan aturan dunia yang sudah mapan? Apakah seorang karakter mengetahui sesuatu yang seharusnya tidak mereka ketahui?
2.  **Alur Cerita yang Terbengkalai (Dangling Plot Threads)**: Identifikasi alur cerita atau misteri yang diperkenalkan tetapi tidak pernah diselesaikan atau dilupakan.
3.  **Deus Ex Machina**: Waspadai solusi yang tiba-tiba dan tidak masuk akal untuk masalah yang tampaknya tidak dapat diatasi. Solusi harus muncul dari tindakan karakter atau aturan dunia cerita.
4.  **Inkonsistensi Karakter**: Pastikan motivasi dan tindakan karakter tetap konsisten dengan kepribadian yang telah ditetapkan, kecuali jika ada perkembangan karakter yang jelas yang membenarkan perubahan tersebut.
5.  **Masalah Alur Cerita (Pacing Issues)**: Evaluasi kecepatan cerita. Apakah ada bagian yang terasa terlalu terburu-buru, melewatkan perkembangan emosional yang penting? Apakah ada bagian yang terasa terlalu lambat, dipenuhi dengan detail yang tidak perlu yang memperlambat momentum?
6.  **Sebab dan Akibat**: Pastikan bahwa peristiwa-peristiwa mengalir secara logis satu sama lain. Tindakan harus memiliki konsekuensi yang dapat dipercaya.

Dalam \`reasoning\` Anda, rujuk secara spesifik pada konsep-konsep ini (misalnya, "Alasan: Ini adalah *lubang plot* karena...", "Alasan: Alur cerita terasa terlalu *terburu-buru* di bagian ini...").
`;

    const paragraphPatternsGuide = `
1. Pola Definisi: Menjelaskan suatu istilah menggunakan kata-kata seperti "yaitu", "merupakan", "ialah".
2. Pola Analogi: Membandingkan dua hal yang berbeda namun memiliki kesamaan untuk memudahkan pemahaman.
3. Pola Contoh: Memberikan contoh konkret ("contohnya", "misalnya") untuk memperkuat gagasan.
4. Pola Pembandingan: Menjelaskan persamaan dan perbedaan antara dua hal.
5. Pola Kronologi: Menjelaskan kejadian secara berurutan berdasarkan waktu.
6. Pola Ilustrasi: Menggambarkan suatu objek atau peristiwa secara visual dengan kata-kata.
7. Pola Sebab-Akibat (Kausalitas): Menjelaskan hubungan sebab dan akibat suatu kejadian.
8. Pola Klasifikasi-Divisi: Mengelompokkan atau membagi suatu topik menjadi kategori yang lebih kecil ("dibagi", "digolongkan").
9. Pola Repetisi: Mengulangi kata atau frasa kunci untuk penekanan.
10. Pola Kombinasi: Menggabungkan dua atau lebih pola di atas dalam satu paragraf.
`;

    const punctuationGuide = `
Pengertian Tanda Baca
Tanda baca adalah simbol yang nggak ada hubungannya sama suara, kata, atau frasa dalam suatu bahasa. Tanda baca itu sendiri berperan menunjukkan sebuah struktur tulisan, intonasi, dan jeda pada saat pembacaan.

Penggunaan Tanda Baca Titik (.)
1. Penanda Akhir Kalimat: Sebagai penanda pada akhir kalimat berita. Contoh: Ayah baru saja berangkat ke Yogyakarta.
2. Tanda di Penulisan Bagan, Ikhtisar, atau Daftar: Digunakan di belakang satu huruf atau angka. Contoh: II. Provinsi Jawa Barat, A. Kota Bekasi.
3. Pemisah Angka pada Penanda Waktu: Pemisah angka jam, menit, dan detik. Contoh: Pukul 06.05.
4. Penunjukkan Jangka Waktu: Menunjukkan durasi. Contoh: 01.03.47 (1 jam 3 menit 47 detik).
5. Memperjelas Jumlah: Memperjelas bilangan ribuan atau kelipatannya. Contoh: 1.000.000 kasus. Tidak berlaku untuk tahun (Contoh: tahun 2004).
6. Peran dalam Penulisan Referensi: Digunakan setelah nama penulis, judul, dan tempat terbit dalam daftar pustaka.
7. Tidak Digunakan pada Akhir Judul: Tidak boleh digunakan pada akhir judul karangan, kepala tabel, grafik, atau ilustrasi.
8. Tidak Digunakan pada Kepala Surat: Tidak dipakai di belakang alamat atau tanggal pada kepala surat.

Penggunaan Tanda Baca Koma (,)
1. Diletakkan di Tengah Kalimat: Dipakai dalam suatu perincian atau penyebutan bilangan. Contoh: Ibu membeli garam, gula, dan kecap.
2. Perbandingan Kalimat: Memisahkan kalimat setara yang didahului kata perbandingan seperti tetapi, namun, atau melainkan. Contoh: Wahana itu menyenangkan, namun berbahaya.
3. Memisahkan Anak Kalimat dengan Induk Kalimat: Jika anak kalimat mendahului induk kalimat. Contoh: Jika tempatnya sempit, kita tidak akan menggunakannya.
4. Pemisah Partikel: Memisahkan partikel (oh, ya, wah) dari inti kalimat. Contoh: Wah, pemandangannya indah!
5. Kata Penghubung Antarkalimat: Diletakkan di belakang kata penghubung seperti oleh karena itu, akan tetapi. Contoh: ..., oleh karena itu, kita harus merencanakan.
6. Identitas yang Ditulis Berurutan: Memisahkan nama dan alamat, tempat dan tanggal. Contoh: Jakarta, 13 April 2021.
7. Memisahkan Petikan Langsung: Memisahkan kutipan langsung dari bagian lain kalimat. Contoh: Roro bertanya, "Apakah kamu lupa?"
8. Catatan Kaki: Digunakan dalam penyusunan catatan kaki.
9. Penulisan Daftar Pustaka: Memisahkan bagian nama yang dibalik. Contoh: Moeliono, Anton M.
10. Penulisan Bilangan: Dipakai pada angka persepuluhan. Contoh: 17,2 km.
11. Penulisan Gelar: Di antara nama orang dan gelar akademik. Contoh: Hani Ammariah, S.Si.
12. Kalimat Bertingkat: Mengapit keterangan tambahan yang sifatnya tidak membatasi. Contoh: Kakak pertamaku, Kresno, adalah orang kreatif.
13. Menghindari Salah Baca: Di belakang keterangan pada awal kalimat untuk menghindari salah tafsir. Contoh: Dalam upaya pembinaan warga, kita memerlukan semangat.
14. Tidak Digunakan untuk Pemisahan Petikan Langsung: Tidak dipakai jika petikan langsung diakhiri tanda tanya (?) atau tanda seru (!). Contoh: "Kenapa kamu berbohong?" tanya Devi.

Penggunaan Tanda Baca Seru (!)
1. Kalimat Perintah: Dipakai di akhir kalimat perintah atau seruan. Contoh: Jangan sentuh!
`;

    const effectiveSentenceGuide = `
Syarat Kalimat Efektif:
1. Sesuai EYD: Menggunakan ejaan dan tanda baca yang benar.
2. Sistematis: Memiliki susunan yang jelas, minimal Subjek (S) dan Predikat (P). Urutan umum adalah S-P-O-K (Objek, Keterangan).
3. Tidak Ambigu: Tidak bermakna ganda atau multitafsir.
4. Tidak Bertele-tele: Ringkas, jelas, dan menghindari penggunaan kata yang tidak perlu. Hindari pengulangan subjek, penggunaan sinonim dalam satu kalimat, dan kata jamak yang berlebihan.

Ciri-ciri Kalimat Efektif:
1. Struktur yang Sepadan: Keseimbangan antara gagasan dan struktur. Subjek dan predikat harus jelas. Hindari kata depan sebelum subjek dan kata "yang" yang menghilangkan predikat.
2. Pemilihan Kata yang Tepat: Efisien dan hemat, hindari kata bermakna sama.
3. Makna yang Tegas: Gagasan disampaikan dengan jelas. Penekanan dapat dilakukan dengan mengubah urutan kata (misalnya, meletakkan predikat di depan).
4. Kesejajaran Bentuk (Paralelisme): Konsisten dalam penggunaan imbuhan. Jika satu bagian menggunakan imbuhan 'me-', bagian lain yang setara juga harus konsisten.
5. Kalimat Logis: Ide kalimat dapat diterima oleh akal sehat dan masuk akal.

Unsur-unsur Kalimat:
- Subjek (S): Pelaku atau pokok pembicaraan.
- Predikat (P): Tindakan atau kondisi subjek.
- Objek (O): Sasaran dari tindakan predikat.
- Keterangan (K): Menjelaskan S, P, O, atau Pelengkap (waktu, tempat, dll.).
- Pelengkap (Pel): Melengkapi predikat, seringkali tidak bisa dijadikan subjek dalam kalimat pasif.
`;

    const grammarPromptSection = improvementOptions.includes('grammar') ? `
**Panduan Tata Bahasa Lanjutan (Referensi Wajib):**
Gunakan pengetahuan berikut sebagai dasar untuk analisis tata bahasa Anda. Saat memberikan alasan (\`reasoning\`), sebutkan jenis kata yang relevan (misalnya, "Mengganti 'Kata Sifat' yang berulang," "Memperbaiki penggunaan 'Kata Sambung'")).

---
${grammarGuide}
---
` : '';

    const paragraphPromptSection = improvementOptions.includes('paragraphStructure') ? `
**Panduan Struktur Paragraf (Referensi Wajib):**
Gunakan panduan berikut untuk menganalisis setiap paragraf. Fokus pada Kesatuan, Kepaduan, dan Kelengkapan. Sebutkan prinsip-prinsip ini dalam alasan (\`reasoning\`) Anda. Contoh: "Alasan: Paragraf ini kurang memiliki *kesatuan* karena..." atau "Alasan: Menambahkan transisi akan meningkatkan *kepaduan*..."

---
${paragraphGuide}
---
` : '';

    const descriptiveParagraphPromptSection = improvementOptions.includes('descriptiveParagraphs') ? `
**Panduan Paragraf Deskriptif (Referensi Wajib):**
Gunakan panduan berikut untuk mengidentifikasi dan menganalisis paragraf deskriptif. Fokus pada jenis dan pola pengembangannya. Saat memberikan alasan (\`reasoning\`), sebutkan istilah yang relevan dari panduan ini (misalnya, "Alasan: Deskripsi ini terlalu *subjektif*. Saran ini membuatnya lebih *objektif* dengan menampilkan fakta yang dapat diamati.").

---
${descriptiveParagraphGuide}
---
` : '';

    const paragraphTypesPromptSection = improvementOptions.includes('paragraphTypes') ? `
**Panduan Jenis Paragraf (Referensi Wajib):**
Gunakan panduan berikut untuk mengidentifikasi jenis setiap paragraf dan mengevaluasi efektivitasnya. Saat memberikan alasan (\`reasoning\`), sebutkan jenis paragraf yang relevan dari panduan ini (misalnya, "Alasan: Sebagai *Paragraf Naratif*, ini terasa seperti daftar. Saran ini menambahkan detail emosional." atau "Alasan: *Paragraf Deskriptif* ini terlalu banyak 'memberitahu'. Saran ini lebih 'menunjukkan'.").

---
${paragraphTypesGuide}
---
` : '';

    const plotPacingPromptSection = improvementOptions.includes('plotPacing') ? `
${plotPacingGuide}
` : '';

    const paragraphPatternsPromptSection = improvementOptions.includes('paragraphPatterns') ? `
**Panduan Pola Pengembangan Paragraf (Referensi Wajib):**
Gunakan panduan berikut untuk mengidentifikasi dan mengevaluasi pola pengembangan yang digunakan dalam naskah. Saat memberikan alasan (\`reasoning\`), sebutkan secara eksplisit nama pola yang relevan (misalnya, "Alasan: Paragraf ini menggunakan *Pola Analogi* yang tidak jelas. Saran ini memberikan perbandingan yang lebih kuat.").

---
${paragraphPatternsGuide}
---
` : '';

    const punctuationPromptSection = improvementOptions.includes('punctuation') ? `
**Panduan Tanda Baca (Referensi Wajib):**
Gunakan panduan berikut untuk menganalisis penggunaan tanda baca dalam naskah. Saat memberikan alasan (\`reasoning\`), rujuk secara spesifik pada aturan yang relevan dari panduan ini (misalnya, "Alasan: Penggunaan *tanda koma* yang salah sebelum kata hubung 'namun' (Aturan Koma #2).", "Alasan: *Tanda titik* tidak boleh digunakan di akhir judul (Aturan Titik #7).").

---
${punctuationGuide}
---
` : '';
    
    const effectiveSentencePromptSection = improvementOptions.includes('effectiveSentences') ? `
**Panduan Kalimat Efektif (Referensi Wajib):**
Gunakan panduan berikut untuk menganalisis setiap kalimat. Fokus pada semua syarat dan ciri-ciri kalimat efektif. Saat memberikan alasan (\`reasoning\`), sebutkan secara eksplisit prinsip yang relevan (misalnya, "Alasan: Kalimat ini *tidak sistematis* karena subjeknya tidak jelas.", "Alasan: Kalimat ini *bertele-tele*, saran ini membuatnya lebih ringkas.", "Alasan: Melanggar prinsip *kesejajaran bentuk*.").

---
${effectiveSentenceGuide}
---
` : '';


    const prompt = `Anda adalah seorang editor naskah profesional kelas dunia dengan spesialisasi dalam fiksi sastra. Tugas Anda adalah menganalisis dan memberikan saran perbaikan untuk naskah berikut.

Tujuan utama Anda adalah membantu penulis meningkatkan kualitas tulisan mereka. Jangan menulis ulang seluruh teks, tetapi berikan saran yang spesifik dan dapat ditindaklanjuti yang benar-benar meningkatkan tulisan. **Hindari penggunaan markdown (seperti *, #) atau penanda naratif non-standar seperti "— " dalam saran Anda. Tulis ulang teks secara langsung dan bersih.**

**Prinsip-Prinsip Penyuntingan Utama:**
Selalu pertimbangkan hal-hal berikut saat memberikan saran, bahkan jika tidak secara eksplisit diminta:
- **Analisis Inti Mendalam**: Jika analisis tata bahasa, tanda baca, atau kalimat efektif diminta, lakukan analisis yang sangat teliti. Anda HARUS merujuk pada panduan spesifik yang disediakan untuk area ini dan memberikan alasan yang jelas dan berbasis aturan untuk setiap saran.
- **Tata Bahasa & Tanda Baca**: Identifikasi dan perbaiki kesalahan tata bahasa, ejaan, dan penggunaan tanda baca yang salah secara cermat.
- **Pemilihan Kata & Struktur Kalimat**: Identifikasi kalimat yang terlalu panjang, canggung, atau berbelit-belit. Tawarkan perbaikan konkret untuk meningkatkan kejelasan, alur, dan dampak. Sarankan alternatif untuk kata-kata yang diulang.
- **Konsistensi Gaya**: Pastikan gaya penulisan, nada, dan suara narator konsisten di seluruh naskah.
${grammarPromptSection}
${punctuationPromptSection}
${effectiveSentencePromptSection}
${paragraphPromptSection}
${descriptiveParagraphPromptSection}
${paragraphTypesPromptSection}
${plotPacingPromptSection}
${paragraphPatternsPromptSection}
**Naskah untuk Dianalisis:**
"""
${manuscriptText}
"""

**Fokus Perbaikan yang Diminta:**
${optionsPrompt}

**Instruksi Output:**
Hanya berikan balasan dalam format JSON yang valid, sesuai dengan skema yang diberikan.
1.  **summaryOfChanges**: Berikan ringkasan umum yang insightful (2-3 kalimat) tentang kekuatan naskah dan area utama untuk perbaikan berdasarkan permintaan.
2.  **detailedChanges**: Berikan array berisi 5-7 saran perbaikan yang paling berdampak. Jika Anda tidak dapat menemukan saran, kembalikan array kosong. Untuk setiap saran:
    *   **original**: Kutip segmen teks asli yang bermasalah (buat sesingkat mungkin, tetapi cukup untuk konteks).
    *   **suggestion**: Tulis ulang segmen tersebut dengan perbaikan yang disarankan.
    *   **reasoning**: Jelaskan secara singkat dan jelas mengapa perubahan ini meningkatkan kualitas tulisan, mengacu pada prinsip-prinsip penceritaan (misalnya, 'menunjukkan, bukan memberitahu', laju, suara karakter, dll.).
3.  **Aturan Dialog**: Dalam semua saran Anda, pastikan dialog mengikuti aturan penulisan standar. Setiap baris dialog dari pembicara baru harus dimulai pada paragraf baru. Jangan pernah menggabungkan dialog dan narasi dalam satu paragraf jika dialog tersebut diucapkan oleh karakter.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summaryOfChanges: { type: Type.STRING },
            detailedChanges: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        original: { type: Type.STRING },
                        suggestion: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["original", "suggestion", "reasoning"]
                }
            }
        },
        required: ["summaryOfChanges", "detailedChanges"]
    };

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        return JSON.parse(response.text) as {
            summaryOfChanges: string;
            detailedChanges: { original: string; suggestion: string; reasoning: string }[];
        };
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for manuscript improvement: ${message}`, error);
        throw new Error(message);
    }
};

export const applyManuscriptFixes = async (
    originalText: string,
    changes: { original: string; suggestion: string; reasoning: string }[]
): Promise<string> => {
    const changesString = changes.map(c => `- Ganti "${c.original}" dengan "${c.suggestion}" karena ${c.reasoning}`).join('\n');

    const prompt = `Anda adalah seorang editor naskah yang ahli. Tugas Anda adalah menulis ulang naskah berikut secara keseluruhan, dengan menerapkan semua perbaikan yang disarankan secara mulus dan alami.
    
Pastikan alur cerita tetap utuh dan gaya penulisan menjadi lebih baik. Jangan menambahkan komentar, catatan, atau format markdown apa pun. Secara khusus, hindari penggunaan asteris (*) untuk penekanan dan jangan memulai paragraf atau dialog dengan "— " (em dash diikuti spasi). Hanya kembalikan teks lengkap dari naskah yang telah direvisi dalam format novel standar.

**Aturan Penting Mengenai Dialog:** Pastikan semua dialog diformat dengan benar. Setiap kali seorang pembicara baru berbicara, dialog mereka harus dimulai pada paragraf baru. Jangan menggabungkan dialog dari pembicara yang berbeda, atau dialog dengan narasi, dalam paragraf yang sama.

**Naskah Asli:**
"""
${originalText}
"""

**Perbaikan yang Harus Diterapkan:**
${changesString}

**Output (Hanya Teks Naskah yang Telah Direvisi):**
`;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Gemini API call failed for manuscript revision: ${message}`, error);
        throw new Error(message);
    }
};
