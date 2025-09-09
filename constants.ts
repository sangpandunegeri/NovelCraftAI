

import type { Character, Location, NovelObject, NovelData, Reference } from './types';

export const GENRES: string[] = ["Fantasi", "Fiksi Ilmiah (Sci-Fi)", "Misteri", "Thriller", "Horor", "Romansa", "Petualangan", "Fiksi Sejarah", "Distopia", "Utopia", "Cyberpunk", "Steampunk", "Fantasi Urban", "Paranormal", "Fiksi Spekulatif", "Fiksi Kontemporer", "Fiksi Sastra"];

export const WRITING_STYLES: { name: string; description: string }[] = [
    { name: 'Gaya J.K. Rowling', description: 'Deskriptif, efektif, dan dramatis. Hebat dalam membangun dunia yang imersif dan karakter yang mudah diingat.' },
    { name: 'Gaya Tere Liye', description: 'Sederhana, menyentuh hati, dan sarat dengan pesan moral. Mengalir dengan lancar dan mudah diikuti.' },
    { name: 'Gaya Dee Lestari', description: 'Puitis, filosofis, dan intelektual. Seringkali menggunakan metafora yang kompleks dan struktur kalimat yang kaya.' },
    { name: 'Gaya Agatha Christie', description: 'Didorong oleh plot, penuh ketegangan, dan twist yang cerdas. Prosa yang bersih dan tepat sasaran.' },
    { name: 'Gaya Sir Arthur Conan Doyle', description: 'Formal, mendetail, dan logis. Berfokus pada observasi tajam dan penalaran deduktif.' },
    { name: 'Gaya Stephen King', description: 'Bahasa sehari-hari, monolog internal yang mendalam, dan membangun ketegangan secara perlahan. Ahli dalam horor psikologis.' },
    { name: 'Gaya Gillian Flynn', description: 'Gelap, psikologis, dan sering menggunakan narator yang tidak dapat diandalkan. Prosa yang tajam dan sinis.' },
    { name: 'Gaya H.P. Lovecraft', description: 'Kaya akan kata sifat, horor kosmik, dan menciptakan rasa takut terhadap hal yang tidak diketahui.' },
    { name: 'Gaya Jane Austen', description: 'Cerdas, satir, dan fokus pada komentar sosial dan hubungan karakter. Prosa yang elegan.' },
    { name: 'Gaya Ilana Tan', description: 'Ringan, romantis, dengan dialog yang mengalir alami. Populer untuk fiksi dewasa muda dan romansa.' },
    { name: 'Gaya J.R.R. Tolkien', description: 'Epik, sangat deskriptif, dengan nada formal. Membangun dunia yang mendalam dengan sejarah dan mitologi yang kaya.' },
    { name: 'Gaya Andrea Hirata', description: 'Puitis dengan sentuhan realisme magis. Sangat kuat dalam menggambarkan latar tempat dan suasana.' },
    { name: 'Gaya Pramoedya Ananta Toer', description: 'Historis, realistis, dengan komentar sosial dan politik yang kuat. Suara narasi yang kuat dan berwibawa.' }
];

export const GENRE_SPECIFICS: { [key: string]: { openings: string[], incidents: string[] } } = {
    'Fantasi': { openings: ['Penemuan artefak kuno.', 'Sebuah ramalan terungkap.', 'Sebuah portal ke dunia lain terbuka.', 'Upacara sakral terganggu.'], incidents: ['Orang terkasih diculik.', 'Kerajaan diserang.', 'Terpilih untuk membawa relik.', 'Bencana magis terjadi.'] },
    'Fiksi Ilmiah (Sci-Fi)': { openings: ['Sinyal aneh dari luar angkasa.', 'Sebuah eksperimen menjadi kacau.', 'Terbangun dari tidur kriogenik.', 'Sebuah kapal alien mendarat.'], incidents: ['AI mengambil alih.', 'Wabah alien menyebar.', 'Konspirasi perusahaan terungkap.', 'Anomali waktu mengancam kehidupan.'] },
    'Misteri': { openings: ['Sesosok mayat ditemukan.', 'Klien misterius datang.', 'Warisan berisi teka-teki.', 'Menyaksikan sebuah kejahatan.'], incidents: ['Petunjuk aneh ditemukan.', 'Saksi kunci menghilang.', 'Sebuah ancaman diterima.', 'Tersangka memiliki alibi sempurna.'] },
    'Thriller': { openings: ['Telepon misterius berdering.', 'Menyadari Anda sedang diikuti.', 'Paket anonim tiba.', 'Berita yang mencerminkan mimpi buruk.'], incidents: ['Dituduh melakukan kejahatan yang tidak Anda lakukan.', 'Anggota keluarga disandera.', 'Rahasia pemerintah terungkap.', 'Waktu hampir habis.'] },
    'Default': { openings: ['Sesuatu yang tak terduga terjadi.', 'Pertemuan tak disengaja.', 'Pagi yang luar biasa.', 'Keputusan yang menentukan.'], incidents: ['Sebuah perjalanan dimulai.', 'Sebuah rahasia terungkap.', 'Bahaya baru muncul.', 'Sebuah tantangan diberikan.'] }
};

export const WRITING_PROMPTS: { [key: string]: string[] } = {
    'Fantasi': [
        'Apa sistem sihir unik di duniamu, dan apa batasannya?',
        'Jelaskan artefak kuno yang menjadi pusat ceritamu. Dari mana asalnya dan mengapa itu penting?',
        'Jika protagonismu bisa berbicara dengan satu makhluk mitos, apa yang akan mereka tanyakan?',
        'Bagaimana sejarah konflik antara dua kerajaan utama di ceritamu?',
        'Apa hari libur atau festival paling penting dalam budayamu, dan mengapa?',
    ],
    'Fiksi Ilmiah (Sci-Fi)': [
        'Teknologi apa yang paling berdampak pada masyarakat dalam ceritamu, dan apa sisi negatifnya?',
        'Jelaskan pertemuan pertama manusia dengan spesies alien yang baru ditemukan.',
        'Apa dilema etis yang ditimbulkan oleh kemajuan AI di duniamu?',
        'Bagaimana perjalanan antarbintang memengaruhi psikologi dan fisiologi manusia?',
        'Apa sumber daya paling langka di galaksi, dan faksi mana yang memperebutkannya?',
    ],
    'Misteri': [
        'Apa petunjuk palsu (red herring) yang paling cerdik yang akan kamu tanamkan di awal cerita?',
        'Bagaimana hubungan detektif dengan korban sebelum pembunuhan terjadi?',
        'Jelaskan TKP dari sudut pandang saksi yang tidak dapat diandalkan.',
        'Apa rahasia yang disembunyikan detektif utamamu dari rekan-rekannya?',
        'Motif apa selain uang atau balas dendam yang bisa mendorong penjahatmu?',
    ],
    'Thriller': [
        'Bagaimana protagonismu secara tidak sengaja menempatkan diri mereka dalam bahaya?',
        'Jam terus berdetak. Apa tenggat waktu yang menakutkan yang harus dipenuhi oleh pahlawanmu?',
        'Apa ketakutan terbesar protagonismu, dan bagaimana penjahat memanfaatkannya?',
        'Jelaskan adegan kejar-kejaran di lokasi yang tidak biasa (misalnya, perpustakaan yang sunyi, taman hiburan yang ditinggalkan).',
        'Twist apa yang akan membuat pembaca mempertanyakan semua yang mereka pikir mereka tahu?',
    ],
     'Horor': [
        'Apa suara yang terus didengar oleh protagonis Anda saat mereka sendirian?',
        'Jelaskan sebuah objek biasa di rumah yang tiba-tiba menjadi sumber ketakutan.',
        'Bagaimana sebuah legenda urban lokal ternyata menjadi kenyataan bagi karakter Anda?',
        'Ketakutan masa kecil apa yang kembali menghantui protagonis Anda sebagai orang dewasa?',
        'Jelaskan entitas yang tidak bisa dilihat tetapi kehadirannya bisa dirasakan dengan jelas.',
    ],
    'Romansa': [
        'Bagaimana pertemuan pertama yang canggung antara dua karakter utama?',
        'Apa kesalahpahaman besar yang memisahkan pasangan utama?',
        'Jelaskan isyarat romantis yang gagal total tetapi malah memperkuat ikatan mereka.',
        'Rahasia apa yang disembunyikan satu pasangan dari yang lain, karena takut akan penolakan?',
        'Di lokasi apa yang tidak romantis sama sekali mereka menyadari perasaan mereka satu sama lain?',
    ],
    'Default': [
        'Apa keputusan terburuk yang pernah dibuat oleh protagonismu?',
        'Jelaskan momen yang menentukan masa kecil karakter utamamu.',
        'Apa yang paling diinginkan oleh karaktermu di dunia ini, dan apa yang bersedia mereka korbankan untuk itu?',
        'Bagaimana latar tempat mencerminkan keadaan emosional internal protagonismu?',
        'Siapa mentor atau panutan bagi karakter utamamu, dan apa pelajaran terpenting yang mereka ajarkan?',
    ]
};

export const ENDING_TYPES: string[] = ['Akhir Bahagia', 'Akhir Tragis', 'Menggantung', 'Pahit Manis'];

export const PLOT_POINTS: string[] = ['Belum Diatur', 'Pengenalan', 'Insiden Pemicu', 'Aksi Menanjak', 'Titik Tengah', 'Klimaks', 'Aksi Menurun', 'Penyelesaian'];

export const CHARACTER_ROLES: string[] = ['Belum Ditentukan', 'Protagonis', 'Antagonis', 'Deuteragonis', 'Tritagonis', 'Pemeran Pembantu', 'Figuran', 'Karakter Utama', 'Musuh Utama', 'Mentor', 'Anti-Hero'];

export const getNewCharacterTemplate = (): Character => ({ id: Date.now(), name: 'Karakter Baru', role: 'Belum Ditentukan', gender: '', age: '', country: '', faceDescription: '', hairDescription: '', clothingDescription: '', accessoryDescription: '', height: '', weight: '', bodyShape: '' });
export const getNewLocationTemplate = (): Location => ({ id: Date.now(), name: 'Lokasi Baru', description: '' });
export const getNewObjectTemplate = (): NovelObject => ({ id: Date.now(), name: 'Objek Baru', description: '' });
export const getNewReferenceTemplate = (): Reference => ({ id: Date.now(), title: 'Referensi Baru', content: '' });

/**
 * Factory function to create a new, clean novel data object.
 * Using a function ensures that a fresh object with new references is created
 * every time, preventing state mutation issues where an old state might persist
 * after a reset.
 */
export function getInitialNovelData(): NovelData {
    return {
        characters: [],
        locations: [],
        objects: [],
        references: [],
        chapters: [{ title: 'Bab 1', content: '', charactersInChapter: [], locationsInChapter: [], objectsInChapter: [], status: 'draft', plotPoint: 'Pengenalan' }],
        currentChapterIndex: 0,
        choices: {
            genre: null,
            writingStyle: 'Gaya J.K. Rowling',
            premise: '',
            synopsis: '',
            opening: null,
            incident: null,
        },
        plotStructure: {
            totalChapters: 10,
            conflictChapter: 3,
            climaxChapter: 8,
            ending: null,
            customEnding: '',
        },
    };
}
