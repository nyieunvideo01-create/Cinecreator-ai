import React, { useState, useEffect, useRef } from 'react';
import {
    Camera, Film, Copy, RefreshCw, Image as ImageIcon, Settings, Download, AlertCircle, Play,
    ChevronDown, ChevronUp, User, Upload, CheckCircle2, Sparkles, Hash, TrendingUp, FileText, Share2,
    Plus, Trash2, Layers
} from 'lucide-react';
/* cinecreator-patched */
const TEXT_MODEL = import.meta.env.VITE_TEXT_MODEL || "gemini-2.5-flash";
const IMAGE_MODEL = import.meta.env.VITE_IMAGE_MODEL || "gemini-2.5-flash-image";
const safeStore = {
    get: (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* storage diblokir */ } },
    remove: (k) => { try { window.localStorage.removeItem(k); } catch (e) { /* storage diblokir */ } }
};


const CustomSelect = ({ value, onChange, options, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-left text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
            >
                <span className="truncate">{selectedOption?.label}</span>
                <span className="text-gray-400 shrink-0 ml-2">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>
            
            {isOpen && !disabled && (
                <div className="absolute z-[100] w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                value === opt.value 
                                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold' 
                                    : 'text-white hover:bg-slate-700'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ============================================================
// KONFIGURASI PILIHAN (gaya visual, jenis konten, narasi, suara)
// ============================================================
const MAX_REFS = 4;

const NEGATIVE_PROMPT = "no text, no subtitles, no watermark, no logo, no extra limbs, no extra fingers, no deformed face, no face morphing, no outfit change, no character swap, no sudden scene cut, no flicker, no blur";

const STYLE_LIBRARY = [
    { value: "Cinematic Realistic", label: "Realistis (Cinematic 8K)", descriptor: "photorealistic cinematic film still, shot on 35mm anamorphic lens, natural skin texture, realistic lighting, shallow depth of field, subtle film grain, ultra detailed" },
    { value: "Semi-Realistic Digital Painting", label: "Semi Realistis (Digital Painting)", descriptor: "semi-realistic digital painting, realistic proportions with visible painterly brush strokes, soft cinematic lighting, refined detailed faces, rich color grading, concept-art quality" },
    { value: "Semi-Realistic Manhwa", label: "Semi Realistis (Manhwa / Webtoon)", descriptor: "semi-realistic Korean manhwa illustration, clean sharp lineart, realistic proportions, soft cel shading with glossy highlights, detailed expressive eyes, cinematic color palette" },
    { value: "Semi-Realistic 3D Render", label: "Semi Realistis (3D Render Halus)", descriptor: "stylized semi-realistic 3D render, soft subsurface skin shading, realistic proportions with slightly idealized features, volumetric lighting, Unreal Engine 5 quality" },
    { value: "Documentary Raw Realism", label: "Realistis Mentah (Kamera HP / Dokumenter)", descriptor: "raw handheld smartphone footage look, natural available light, candid unposed realism, slight lens imperfections, true-to-life colors, documentary authenticity" },
    { value: "3D Disney Pixar Animation", label: "Animasi 3D (Pixar Style)", descriptor: "3D animated feature-film style, expressive big-eyed characters, soft global illumination, vibrant saturated colors, polished smooth surfaces, warm family-friendly look" },
    { value: "2D Anime Style", label: "Anime Jepang (Studio Ghibli)", descriptor: "hand-painted 2D anime film style, soft watercolor backgrounds, gentle natural palette, expressive simple character design, atmospheric lighting" },
    { value: "Fantasy Epic Concept Art", label: "Fantasi Epik (Concept Art)", descriptor: "epic fantasy concept art, dramatic painterly composition, majestic scale, volumetric god rays, rich detailed environments, high-end game cinematic quality" },
    { value: "Watercolor Storybook", label: "Buku Cerita Watercolor", descriptor: "children's storybook watercolor illustration, soft bleeding washes, gentle pencil outlines, warm textured paper, whimsical charming mood" },
    { value: "Comic Book Graphic Novel", label: "Komik / Graphic Novel", descriptor: "graphic novel comic style, bold ink lines, halftone shading, dynamic dramatic angles, limited punchy color palette" },
    { value: "Claymotion Animation", label: "Animasi Claymotion (Aardman Style)", descriptor: "stop-motion claymation look, handmade plasticine textures, visible fingerprints, miniature set lighting, charming imperfect motion" },
    { value: "Vintage Documentary", label: "Dokumenter Klasik (Vintage)", descriptor: "vintage 1970s documentary film look, warm faded colors, 16mm film grain, soft vignette, archival footage feel" },
    { value: "Cyberpunk Neon", label: "Cyberpunk / Futuristik", descriptor: "cyberpunk neon-noir look, rain-soaked streets, glowing magenta and cyan lights, high contrast, futuristic urban atmosphere" },
    { value: "Dark Horror", label: "Dark Horror / Misteri", descriptor: "dark horror cinematic look, low-key lighting, deep shadows, desaturated cold tones, fog and eerie atmosphere, unsettling mood" },
    { value: "Minimalist Vector", label: "Vektor Minimalis", descriptor: "minimalist flat vector illustration, clean geometric shapes, limited harmonious color palette, simple shading, modern graphic design" }
];

const getStyleDescriptor = (value) => STYLE_LIBRARY.find(s => s.value === value)?.descriptor || value;

const CONTENT_TYPES = [
    { value: "Otomatis", label: "🤖 Otomatis (Deteksi dari Topik)", instruction: "Analyze the user's input (\"**TOPIC**\") to automatically determine whether it is a tutorial, factual mini-documentary, drama, fantasy, comedy, mystery, news, or promo. Adapt the structure, pacing, vocabulary and narrative flow to match that style perfectly." },
    { value: "Fakta / Edukasi", label: "🧠 Fakta Menarik / Edukasi Populer", instruction: "Highly factual, pop-science style. Open with a curiosity hook (e.g. 'Tahu nggak...?'). Each scene delivers ONE surprising fact that builds on the previous one, ending with a mind-blowing final fact or a question that invites comments." },
    { value: "Storytelling / Drama", label: "🎭 Storytelling & Drama (Alur Plot)", instruction: "Emotional narrative with a clear protagonist who WANTS something, an obstacle, rising tension, a climax and a resolution. Focus on character emotion, subtext in dialogue and immersion." },
    { value: "Drama Hikmah / Keluarga", label: "🏠 Drama Hikmah / Keluarga (Ringan & Menyentuh)", instruction: "Light, relatable everyday-life story (family, neighbors, workplace, small kindness) with a gentle emotional turn and a heartfelt moral that is shown through action, never lectured. Warm, universal, suitable for all ages." },
    { value: "Fantasi / Petualangan", label: "🐉 Fantasi / Petualangan (Naga & Makhluk Fantasi)", instruction: "Fantasy adventure with a magical creature or world. Establish the rules of the magic/creature early, give the hero a clear quest, escalate danger, and pay off with a wonder-filled climax and emotional bond." },
    { value: "Cerita Hewan / Fabel", label: "🐾 Cerita Hewan / Fabel", instruction: "Animal-centered story with strong emotion and personality (loyalty, rescue, friendship, rivalry). Animals act with clear intentions and expressive body language; end with a touching or surprising payoff." },
    { value: "Komedi / Lucu", label: "😂 Komedi / Lucu", instruction: "Comedy with a clear setup → escalation → punchline structure. Use running gags, comic timing, exaggerated reactions and a final twist punchline in the last scene." },
    { value: "Romantis / Percintaan", label: "💕 Romantis / Percintaan", instruction: "Romance with chemistry: meet/spark, tension or misunderstanding, emotional vulnerability moment, and a satisfying or bittersweet ending. Keep it tasteful and family-friendly." },
    { value: "Misteri / Creepypasta", label: "👻 Misteri / Horor Menegangkan", instruction: "Heavy suspense: eerie environments, psychological tension, slow reveal, rhetorical questions and dramatic pauses. The final scenes must deliver a shocking twist or cliffhanger." },
    { value: "Aksi / Thriller", label: "💥 Aksi / Thriller", instruction: "Fast-paced action/thriller: ticking clock, clear stakes, escalating set-pieces, reversal in the second half, and a high-impact finale. Keep geography of the action clear and easy to follow." },
    { value: "Motivasi / Inspirasi", label: "🔥 Motivasi / Inspirasi", instruction: "Inspirational mini-story or monologue: relatable struggle, turning point, and an actionable takeaway. Strong emotional hook in scene 1 and a memorable closing line." },
    { value: "Tutorial / How-To", label: "🛠️ Tutorial / Langkah-demi-Langkah", instruction: "Chronological step-by-step instructions. Show the final result in Scene 1 to grab attention, then Step 1, Step 2, etc. Keep every step practical, clear and visually demonstrable." },
    { value: "Berita / Opini", label: "📰 Berita Hangat / Opini Tren", instruction: "Urgent, journalistic and trending. Breaking-news hook, context, analysis, implications, and a closing question that sparks comments. Stay balanced and avoid unverified claims." },
    { value: "Sejarah / Dokumenter", label: "🏛️ Sejarah / Mini Dokumenter", instruction: "Mini documentary about a historical event or figure told chronologically with dramatic tension, clear cause-and-effect, and a reflective ending on legacy. Stay accurate and avoid inventing facts." },
    { value: "Dongeng / Cerita Anak", label: "🧸 Dongeng / Cerita Anak", instruction: "Child-friendly fairy tale or fable with simple clear language, a lovable hero, a gentle challenge, repetition/rhythm that kids enjoy, and a positive moral at the end." },
    { value: "Iklan / Promosi Produk", label: "🛍️ Iklan / Promosi Produk", instruction: "Short-form ad: hook with a relatable problem, introduce the product as the natural solution, show 2-3 concrete benefits visually, social proof or result, and a clear call-to-action in the last scene. No exaggerated or false claims." }
];

const NARRATIVE_OPTIONS = [
    { value: "Otomatis", label: "🤖 Otomatis (Rekomendasi AI)", narrator: true, dialogue: true, instruction: "Automatically choose the best script style for the format: narrator only for educational/tutorial/news; a blend of narrator and character dialogue for drama, fantasy, comedy, mystery. Prefer SHOWING through visuals and dialogue over explaining." },
    { value: "Hanya Narator (Voice Over)", label: "🎙️ Hanya Narator (Tanpa Dialog Langsung)", narrator: true, dialogue: false, instruction: "Narrator voice-over ONLY. 'dialogue' must be an empty array in every scene. Narration should add meaning, emotion or context — never merely describe what is already visible." },
    { value: "Narator + Dialog Karakter", label: "🎭 Campuran (Narator + Dialog Karakter)", narrator: true, dialogue: true, instruction: "Blend narrator voice-over with direct character dialogue. Use the narrator for context and inner feeling, dialogue for conflict and emotion. Do not let them repeat the same information." },
    { value: "Hanya Dialog Karakter", label: "💬 Full Dialog (Percakapan Karakter)", narrator: false, dialogue: true, instruction: "Character dialogue ONLY. 'voice_over' must be an empty string in every scene. Dialogue must be natural, in-character, with subtext, interruptions and emotion — not exposition dumps." },
    { value: "Monolog Batin (Inner Voice)", label: "🧠 Monolog Batin (Suara Hati Tokoh Utama)", narrator: true, dialogue: false, instruction: "The 'voice_over' is the protagonist's first-person inner monologue (thoughts and feelings), personal and intimate. No dialogue between characters." },
    { value: "Tanpa Narasi & Dialog (Visual + Musik/SFX)", label: "🎬 Tanpa Narasi & Dialog (Visual + Musik/SFX)", narrator: false, dialogue: false, instruction: "NO spoken words at all: 'voice_over' must be an empty string and 'dialogue' an empty array. Tell the story purely through visuals, acting, facial expressions, music and sound effects. 'on_screen_text' may be used very sparingly (max 6 words) only when essential. Put the full emotional intent in 'audio_direction'." },
    { value: "Teks di Layar Saja (On-screen Text)", label: "🔤 Teks di Layar Saja (Tanpa Suara)", narrator: false, dialogue: false, instruction: "NO voice. 'voice_over' empty and 'dialogue' empty. Tell the story with short punchy on-screen text captions (max 10 words per scene) in 'on_screen_text', plus visuals, music and SFX in 'audio_direction'." }
];

const VOICE_OPTIONS = [
    { value: "Otomatis", label: "🤖 Otomatis (Sesuai Topik)", instruction: "Determine ONE consistent, highly specific voice character (gender, approximate age, exact vocal tone/emotion, pace) that best fits the topic." },
    { value: "Pria - Dokumenter Epik", label: "🎙️ Pria Dewasa - Dokumenter Epik (Berat)", instruction: "Deep, authoritative adult male voice, epic documentary style, serious and engaging tone, slow confident pace." },
    { value: "Pria Muda - Tiktok Ceria", label: "📱 Pria Muda - TikTok Ceria (Cepat)", instruction: "Young adult male voice, highly energetic, fast-paced, friendly Gen-Z TikTok/Reels influencer style." },
    { value: "Wanita - Menegangkan", label: "🕵️‍♀️ Wanita Dewasa - Misteri/Menegangkan", instruction: "Adult female voice, mysterious and suspenseful, almost whispering but clear, suitable for horror or true-crime." },
    { value: "Wanita Muda - Santai", label: "☕ Wanita Muda - Santai (Vlog Style)", instruction: "Young adult female voice, relaxed, conversational, friendly, soft-spoken vlogger style." },
    { value: "Pria Dewasa - Hangat (Hikmah)", label: "🤝 Pria Dewasa - Hangat (Cerita Hikmah)", instruction: "Warm adult male voice (35-45), gentle, wise, slightly husky, calm storytelling pace, sincere emotional tone." },
    { value: "Wanita Dewasa - Lembut (Hikmah)", label: "🌸 Wanita Dewasa - Lembut (Cerita Hikmah)", instruction: "Warm adult female voice (30-40), soft, empathetic, gentle storytelling pace, sincere emotional tone." },
    { value: "Anak Laki - Penasaran", label: "👦 Anak Laki-laki - Ceria & Penasaran", instruction: "Young boy voice (8-10 years old), curious, slightly dramatic, highly expressive and energetic." },
    { value: "Anak Perempuan - Ceria", label: "👧 Anak Perempuan - Manis & Ceria", instruction: "Young girl voice (8-10 years old), sweet, cheerful, innocent, highly expressive and engaging." }
];

// ---------- Helper murni (tanpa state) ----------
const compressImageFile = (file, maxSize = 1024) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("File gambar tidak valid."));
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
            resolve({ dataUrl, base64: dataUrl.split(",")[1], mime: "image/jpeg" });
        };
        img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
});

const parseDataUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    return m ? { mime: m[1], data: m[2] } : null;
};

const parseJsonLoose = (raw) => {
    let t = (raw || "").replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstObj = t.indexOf("{");
    const firstArr = t.indexOf("[");
    const start = firstObj === -1 ? firstArr : (firstArr === -1 ? firstObj : Math.min(firstObj, firstArr));
    const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    if (start === -1 || end === -1) throw new Error("Respons AI bukan JSON.");
    return JSON.parse(t.slice(start, end + 1));
};

const callGemini = async (apiKey, model, body) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
        const msg = data.error?.message || `API Error ${res.status}`;
        if (res.status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) {
            throw new Error("Kuota API gratis habis atau terlalu banyak permintaan. Tunggu 1 menit lalu coba lagi, atau cek sisa kuota di Google AI Studio.");
        }
        if ((res.status === 400 && /API key/i.test(msg)) || res.status === 403) {
            throw new Error("API key tidak valid atau tidak punya akses. Periksa kembali key Anda.");
        }
        throw new Error(msg);
    }
    return data;
};

const truncateWords = (text, n) => {
    const w = String(text || "").split(/\s+/).filter(Boolean);
    return w.length > n ? w.slice(0, n).join(" ") + "…" : w.join(" ");
};

const resolveById = (list, key) => {
    if (!key) return null;
    const k = String(key).toLowerCase();
    return (list || []).find(x => String(x.id).toLowerCase() === k || (x.name && x.name.toLowerCase() === k)) || null;
};

const buildArcPlan = (n) => {
    if (n <= 3) {
        return ["Scene 1: HOOK + SETUP (tangkap perhatian dalam 2 detik pertama, kenalkan tokoh & tujuan)", "Scene 2: KONFLIK / KLIMAKS (puncak masalah atau penemuan)", "Scene 3: RESOLUSI & PAYOFF (jawaban, emosi, pesan atau twist penutup)"].slice(0, n).join("\n");
    }
    const plan = [];
    for (let i = 1; i <= n; i++) {
        if (i === 1) plan.push("Scene 1: HOOK (pattern interrupt / pertanyaan / momen paling menarik, langsung ke aksi)");
        else if (i === n) plan.push(`Scene ${i}: RESOLUSI & PAYOFF (akibat dari klimaks, jawaban atas hook, pesan/twist penutup yang bisa di-loop ke scene 1)`);
        else if (i === n - 1) plan.push(`Scene ${i}: KLIMAKS (puncak emosi / konfrontasi / penemuan terbesar)`);
        else if (i === 2) plan.push("Scene 2: SETUP (kenalkan tokoh, tujuan, dan situasi dengan cepat)");
        else if (i === 3) plan.push("Scene 3: INCITING INCIDENT (masalah / kejutan muncul, tujuan terancam)");
        else plan.push(`Scene ${i}: ESKALASI / TITIK BALIK (tekanan naik, taruhan membesar, ada keputusan atau penemuan)`);
    }
    return plan.join("\n");
};

// Susun prompt final secara deterministik di kode (bukan mengandalkan AI menyalin teks),
// supaya karakter, lokasi, dan gaya SELALU identik di setiap scene.
const buildSceneObject = (s, index, bible, ctx) => {
    const chars = (Array.isArray(s.characters_in_scene) ? s.characters_in_scene : []).map(k => resolveById(bible.characters, k)).filter(Boolean);
    const loc = resolveById(bible.locations, s.location_id);
    const styleLock = `${ctx.styleDesc}${bible.color_palette ? `, dominant colors: ${bible.color_palette}` : ""}`;
    const castText = chars.map(c => `${c.name} — ${c.visual_lock}`).join(" | ");
    const locText = loc ? `${loc.name} — ${loc.visual_lock}` : "";
    const dialogue = (Array.isArray(s.dialogue) ? s.dialogue : []).filter(d => d && d.line);
    const vo = ctx.narrator ? String(s.voice_over || "").trim() : "";

    const lines = [];
    if (vo) lines.push(dialogue.length ? `Narator: ${vo}` : vo);
    dialogue.forEach(d => lines.push(`${d.speaker || "Karakter"}: "${d.line}"${d.emotion ? ` (${d.emotion})` : ""}`));
    if (s.on_screen_text) lines.push(`[Teks layar] ${s.on_screen_text}`);
    const narration = lines.length ? lines.join("\n") : "(Tanpa narasi — hanya visual, musik & SFX)";

    const voiceParts = [];
    if (vo && bible.narrator_voice) voiceParts.push(`Narator: ${bible.narrator_voice}`);
    const seen = new Set();
    dialogue.forEach(d => {
        const c = resolveById(bible.characters, d.speaker);
        if (c && !seen.has(c.id) && c.voice_profile) {
            seen.add(c.id);
            voiceParts.push(`${c.name}: ${c.voice_profile}`);
        }
    });

    const audioBits = [];
    dialogue.forEach(d => audioBits.push(`${d.speaker || "Character"}${d.emotion ? ` (${d.emotion})` : ""} says in ${ctx.lang}: "${d.line}"`));
    if (vo) audioBits.push(`Voice-over in ${ctx.lang}: "${vo}"`);
    if (s.audio_direction) audioBits.push(`Music/SFX: ${s.audio_direction}`);

    const lighting = s.lighting || s.time_and_mood || "";
    const image_prompt = [
        `[Style] ${styleLock}.`,
        castText && `[Characters — keep identical] ${castText}.`,
        locText && `[Location] ${locText}.`,
        s.state_tracker && `[State] ${s.state_tracker}.`,
        `[First frame] ${s.first_frame_action}.`,
        s.camera && `[Camera] ${s.camera}.`,
        lighting && `[Lighting] ${lighting}.`,
        `Aspect ratio ${ctx.ratio}. Coherent anatomy, sharp details.`
    ].filter(Boolean).join("\n");

    const video_prompt = [
        `[Style] ${styleLock}`,
        castText && `[Characters — identical in every shot] ${castText}`,
        locText && `[Location] ${locText}`,
        s.state_tracker && `[Continuity] ${s.state_tracker}`,
        `[Action — ${ctx.dur}s, one continuous shot, no cuts] ${s.motion_action}`,
        s.camera && `[Camera] ${s.camera}`,
        lighting && `[Lighting/Mood] ${lighting}`,
        `[Aspect ratio] ${ctx.ratio}`
    ].filter(Boolean).join("\n");

    const video_prompt_short = [
        truncateWords(ctx.styleDesc, 14) + ".",
        chars.map(c => `${c.name}: ${truncateWords(c.visual_lock, 22)}`).join("; ") + (chars.length ? "." : ""),
        /[.!?]$/.test(String(s.motion_action || "").trim()) ? s.motion_action : `${s.motion_action}.`,
        s.camera && `Camera: ${s.camera}.`,
        lighting && `${lighting}.`
    ].filter(Boolean).join(" ");

    return {
        ...s,
        scene_number: s.scene_number || index + 1,
        narration,
        narration_style_direction: voiceParts.join("\n"),
        audio_prompt: audioBits.join("\n"),
        image_prompt,
        video_prompt,
        video_prompt_short,
        negative_prompt: NEGATIVE_PROMPT,
        visual_description: image_prompt,
        generatedImage: null
    };
};

const CopyMini = ({ onCopy }) => (
    <button 
        onClick={onCopy}
        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 transition"
    >
        Salin
    </button>
);

const App = () => {
    // --- State Management ---
    const [apiKey, setApiKey] = useState(() =>
        safeStore.get("cinecreator_api_key") || safeStore.get("cinefact_api_key") || ""
    );
    const [topic, setTopic] = useState("");
    const [contentType, setContentType] = useState("Otomatis");
    const [theme, setTheme] = useState("Cinematic Realistic");
    const [ratio, setRatio] = useState("9:16");
    const [sceneCount, setSceneCount] = useState(5);
    const [language, setLanguage] = useState("Bahasa Indonesia");
    const [customLanguage, setCustomLanguage] = useState("");

    // --- Narrative & Dialogue Style States ---
    const [narratorVoice, setNarratorVoice] = useState("Otomatis");
    const [narrativeStyle, setNarrativeStyle] = useState("Otomatis");

    // --- Multi Reference (karakter / lokasi / objek) ---
    const [references, setReferences] = useState([]); 
    const [isAnalyzingRefs, setIsAnalyzingRefs] = useState(false);
    const [useReferences, setUseReferences] = useState(true);
    const [chainScenes, setChainScenes] = useState(true);
    const [lockLocation, setLockLocation] = useState(false);
    const [sceneDuration, setSceneDuration] = useState(8);
    const [storyMeta, setStoryMeta] = useState(null); 

    // --- Thumbnail Feature States ---
    const [activeTab, setActiveTab] = useState("storyboard"); // "storyboard" | "thumbnail" | "caption"
    const [thumbnailOverlayText, setThumbnailOverlayText] = useState("");
    const [thumbnailStyle, setThumbnailStyle] = useState("match_main");
    const [thumbnailImage, setThumbnailImage] = useState(null);
    const [thumbnailPrompt, setThumbnailPrompt] = useState("");
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [thumbnailSuggestions, setThumbnailSuggestions] = useState([]);
    const [overlayPosition, setOverlayPosition] = useState("bottom"); 
    const [overlayColor, setOverlayColor] = useState("#facc15"); 

    // --- Caption, Title, & Hashtag Feature States ---
    const [socialCaptions, setSocialCaptions] = useState(null);
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
    const [activeCaptionSubtab, setActiveCaptionSubtab] = useState("shorts"); // "shorts" | "instagram" | "youtube"

    const [scenes, setScenes] = useState([]);
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [loadingImages, setLoadingImages] = useState({}); 

    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [guideStep, setGuideStep] = useState(1);
    const [tempKey, setTempKey] = useState("");

    const [errorMsg, setErrorMsg] = useState("");
    const [copySuccess, setCopySuccess] = useState(""); 
    const [isDemo, setIsDemo] = useState(false); 

    const DEMO_STORIES = [
        {
            topic_keyword: "laut",
            title: "3 Fakta Mengerikan Palung Mariana",
            scenes: [
                {
                    scene_number: 1,
                    narration_style_direction: "Suara pria dewasa, berat, misterius, tempo lambat, gaya dokumenter horor.",
                    narration: "Palung Mariana. Titik terdalam di bumi kita yang menyimpan kegelapan abadi. Lebih dalam dari tinggi Gunung Everest jika dibalik.",
                    visual_description: "A dark deep ocean trench, faint beams of sunlight fading into a pitch-black abyss, cinematic.",
                    video_prompt: "Cinematic shot of deep ocean abyss, dark underwater trench, faint light rays filtering from above fading into complete darkness, highly detailed water particles, 8k --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=80"
                },
                {
                    scene_number: 2,
                    narration_style_direction: "Suara pria dewasa, berat, misterius, tempo lambat, gaya dokumenter horor.",
                    narration: "Di kedalaman sebelas ribu meter, tekanan airnya setara dengan ditindih lima puluh pesawat jet tempur sekaligus. Hancur seketika.",
                    visual_description: "Crushing deep ocean pressure visualization, robotic submarine navigating dark waters with searchlights.",
                    video_prompt: "High-tech research submarine navigating through the pitch-black deep sea, bright searchlights illuminating mysterious rock formations, bubbles, realistic CGI, cinematic lighting --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                },
                {
                    scene_number: 3,
                    narration_style_direction: "Suara pria dewasa, berat, misterius, tempo lambat, gaya dokumenter horor.",
                    narration: "Namun anehnya, di lingkungan se-ekstrem ini, ilmuwan masih menemukan kehidupan asing. Monster laut nyata yang berevolusi tanpa cahaya matahari.",
                    visual_description: "Bioluminescent deep sea creature glowing in the pitch black ocean.",
                    video_prompt: "Bioluminescent alien-like deep sea creature, glowing with neon blue and purple lights in the dark ocean, transparent skin, cinematic, highly detailed, Unreal Engine 5 render --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"
                }
            ],
            social_media: {
                titles: [
                    "😱 FAKTA GILA PALUNG MARIANA: Ditindih 50 Jet Tempur?!",
                    "Ada Monster Nyata di Dasar Bumi? Ini Buktinya!",
                    "Jangan Sekali-kali Masuk Sini! Misteri Laut Dalam Mariana",
                    "Titik Terdalam Bumi yang Melebihi Tinggi Gunung Everest!",
                    "Palung Mariana: Tempat Tergelap yang Menyimpan Misteri Abadi"
                ],
                caption_shorts: "Pernah bayangin gak sih ditindih 50 jet tempur sekaligus? 😱 Itulah tekanan mengerikan di dasar Palung Mariana! Tonton sampai habis untuk lihat monsternya! 👇",
                caption_instagram: "Palung Mariana 🌊 Titik terdalam di bumi kita yang menyimpan kegelapan abadi. Lebih dalam dari tinggi Gunung Everest jika dibalik! Di kedalaman 11.000 meter, tekanan airnya setara dengan ditindih 50 pesawat jet tempur sekaligus. Hancur seketika!\n\nNamun anehnya, ilmuwan masih menemukan kehidupan asing di sana... Monster laut nyata tanpa cahaya matahari! Bagaimana menurut kalian? Tulis di kolom komentar! 👇✨",
                caption_youtube: "Misteri Palung Mariana: Menguak Fakta Mengerikan di Titik Terdalam Bumi.\n\nPalung Mariana adalah palung terdalam di dunia yang terletak di barat Samudra Pasifik. Di video ini, kita akan menjelajahi kedalaman ekstrem yang mencapai hampir 11.000 meter di bawah permukaan laut. Mengapa tempat ini sangat berbahaya dan tekanan airnya mampu menghancurkan kapal baja sekalipun? Bagaimana kehidupan unik berteduh di dalam kegelapan tanpa sinar matahari?\n\nJangan lupa Like, Comment, dan Subscribe untuk terus mendapatkan info sains terpopuler lainnya!",
                hashtags: ["#PalungMariana", "#MisteriLaut", "#DeepSea", "#InfoUnik", "#Edukasi", "#Sains", "#FaktaMengerikan", "#Lautan", "#SainsPopuler", "#TikTokPintar"]
            }
        },
        {
            topic_keyword: "luar angkasa",
            title: "Misteri Planet Mars yang Menyeramkan",
            scenes: [
                {
                    scene_number: 1,
                    narration_style_direction: "Suara pria dewasa, tenang, penuh wibawa, gaya dokumenter sains.",
                    narration: "Mars, tetangga terdekat kita yang tampak mati dan gersang. Namun, planet merah ini menyimpan rahasia masa lalu yang mencengangkan.",
                    visual_description: "Wide shot of Mars red dusty landscape with mountains in the background, cinematic.",
                    video_prompt: "Cinematic wide shot of Mars surface, red dusty landscape, massive craters and canyon walls, thin orange atmosphere, highly detailed realistic space photography --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80"
                },
                {
                    scene_number: 2,
                    narration_style_direction: "Suara pria dewasa, tenang, penuh wibawa, gaya dokumenter sains.",
                    narration: "Miliaran tahun lalu, Mars diprediksi memiliki samudra air cair yang sangat luas seperti bumi. Ke mana perginya semua air itu?",
                    visual_description: "An ancient Mars with blue oceans and green land, transition to dry red planet.",
                    video_prompt: "Terraformed Mars with blue oceans and rivers transition effect into dry red sandy planet, satellite view, cosmic background, high quality visualization --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
                },
                {
                    scene_number: 3,
                    narration_style_direction: "Suara pria dewasa, tenang, penuh wibawa, gaya dokumenter sains.",
                    narration: "Kini, Mars terus dihantam badai debu raksasa yang menutupi seluruh permukaan planet selama berbulan-bulan. Apakah manusia sanggup bertahan di sana?",
                    visual_description: "Astronaut standing on Mars surface looking at a massive incoming red dust storm.",
                    video_prompt: "Lonely astronaut in a high-tech spacesuit standing on red soil, looking at a colossal dust storm approaching, cinematic sci-fi lighting, dramatic atmosphere --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
                }
            ],
            social_media: {
                titles: [
                    "🚀 TERBONGKAR! Misteri Masa Lalu Mars yang Mengerikan!",
                    "Dulunya Mars Ternyata Punya Samudra Biru Seluas Bumi?",
                    "Astronot Terjebak Badai Debu Raksasa Mars Selama Berbulan-bulan!",
                    "Misteri Kemanakah Perginya Semua Air di Planet Mars?",
                    "Fakta Gila Planet Mars yang Jarang Diketahui Orang!"
                ],
                caption_shorts: "Mars ternyata gak selamanya gersang dan mati! 🚀 Miliaran tahun lalu planet merah ini punya samudra luas layaknya bumi kita... Ke mana perginya air itu? 👇",
                caption_instagram: "Misteri Terbesar Planet Mars! 🚀🌌 Banyak yang mengira Mars selalu gersang, merah, dan mati. Namun, ilmuwan meyakini miliaran tahun lalu Mars adalah planet biru yang dipenuhi samudra air cair layaknya Bumi kita!\n\nSayangnya, badai debu kolosal terus menghancurkan atmosfernya, menyisakan gurun pasir beracun tanpa perlindungan pelindung. Apakah manusia benar-benar bisa membangun koloni di sini? Tulis pendapatmu! 👇✨",
                caption_youtube: "Misteri Planet Mars: Ke mana Perginya Samudra Air Kuno Mars?\n\nPlanet Mars selalu mengundang rasa penasaran ilmuwan antariksa. Dalam dokumenter singkat ini, kita menjelajahi transisi luar biasa Mars dari sebuah planet yang kaya akan air cair dan samudra luas menjadi gurun merah kering yang mematikan akibat badai debu raksasa.\n\nSimak pembahasannya secara ilmiah dan ketahui tantangan ekstrem yang dihadapi astronot masa depan untuk bisa bertahan hidup di sana.\n\nJangan lupa subscribe untuk info antariksa paling seru lainnya!",
                hashtags: ["#PlanetMars", "#LuarAngkasa", "#MisteriMars", "#Astronot", "#InfoSains", "#EdukasiSains", "#SainsPopuler", "#TikTokPintar", "#Kosmos", "#FaktaUnik"]
            }
        },
        {
            topic_keyword: "umum",
            title: "Keajaiban di Balik Otak Manusia",
            scenes: [
                {
                    scene_number: 1,
                    narration_style_direction: "Suara wanita muda, santai, ramah, gaya narasi konten edukasi TikTok.",
                    narration: "Tahu nggak, otak kita itu sebenarnya superkomputer alami paling canggih yang pernah ada. Energi listrik di dalamnya bahkan bisa menyalakan lampu bohlam!",
                    visual_description: "Glowing human brain network of synapses, stylized technology illustration.",
                    video_prompt: "Visual representation of human brain glowing with vibrant electrical networks, synapses firing glowing blue lights, stylized tech background, cinematic macro lens shot --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80"
                },
                {
                    scene_number: 2,
                    narration_style_direction: "Suara wanita muda, santai, ramah, gaya narasi konten edukasi TikTok.",
                    narration: "Setiap detiknya, terjadi lebih dari seratus ribu reaksi kimia di dalam otak untuk memproses pikiran, emosi, dan memori masa kecilmu.",
                    visual_description: "Abstract chemical reaction, flowing colorful liquids and sparks, cinematic.",
                    video_prompt: "Abstract fluid chemistry reaction with glowing sparks, vibrant colors swirling together, hyper realistic macro photography, beautiful abstract art --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80"
                },
                {
                    scene_number: 3,
                    narration_style_direction: "Suara wanita muda, santai, ramah, gaya narasi konten edukasi TikTok.",
                    narration: "Tapi uniknya, otak sendiri tidak bisa merasakan sakit karena tidak memiliki saraf penerima rasa sakit. Menakjubkan bukan?",
                    visual_description: "Happy young person touching head smiling, warm studio lighting.",
                    video_prompt: "Portrait of a cheerful young woman smiling pointing gently to her head, warm studio background, cinematic lighting, shallow depth of field --ar 9:16",
                    generatedImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
                }
            ],
            social_media: {
                titles: [
                    "🧠 LISTRIK OTAK BISA NYALAKAN BOHLAM?! Fakta Gila Otak Manusia!",
                    "Kenapa Otak Kita Sendiri Gak Bisa Merasakan Rasa Sakit?",
                    "Superkomputer Alami Tercanggih: Rahasia Otak yang Kamu Miliki",
                    "Ratusan Ribu Reaksi Kimia Setiap Detik Terjadi di Kepalamu!",
                    "Fakta Otak Manusia yang Bakal Bikin Kamu Takjub!"
                ],
                caption_shorts: "Otak kita ternyata punya daya listrik yang cukup buat nyalain bohlam! 🧠💡 Ditambah lagi, otak ternyata gak bisa ngerasain sakit lho! Kok bisa? 👇",
                caption_instagram: "Tahukah kamu? Otak manusia adalah superkomputer alami paling canggih yang pernah ada. Energi listrik di dalam jaringan saraf kita bahkan sanggup menyalakan lampu bohlam kecil! 🧠💡\n\nLebih uniknya lagi, meskipun otak memproses semua rasa sakit di tubuh kita, organ otak sendiri TIDAK BISA merasakan sakit karena tidak memiliki saraf reseptor rasa sakit (nosiseptor)!\n\nLuar biasa sekali kan cara kerja tubuh kita? Share postingan ini ke temanmu yang suka belajar hal baru! 🚀✨",
                caption_youtube: "Keajaiban Kerja Otak Manusia: Menguak Superkomputer dalam Tubuh Kita.\n\nOtak manusia menyimpan misteri dan keajaiban biologis yang luar biasa. Tahukah Anda bahwa aktivitas kelistrikan otak Anda dapat menghasilkan energi yang cukup untuk menyalakan lampu bohlam? Di video edukasi kali ini, kita akan membahas tuntas fakta mencengangkan seputar reaksi kimia beruntun, serta alasan ilmiah di balik kenapa otak tidak bisa mengalami rasa sakit fisik.\n\nLike dan subscribe untuk terus mendukung channel edukasi sains ini!",
                hashtags: ["#OtakManusia", "#FaktaOtak", "#Kesehatan", "#Biologi", "#InfoSains", "#EdukasiUnik", "#BelajarMedsos", "#Superkomputer", "#FaktaMenarik", "#SainsTikTok"]
            }
        }
    ];

    const indexToKey = (index) => String(index);

    // ---------- Referensi Visual (Multi) ----------
    const handleAddReferences = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (files.length === 0) return;

        const room = MAX_REFS - references.length;
        if (room <= 0) {
            setErrorMsg(`Maksimal ${MAX_REFS} foto referensi.`);
            return;
        }
        const accepted = files.filter(f => f.type.startsWith('image/')).slice(0, room);
        if (accepted.length === 0) {
            setErrorMsg("Hanya dapat mengunggah file gambar.");
            return;
        }
        try {
            const processed = await Promise.all(accepted.map(f => compressImageFile(f)));
            setReferences(prev => [
                ...prev,
                ...processed.map((p, i) => ({
                    id: `${Date.now()}_${i}`,
                    name: "",
                    role: "Karakter",
                    image: p.dataUrl,
                    base64: p.base64,
                    mime: p.mime,
                    description: ""
                }))
            ]);
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || "Gagal memproses gambar.");
        }
    };

    const updateReference = (id, patch) => setReferences(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    const removeReference = (id) => setReferences(prev => prev.filter(r => r.id !== id));

    const describeReference = async (ref) => {
        let task;
        if (ref.role === "Lokasi") {
            task = "Describe this PLACE/ENVIRONMENT as a reusable visual lock for text-to-image generators: type of place, architecture, key props and furniture, materials, dominant colors, lighting source, time of day and atmosphere.";
        } else if (ref.role === "Objek") {
            task = "Describe this OBJECT/PROP as a reusable visual lock: what it is, shape, size, material, colors, patterns, wear, and any distinctive marks.";
        } else {
            task = "Describe this CHARACTER (person, animal, or fantasy creature) as a reusable visual lock for text-to-image generators. If human: estimated gender and age range, skin tone, face shape, eye shape/color, exact hair details, build, exact clothing (style, color, material) and accessories. If an animal or creature: species, body shape, scale/skin/fur/feather texture and colors, eyes, horns/wings/tail, distinctive marks. Do NOT identify who the person is; describe only what is visible.";
        }
        const prompt = `${task} Write ONE dense English paragraph of 40-70 words, no bullet points, no preface, only visual facts that must stay identical across many images.`;
        const data = await callGemini(apiKey, TEXT_MODEL, {
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: ref.mime, data: ref.base64 } }] }]
        });
        const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
        if (!text) throw new Error("Deskripsi kosong.");
        return text;
    };

    const analyzeAllReferences = async () => {
        if (!apiKey) {
            setErrorMsg("Harap masukkan API Key terlebih dahulu untuk menganalisis gambar.");
            return;
        }
        if (references.length === 0) return;
        setIsAnalyzingRefs(true);
        setErrorMsg("");
        try {
            const updated = [...references];
            for (let i = 0; i < updated.length; i++) {
                updated[i] = { ...updated[i], description: await describeReference(updated[i]) };
            }
            setReferences(updated);
            setUseReferences(true);
            setCopySuccess("Analisis referensi sukses!");
            setTimeout(() => setCopySuccess(""), 2000);
        } catch (err) {
            console.error(err);
            setErrorMsg("Gagal menganalisis referensi. Pastikan API key Anda aktif dan coba lagi.");
        } finally {
            setIsAnalyzingRefs(false);
        }
    };

    const ensureRefDescriptions = async () => {
        const updated = [...references];
        for (let i = 0; i < updated.length; i++) {
            if (!updated[i].description) {
                try {
                    updated[i] = { ...updated[i], description: await describeReference(updated[i]) };
                } catch (err) {
                    console.error("Gagal analisis referensi", err);
                }
            }
        }
        setReferences(updated);
        return updated;
    };

    const pickRefsForScene = (scene, bible) => {
        if (!useReferences || references.length === 0) return [];
        const picked = [];
        const add = (r) => { if (r && !picked.includes(r)) picked.push(r); };
        const byRefId = (rid) => {
            const m = String(rid || "").match(/REF\s*(\d+)/i);
            return m ? references[Number(m[1]) - 1] : null;
        };

        (Array.isArray(scene.characters_in_scene) ? scene.characters_in_scene : []).forEach(cid => {
            const c = resolveById(bible?.characters, cid);
            if (!c) return;
            add(byRefId(c.ref_id) || references.find(r => r.name && r.name.toLowerCase() === String(c.name).toLowerCase()));
        });
        const loc = resolveById(bible?.locations, scene.location_id);
        if (loc) add(byRefId(loc.ref_id) || references.find(r => r.role === "Lokasi" && r.name && r.name.toLowerCase() === String(loc.name).toLowerCase()));

        if (picked.length === 0) references.filter(r => r.role === "Karakter").slice(0, 2).forEach(add);
        return picked.slice(0, 3);
    };

    const generateSocialMediaPackage = async (scenesOverride = null) => {
        const srcScenes = Array.isArray(scenesOverride) ? scenesOverride : scenes;
        const topicQuery = topic || "Kreator Sukses";
        setIsGeneratingCaptions(true);
        setErrorMsg("");

        if (!apiKey) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const query = topic.toLowerCase();
            let selectedDemo = DEMO_STORIES[2]; 

            if (query.includes("laut") || query.includes("mariana") || query.includes("air") || query.includes("dalam") || query.includes("misteri")) {
                selectedDemo = DEMO_STORIES[0];
            } else if (query.includes("mars") || query.includes("angkasa") || query.includes("bintang") || query.includes("planet")) {
                selectedDemo = DEMO_STORIES[1];
            }
            
            setSocialCaptions(selectedDemo.social_media);
            setIsGeneratingCaptions(false);
            return;
        }

        const targetLang = customLanguage || language;
        const scriptExcerpt = srcScenes.length > 0 ? JSON.stringify(srcScenes.map(s => s.story_beat || s.narration || s.visual_description)) : "N/A";
        
        const promptText = `
            You are an elite, viral Growth Marketer, social media strategist, and copywriting expert.
            Based on this video topic: "${topicQuery}"
            and this generated storyboard script structure as context: "${scriptExcerpt}"
            
            Produce a high-CTR, highly engaging social media package tailored perfectly in ${targetLang}.
            
            You must reply with a valid JSON object ONLY. No markdown wrapping block, no conversational text, no comments.
            Strict JSON Structure:
            {
                "titles": ["List of 5 extremely clickable, punchy, viral titles for short-form reels/shorts/tiktok in uppercase with eye-catching emojis (max 40 chars each)"],
                "caption_shorts": "A short, extremely engaging caption for TikTok/Shorts (max 150 characters) featuring a powerful hook, interactive emoji, and call to action",
                "caption_instagram": "A detailed, engaging, storytelling style caption for Instagram/Facebook (max 400 characters) structured with line breaks, hooks, a body paragraph, and a discussion-inducing call-to-action",
                "caption_youtube": "A search-engine-optimized (SEO) description for YouTube (max 500 characters) containing natural primary keywords, video summary, structured layout, and generic engagement triggers",
                "hashtags": ["Array of exactly 12 trending, highly-relevant hashtags formatted correctly with the prefix '#' (no spaces inside tag)"]
            }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Gagal memperoleh deskripsi caption.");

            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);

            setSocialCaptions(parsed);
        } catch (err) {
            console.error(err);
            setErrorMsg("Gagal merumuskan paket optimasi media sosial. Cek API Key atau internet Anda.");
        } finally {
            setIsGeneratingCaptions(false);
        }
    };

    const generateThumbnailIdeas = async () => {
        const topicQuery = topic || "Ide Kreatif Kreator";
        setIsGeneratingSuggestions(true);
        setErrorMsg("");

        if (!apiKey) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setThumbnailSuggestions([
                "MISTERI TERBONGKAR!",
                "JANGAN MASUK SINI!",
                "MENCENGANGKAN SEKALI!",
                "TAHU TIDAK MEREKA?!"
            ]);
            setThumbnailPrompt("Extreme high-impact clickbait close-up dynamic scene, vibrant neon glow highlights, highly descriptive eye-catching background relative to the title, cinematic dramatic depth of field");
            setThumbnailOverlayText("MISTERI TERBONGKAR!");
            setIsGeneratingSuggestions(false);
            return;
        }

        const targetLang = customLanguage || language;
        const promptText = `
            You are an expert viral content creator, master of CTR (Click-Through-Rate), and visual marketing strategist.
            Based on this video topic: "${topicQuery}", generate a strategic YouTube/TikTok thumbnail concept.
            
            You must reply with a valid JSON object ONLY. No markdown wrapper, no conversational text.
            Structure:
            {
                "suggestions": ["4 to 5 extremely dramatic clickbait text hook overlay phrases in ${targetLang}, max 25 characters each, in ALL CAPS"],
                "visual_prompt": "A highly-detailed cinematic visual prompt in English for an AI Image Generator to build the ultimate high-contrast attention-grabbing thumbnail background (No embedded text in the background itself). Focus on expressive faces, objects, dramatic low-key/high-contrast neon lighting."
            }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Gagal merumuskan ide visual.");

            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);

            setThumbnailSuggestions(parsed.suggestions || []);
            setThumbnailPrompt(parsed.visual_prompt || "");
            if (parsed.suggestions && parsed.suggestions.length > 0) {
                setThumbnailOverlayText(parsed.suggestions[0]);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Gagal memanggil asisten ide thumbnail. Pastikan input & API Key Anda benar.");
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const generateThumbnailImage = async () => {
        if (!thumbnailPrompt) {
            setErrorMsg("Buat rekomendasi ide visual/prompt terlebih dahulu!");
            return;
        }
        setIsGeneratingThumbnail(true);
        setErrorMsg("");

        if (!apiKey) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const randomID = Math.floor(Math.random() * 1000);
            setThumbnailImage(`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80&sig=${randomID}`);
            setIsGeneratingThumbnail(false);
            return;
        }

        const aspectKeywords = ratio === "9:16" ? "vertical layout, portrait focus" : "wide angle, cinematic wide shot, 16:9 youtube thumbnail frame";
        const resolvedStyle = getStyleDescriptor(thumbnailStyle === "match_main" ? theme : thumbnailStyle);
        const finalPrompt = `${thumbnailPrompt}, rendered beautifully in ${resolvedStyle} style, optimized for a high-converting clickbait cover design, ${aspectKeywords}, vibrant eye-catching colors, saturated high-contrast, master level 3D depth, 8k resolution`;
        const thumbRefs = useReferences ? references.filter(r => r.role === "Karakter").slice(0, 2) : [];
        const thumbParts = [
            ...thumbRefs.map(r => ({ inlineData: { mimeType: r.mime, data: r.base64 } })),
            { text: `${thumbRefs.length ? `The first ${thumbRefs.length} image(s) are the main character reference(s): keep their exact face, hair and outfit in the thumbnail. ` : ""}${finalPrompt}` }
        ];

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{ parts: thumbParts }],
                    generationConfig: {
                        responseModalities: ["IMAGE"]
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${errorText}`);
            }

            const data = await response.json();
            const imagePart = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

            if (imagePart) {
                const base64Image = imagePart.inlineData.data;
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                setThumbnailImage(`data:${mimeType};base64,${base64Image}`);
            } else {
                throw new Error("Gambar thumbnail tidak ditemukan di response.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Gagal merender background gambar thumbnail.");
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    const downloadCompositeThumbnail = () => {
        if (!thumbnailImage) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = thumbnailImage;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.naturalWidth || 1280;
            canvas.height = img.naturalHeight || 720;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if (thumbnailOverlayText) {
                const scaleFactor = canvas.width / 800; 
                const fontSize = Math.floor(64 * scaleFactor);
                
                ctx.font = `italic bold ${fontSize}px Impact, Arial Black, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                let yPos = canvas.height * 0.8; 
                if (overlayPosition === "top") yPos = canvas.height * 0.22;
                else if (overlayPosition === "middle") yPos = canvas.height * 0.5;

                const xPos = canvas.width / 2;

                ctx.strokeStyle = "#000000";
                ctx.lineWidth = Math.floor(14 * scaleFactor);
                ctx.lineJoin = "round";
                ctx.miterLimit = 2;
                ctx.strokeText(thumbnailOverlayText.toUpperCase(), xPos, yPos);

                ctx.fillStyle = overlayColor;
                ctx.fillText(thumbnailOverlayText.toUpperCase(), xPos, yPos);
            }

            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `Wilhen_Cinecreator_Thumbnail_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    };

    const runDemoSimulation = async () => {
        setErrorMsg("");
        setIsGeneratingText(true);
        setScenes([]);
        setIsDemo(true);
        setSocialCaptions(null);

        const query = topic.toLowerCase();
        let selectedDemo = DEMO_STORIES[2]; 

        if (query.includes("laut") || query.includes("mariana") || query.includes("air") || query.includes("dalam") || query.includes("misteri")) {
            selectedDemo = DEMO_STORIES[0];
        } else if (query.includes("mars") || query.includes("angkasa") || query.includes("bintang") || query.includes("planet")) {
            selectedDemo = DEMO_STORIES[1];
        }

        setTopic(selectedDemo.title);

        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const emptyImageScenes = selectedDemo.scenes.map(s => ({ ...s, generatedImage: null }));
        setScenes(emptyImageScenes);
        setSocialCaptions(selectedDemo.social_media);
        setIsGeneratingText(false);

        for (let i = 0; i < selectedDemo.scenes.length; i++) {
            setLoadingImages(prev => ({ ...prev, [indexToKey(i)]: true }));
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setScenes(prev => {
                const updated = [...prev];
                updated[i] = { ...updated[i], generatedImage: selectedDemo.scenes[i].generatedImage };
                return updated;
            });
            setLoadingImages(prev => ({ ...prev, [indexToKey(i)]: false }));
        }
    };

    const generateStory = async () => {
        if (!apiKey) {
            runDemoSimulation();
            return;
        }
        setIsDemo(false);
        setErrorMsg("");
        setIsGeneratingText(true);
        setScenes([]);
        setSocialCaptions(null);
        setStoryMeta(null);

        try {
            const targetLang = customLanguage || language;
            const ratioText = ratio === "9:16" ? "Vertical (9:16)" : "Widescreen (16:9)";
            const styleDesc = getStyleDescriptor(theme);
            const ctype = CONTENT_TYPES.find(c => c.value === contentType) || CONTENT_TYPES[0];
            const nstyle = NARRATIVE_OPTIONS.find(n => n.value === narrativeStyle) || NARRATIVE_OPTIONS[0];
            const voiceOpt = VOICE_OPTIONS.find(v => v.value === narratorVoice) || VOICE_OPTIONS[0];
            const activeRefs = useReferences && references.length > 0 ? await ensureRefDescriptions() : [];

            const maxWords = Math.max(6, Math.round(sceneDuration * 2.4));
            const minWords = Math.round(maxWords * 0.8);
            const speechRule = (nstyle.narrator || nstyle.dialogue)
                ? `SPEECH BUDGET: in every scene the TOTAL spoken words (voice_over + all dialogue lines combined) must be between ${minWords} and ${maxWords} words, so the speech fills the ${sceneDuration}-second clip naturally without rushing and without long silence.`
                : `SPEECH BUDGET: no spoken words in this video.`;

            const voiceRule = nstyle.narrator
                ? `NARRATOR VOICE: ${voiceOpt.instruction} Describe this ONE voice in "narrator_voice" (in ${targetLang}) — it never changes during the video.`
                : `NARRATOR VOICE: there is no narrator. Set "narrator_voice" to an empty string.`;

            const locationRule = lockLocation
                ? "LOCATION POLICY: use EXACTLY ONE location for ALL scenes. Create one entry in story_bible.locations. Vary only camera angle, framing and (if the story needs it) the time-of-day lighting."
                : "LOCATION POLICY: use at most 3 distinct locations in total. Every location change must be motivated and shown (a character walks/travels, or the scene opens on a clear establishing shot) — never teleport.";

            const refBlock = activeRefs.length
                ? `
USER-PROVIDED REFERENCE ASSETS (ground truth — never change their look):
${activeRefs.map((r, i) => `- REF${i + 1} | role: ${r.role} | name: "${r.name || `${r.role} ${i + 1}`}" | look: ${r.description || "(no description)"}`).join("\n")}
REFERENCE RULES:
- Every REF with role Karakter MUST become an entry in story_bible.characters with "ref_id":"REFn" and the same name; copy its look into "visual_lock" (only add missing outfit details).
- Every REF with role Lokasi MUST become an entry in story_bible.locations with "ref_id":"REFn".
- Every REF with role Objek MUST appear as a recurring prop in at least 2 scenes and be mentioned in "state_tracker".
- Never invent a different appearance for referenced assets.
`
                : "";

            const prompt = `
You are an award-winning short-form video showrunner, screenwriter and AI cinematographer. Design a ${sceneCount}-scene video (${sceneDuration} seconds per scene, ${sceneCount * sceneDuration} seconds total) from this idea: "${topic}".

PROJECT SETTINGS
- Language of all spoken/on-screen text: ${targetLang}
- Aspect ratio: ${ratioText}
- Visual style: ${styleDesc}
- Content format: ${ctype.instruction.replace("**TOPIC**", topic)}
- Script mode: ${nstyle.instruction}
- ${voiceRule}
- ${speechRule}
- ${locationRule}
${refBlock}

STORY ARC (follow this scene-by-scene):
${buildArcPlan(sceneCount)}

STORY QUALITY & CONTINUITY RULES (very important):
1. Think of ONE continuous story, not ${sceneCount} separate clips. Each scene must start exactly where the previous one ended (same place, same time flow, same emotion level) and explain this link in "continuity_from_previous".
2. Every scene except the last must end with a micro-hook/open loop ("cliffhanger_to_next") that the next scene answers.
3. The protagonist has a clear want, a real obstacle and visible stakes. Show emotion through actions and expressions, not just words.
4. Dialogue/narration must sound natural in ${targetLang}, specific (no generic filler), in-character, and must NOT repeat what the visuals already show.
5. Use at most 3 recurring characters. Do not introduce new characters or locations outside story_bible.
6. "state_tracker" lists, at the START of each scene, what every character wears/holds, injuries/dirt, time of day and weather. It must stay identical to the previous scene unless the story explicitly changes it.
7. "motion_action" must describe ONE continuous shot (no cuts) with a clear beginning→end movement that a video model can realistically render in ${sceneDuration} seconds. Keep physical actions simple and concrete.
8. Visual fields are in English; spoken/on-screen text in ${targetLang}.

Reply with ONE valid JSON object only (no markdown, no comments) with this exact structure:
{
  "title": "catchy title in ${targetLang}",
  "logline": "one sentence story summary in ${targetLang}",
  "narrator_voice": "voice description in ${targetLang} or empty string",
  "story_bible": {
    "characters": [
      { "id": "c1", "name": "character name", "ref_id": "REFn or null", "visual_lock": "English, 40-70 words: species/age, skin tone or fur/scale color, face shape, hair, build, EXACT outfit and accessories, distinctive marks. Never changes.", "voice_profile": "voice of this character in ${targetLang}: gender, age, tone, speaking habit (empty if character never speaks)" }
    ],
    "locations": [
      { "id": "l1", "name": "location name", "ref_id": "REFn or null", "visual_lock": "English, 30-60 words: architecture, key props, materials, colors, light source, time of day" }
    ],
    "color_palette": "English, 4-6 dominant colors / grading that define the whole video"
  },
  "scenes": [
    {
      "scene_number": 1,
      "arc_role": "HOOK | SETUP | INCITING INCIDENT | ESKALASI | KLIMAKS | RESOLUSI",
      "story_beat": "what happens in this scene, one sentence in ${targetLang}",
      "location_id": "l1",
      "characters_in_scene": ["c1"],
      "time_and_mood": "English: time of day + emotional mood",
      "continuity_from_previous": "${targetLang}: how this scene continues directly from the previous one (empty for scene 1)",
      "state_tracker": "English state at the start of the scene",
      "voice_over": "narrator text in ${targetLang} or empty string",
      "dialogue": [ { "speaker": "exact character name", "line": "spoken line in ${targetLang}", "emotion": "short emotion/tone" } ],
      "on_screen_text": "short on-screen text in ${targetLang} or empty string",
      "audio_direction": "English: music mood + key sound effects",
      "first_frame_action": "English: the exact still moment of the first frame — pose, expression, framing, what is visible",
      "motion_action": "English: chronological movement during the ${sceneDuration}s clip, one continuous shot",
      "camera": "English: shot size, angle, camera movement",
      "lighting": "English: light direction, quality, color",
      "cliffhanger_to_next": "${targetLang}: open loop that leads to the next scene (empty for the last scene)"
    }
  ]
}
The "scenes" array must contain EXACTLY ${sceneCount} objects.
`;

            let parsed = null;
            let lastErr = null;
            for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
                try {
                    const data = await callGemini(apiKey, TEXT_MODEL, {
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json", temperature: 0.85 }
                    });
                    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("");
                    const obj = parseJsonLoose(text);
                    const candidate = Array.isArray(obj) ? { scenes: obj } : obj;
                    if (!Array.isArray(candidate.scenes) || candidate.scenes.length === 0) throw new Error("Struktur cerita tidak valid.");
                    parsed = candidate;
                } catch (e) {
                    lastErr = e;
                    parsed = null;
                }
            }
            if (!parsed) throw lastErr || new Error("Tidak ada hasil.");

            const rawBible = parsed.story_bible || {};
            const bible = {
                characters: (Array.isArray(rawBible.characters) ? rawBible.characters : []).map((c, i) => ({ ...c, id: c.id || `c${i + 1}`, name: c.name || `Karakter ${i + 1}` })),
                locations: (Array.isArray(rawBible.locations) ? rawBible.locations : []).map((l, i) => ({ ...l, id: l.id || `l${i + 1}`, name: l.name || `Lokasi ${i + 1}` })),
                color_palette: rawBible.color_palette || "",
                narrator_voice: nstyle.narrator ? (parsed.narrator_voice || "") : ""
            };

            const ctx = { styleDesc, ratio, dur: sceneDuration, lang: targetLang, narrator: nstyle.narrator };
            const builtScenes = parsed.scenes.slice(0, sceneCount).map((s, i) => buildSceneObject(s, i, bible, ctx));

            setStoryMeta({ title: parsed.title || topic, logline: parsed.logline || "", bible });
            setScenes(builtScenes);
            setIsGeneratingText(false);

            let prevUrl = null;
            for (let i = 0; i < builtScenes.length; i++) {
                const url = await generateSceneImage(i, builtScenes[i], bible, chainScenes ? prevUrl : null);
                if (url) prevUrl = url;
            }

            generateSocialMediaPackage(builtScenes);
        } catch (err) {
            console.error(err);
            setErrorMsg(`Gagal membuat cerita: ${err.message || "coba lagi atau cek koneksi API."}`);
            setIsGeneratingText(false);
        }
    };

    const generateSceneImage = async (index, scene, bible, prevImageUrl) => {
        setLoadingImages(prev => ({ ...prev, [indexToKey(index)]: true }));

        const styleDesc = getStyleDescriptor(theme);
        const basePrompt = scene.image_prompt || `${scene.visual_description}, ${styleDesc}`;

        const parts = [];
        const notes = [];
        pickRefsForScene(scene, bible).forEach(r => {
            parts.push({ inlineData: { mimeType: r.mime, data: r.base64 } });
            notes.push(`Image ${parts.length} is the visual reference for the ${String(r.role).toLowerCase()} "${r.name || r.role}".`);
        });
        const prev = parseDataUrl(prevImageUrl);
        if (prev) {
            parts.push({ inlineData: { mimeType: prev.mime, data: prev.data } });
            notes.push(`Image ${parts.length} is the previous scene of the same video: use it ONLY to keep identity, outfit, location, lighting and color grade continuous. Do NOT copy its composition or pose.`);
        }
        const instruction = parts.length
            ? `${notes.join(" ")} Create a NEW image of the scene described below. Preserve the exact identity (face, hair, skin tone, body proportions, outfit, species details) of every referenced character and the look of the referenced location. Render everything in the requested style even if the references use another style. `
            : "";
        parts.push({ text: `${instruction}${basePrompt}\nNo text, captions, watermarks or borders.` });

        const requestImage = (cfg) => callGemini(apiKey, IMAGE_MODEL, {
            contents: [{ parts }],
            generationConfig: cfg
        });

        try {
            let data;
            try {
                data = await requestImage({ responseModalities: ["IMAGE"], imageConfig: { aspectRatio: ratio } });
            } catch (firstErr) {
                console.warn("Retry image generation", firstErr);
                await new Promise(resolve => setTimeout(resolve, 2500));
                data = await requestImage({ responseModalities: ["IMAGE"] });
            }

            const imagePart = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (!imagePart) {
                console.error("No image returned from API", data);
                return null;
            }
            const imageUrl = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
            setScenes(prevScenes => {
                const next = [...prevScenes];
                if (next[index]) next[index] = { ...next[index], generatedImage: imageUrl };
                return next;
            });
            return imageUrl;
        } catch (err) {
            console.error(`Image gen failed for scene ${index}`, err);
            setErrorMsg(`Scene ${index + 1}: ${err.message || "gagal membuat gambar."}`);
            return null;
        } finally {
            setLoadingImages(prev => ({ ...prev, [indexToKey(index)]: false }));
        }
    };

    const regenerateScene = async (index) => {
        const scene = scenes[index];
        if (!scene) return;
        if (!apiKey) {
            setErrorMsg("Membuat ulang gambar membutuhkan API Key.");
            return;
        }
        const prevUrl = chainScenes ? scenes[index - 1]?.generatedImage : null;
        await generateSceneImage(index, scene, storyMeta?.bible, prevUrl);
    };

    const copyStoryBible = () => {
        if (!storyMeta) return;
        const b = storyMeta.bible;
        const text = [
            `JUDUL: ${storyMeta.title}`,
            storyMeta.logline ? `LOGLINE: ${storyMeta.logline}` : null,
            b.color_palette ? `PALET WARNA: ${b.color_palette}` : null,
            "",
            "KARAKTER:",
            ...b.characters.map(c => `- ${c.name}: ${c.visual_lock}${c.voice_profile ? ` | Suara: ${c.voice_profile}` : ""}`),
            "",
            "LOKASI:",
            ...b.locations.map(l => `- ${l.name}: ${l.visual_lock}`)
        ].filter(x => x !== null).join("\n");
        copyToClipboard(text);
    };

    const copyAllVideoPrompts = () => {
        const text = scenes.map(s => `SCENE ${s.scene_number}\n${s.video_prompt}${s.audio_prompt ? `\n${s.audio_prompt}` : ""}`).join("\n\n---\n\n");
        copyToClipboard(text);
    };

    const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const copyToClipboard = async (text) => {
    let copied = false;

    // Try modern Clipboard API first (if allowed by iframe permissions policy)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            copied = true;
        } catch (clipErr) {
            console.warn("Clipboard API blocked or unpermitted, switching to legacy fallback:", clipErr);
        }
    }

    // Fallback for iframe restrictions, non-secure contexts, or denied permissions
    if (!copied) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            copied = document.execCommand('copy');
            document.body.removeChild(textArea);
        } catch (fallbackErr) {
            console.error("DOM execCommand copy failed:", fallbackErr);
        }
    }

    if (copied) {
        setCopySuccess('Teks disalin!');
        setTimeout(() => setCopySuccess(''), 2000);
    } else {
        setErrorMsg('Gagal menyalin teks. Silakan salin secara manual.');
    }
};

return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0] font-sans p-4 md:p-8">
            <style>
                {`
                .glass-panel {
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .loading-shimmer {
                    background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                
                .fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}
            </style>
            
            {/* Feedback Toast */}
            {copySuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-500/90 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2">
                    {copySuccess}
                </div>
            )}
            
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
                            <Film className="text-cyan-400 w-8 h-8 md:w-10 md:h-10" /> Wilhen Cinecreator AI
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base mt-2 max-w-lg">
                            Generator video pendek AI super komprehensif. Dapatkan naskah, visual referensi, blueprint konsistensi karakter, judul viral, taktik thumbnail, caption multiformat, & hashtag sekaligus.
                        </p>
                    </div>
                    <div className="flex gap-2 text-xs font-mono text-gray-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse my-auto"></span>
                        Powered by Gemini (with Demo Mode)
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* INPUT PANEL (Left Side) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl shadow-2xl sticky top-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white border-b border-white/10 pb-4">
                                <Settings className="w-5 h-5 text-cyan-400" /> Konfigurasi Video
                            </h2>

                            {/* API Key Manager */}
                            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                                        🔑 API Key Gemini
                                    </label>
                                    <button 
                                        onClick={() => {
                                            setTempKey(apiKey);
                                            setGuideStep(1);
                                            setIsGuideOpen(true);
                                        }}
                                        className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded border border-cyan-500/30 transition-all font-semibold flex items-center gap-1"
                                    >
                                        💡 Butuh Key?
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => {
                                            const key = e.target.value.trim();
                                            setApiKey(key);
                                            if (key) {
                                                safeStore.set("cinecreator_api_key", key);
                                            } else {
                                                safeStore.remove("cinecreator_api_key");
                                                safeStore.remove("cinefact_api_key");
                                            }
                                        }}
                                        placeholder="Kosongkan untuk Mode Demo instan..."
                                        className="flex-1 bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none transition font-mono"
                                    />
                                    {apiKey && (
                                        <button 
                                            onClick={() => {
                                                setApiKey("");
                                                safeStore.remove("cinecreator_api_key");
                                                safeStore.remove("cinefact_api_key");
                                            }}
                                            className="px-2.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs transition shrink-0"
                                            title="Hapus Key"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                    {apiKey ? 
                                        <span className="text-emerald-400 font-semibold flex items-center gap-1">✅ Kunci API otomatis tersimpan permanen di browser ini. Tidak perlu input ulang.</span> : 
                                        "Masukkan API Key untuk hasil kustom. Akan otomatis tersimpan permanen di browser Anda."
                                    }
                                </p>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5 text-[10px] text-amber-200 leading-relaxed">
    Kuota &amp; privasi: API key dipakai langsung dari browser Anda dan tidak dikirim ke server kami. Batas pemakaian free tier ditentukan Google dan bisa berubah. Di free tier, prompt dan foto yang dikirim dapat dipakai Google untuk meningkatkan produknya, jadi hindari mengunggah foto yang sensitif.
</div>
{/* Referensi Visual (Multi: karakter, lokasi, objek) */}
                            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                                        <Layers className="w-4 h-4" /> Referensi Visual ({references.length}/{MAX_REFS})
                                    </label>
                                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded uppercase border border-indigo-500/30">
                                        Multimodal AI
                                    </span>
                                </div>

                                {references.length > 0 && (
                                    <div className="space-y-3">
                                        {references.map((ref, i) => (
                                            <div key={ref.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                                                <div className="flex gap-3">
                                                    <img
                                                        src={ref.image}
                                                        alt={`Referensi ${i + 1}`}
                                                        className="w-16 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <input
                                                            type="text"
                                                            value={ref.name}
                                                            onChange={(e) => updateReference(ref.id, { name: e.target.value })}
                                                            placeholder={`Nama (mis. Naira) — REF${i + 1}`}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                                                        />
                                                        <select
                                                            value={ref.role}
                                                            onChange={(e) => updateReference(ref.id, { role: e.target.value, description: "" })}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                                                        >
                                                            <option value="Karakter">👤 Karakter (orang / hewan / makhluk)</option>
                                                            <option value="Lokasi">🏞️ Lokasi / Latar</option>
                                                            <option value="Objek">🎁 Objek / Properti</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReference(ref.id)}
                                                        className="self-start p-1.5 text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition"
                                                        title="Hapus referensi"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={ref.description}
                                                    onChange={(e) => updateReference(ref.id, { description: e.target.value })}
                                                    placeholder="Deskripsi visual (diisi otomatis oleh AI, boleh diedit)"
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-300 placeholder-slate-600 focus:border-cyan-500 outline-none resize-none leading-relaxed"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {references.length < MAX_REFS && (
                                    <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-950/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group">
                                        <Plus className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                        <span className="text-xs font-semibold text-slate-300 group-hover:text-white">Tambah Foto Referensi</span>
                                        <span className="text-[10px] text-slate-500">Bisa pilih beberapa sekaligus · JPG, PNG, WEBP</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAddReferences}
                                            className="hidden"
                                        />
                                    </label>
                                )}

                                {references.length > 0 && (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={analyzeAllReferences}
                                            disabled={isAnalyzingRefs || !apiKey}
                                            className="w-full py-2 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-500/40 hover:to-indigo-500/40 border border-cyan-500/30 rounded-xl text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isAnalyzingRefs ? (
                                                <><RefreshCw className="animate-spin w-4 h-4" /> Menganalisis Referensi...</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" /> Deteksi Deskripsi Semua Referensi (AI)</>
                                            )}
                                        </button>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useReferences}
                                                onChange={(e) => setUseReferences(e.target.checked)}
                                                className="accent-cyan-500 w-3.5 h-3.5 rounded"
                                            />
                                            <span className="text-[11px] font-bold text-cyan-400">Pakai referensi saat membuat cerita & gambar</span>
                                        </label>
                                    </div>
                                )}

                                <p className="text-[9px] text-slate-500 italic leading-relaxed">
                                    *Foto referensi dikirim langsung ke AI gambar (bukan hanya deskripsi teks) supaya wajah, pakaian, dan lokasi tetap konsisten di setiap scene. Deskripsi yang kosong akan dianalisis otomatis saat Anda menekan tombol buat storyboard.
                                </p>
                            </div>

                            {/* Topic Input */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Judul / Topik Video</label>
                                <textarea 
                                    rows={3}
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={apiKey ? "Contoh: 5 Fakta laut dalam, Cara masak nasi goreng, atau Kisah Malin Kundang..." : "Ketik 'laut' atau 'mars' untuk mencoba simulasi demo bertema..."}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition resize-none text-sm leading-relaxed"
                                />
                                {!apiKey && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        <button onClick={() => setTopic("Misteri Kedalaman Laut")} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-1 rounded">Topik Laut 🌊</button>
                                        <button onClick={() => setTopic("Misteri Planet Mars")} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-orange-300 px-2 py-1 rounded">Topik Mars 🚀</button>
                                        <button onClick={() => setTopic("Rahasia Otak Manusia")} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-purple-300 px-2 py-1 rounded">Topik Otak 🧠</button>
                                    </div>
                                )}
                            </div>

                            {/* Content Type Selector */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Format / Jenis Konten</label>
                                <CustomSelect 
                                    value={contentType}
                                    onChange={setContentType}
                                    disabled={isGeneratingText}
                                    options={CONTENT_TYPES.map(c => ({ value: c.value, label: c.label }))}
                                />
                            </div>

                            {/* Theme Selection */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Gaya Visual</label>
                                <CustomSelect 
                                    value={theme}
                                    onChange={setTheme}
                                    disabled={isGeneratingText}
                                    options={STYLE_LIBRARY.map(s => ({ value: s.value, label: s.label }))}
                                />
                            </div>

                            {/* Ratio Selection */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Format Video</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setRatio("9:16")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${ratio === "9:16" ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-slate-400'}`}
                                    >
                                        <div className="w-3 h-5 border-2 border-current rounded-[1px]"></div>
                                        <span className="text-xs font-semibold">Tiktok/Reels (9:16)</span>
                                    </button>
                                    <button 
                                        onClick={() => setRatio("16:9")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${ratio === "16:9" ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-slate-400'}`}
                                    >
                                        <div className="w-5 h-3 border-2 border-current rounded-[1px]"></div>
                                        <span className="text-xs font-semibold">YouTube (16:9)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Narrative & Dialogue Style Selection */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Gaya Narasi & Dialog</label>
                                <CustomSelect 
                                    value={narrativeStyle}
                                    onChange={setNarrativeStyle}
                                    disabled={isGeneratingText}
                                    options={NARRATIVE_OPTIONS.map(n => ({ value: n.value, label: n.label }))}
                                />
                            </div>

                            {/* Narrator Voice Character Selection */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Karakter Suara Narator</label>
                                <CustomSelect 
                                    value={narratorVoice}
                                    onChange={setNarratorVoice}
                                    disabled={isGeneratingText || !(NARRATIVE_OPTIONS.find(n => n.value === narrativeStyle)?.narrator)}
                                    options={VOICE_OPTIONS.map(v => ({ value: v.value, label: v.label }))}
                                />
                                {!(NARRATIVE_OPTIONS.find(n => n.value === narrativeStyle)?.narrator) && (
                                    <p className="text-[10px] text-slate-500">Mode ini tidak memakai narator. Suara tiap karakter ditentukan otomatis di Story Bible.</p>
                                )}
                            </div>

                            {/* Language Selection */}
                            <div className="space-y-2 mb-6">
                                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Bahasa Narasi</label>
                                <CustomSelect 
                                    value={language}
                                    onChange={(val) => {
                                        setLanguage(val);
                                        if(val !== "Custom") setCustomLanguage("");
                                    }}
                                    disabled={isGeneratingText}
                                    options={[
                                        { value: "Bahasa Indonesia", label: "Bahasa Indonesia" },
                                        { value: "English", label: "English" },
                                        { value: "Japanese", label: "Japanese" },
                                        { value: "Javanese", label: "Bahasa Jawa" },
                                        { value: "Sunda", label: "Bahasa Sunda" },
                                        { value: "Custom", label: "Lainnya (Ketik Manual)..." }
                                    ]}
                                />
                                {language === "Custom" && (
                                    <input 
                                        type="text" 
                                        value={customLanguage}
                                        onChange={(e) => setCustomLanguage(e.target.value)}
                                        placeholder="Ketik nama bahasa..."
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-cyan-500 outline-none animate-in fade-in slide-in-from-top-1 mt-2"
                                    />
                                )}
                            </div>

                            {/* Scene Count Selection */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Jumlah Scene</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="3" 
                                        max="12" 
                                        value={sceneCount}
                                        onChange={(e) => setSceneCount(Number(e.target.value))}
                                        disabled={isGeneratingText}
                                        className="flex-1 accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 text-cyan-400 font-bold min-w-[3rem] text-center shadow-inner">
                                        {sceneCount}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 text-right">
                                    {apiKey ? `Total ± ${sceneCount * sceneDuration} detik` : "Mode Demo akan meluncurkan 3 scene simulasi"}
                                </p>
                            </div>

                            {/* Scene Duration */}
                            <div className="space-y-2 mb-5">
                                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">Durasi per Scene (klip video)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[5, 8, 10].map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setSceneDuration(d)}
                                            disabled={isGeneratingText}
                                            className={`py-2 rounded-xl border text-xs font-bold transition-all ${sceneDuration === d ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-slate-400'}`}
                                        >
                                            {d} detik
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500">Dipakai untuk mengatur panjang dialog/narasi agar pas mengisi satu klip.</p>
                            </div>

                            {/* Consistency Options */}
                            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-8 space-y-3">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={lockLocation}
                                        onChange={(e) => setLockLocation(e.target.checked)}
                                        className="accent-cyan-500 w-3.5 h-3.5 rounded mt-0.5"
                                    />
                                    <span className="text-[11px] text-slate-300 leading-snug">
                                        <strong className="text-cyan-400">📍 Satu lokasi tetap</strong> untuk semua scene (paling konsisten)
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={chainScenes}
                                        onChange={(e) => setChainScenes(e.target.checked)}
                                        className="accent-cyan-500 w-3.5 h-3.5 rounded mt-0.5"
                                    />
                                    <span className="text-[11px] text-slate-300 leading-snug">
                                        <strong className="text-cyan-400">🔗 Kunci antar scene</strong>: gambar scene sebelumnya dipakai sebagai acuan (lebih konsisten, sedikit lebih lambat)
                                    </span>
                                </label>
                            </div>

                            {/* Generate Button */}
                            <button 
                                onClick={apiKey ? generateStory : runDemoSimulation}
                                disabled={isGeneratingText}
                                className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg cursor-pointer ${
                                    apiKey 
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20' 
                                    : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 shadow-yellow-500/20'
                                }`}
                            >
                                {isGeneratingText ? (
                                    <><RefreshCw className="animate-spin w-5 h-5" /> Merancang...</>
                                ) : apiKey ? (
                                    <><Camera className="w-5 h-5" /> Buat Storyboard (API)</>
                                ) : (
                                    <><Play className="w-5 h-5" /> Coba Mode Demo</>
                                )}
                            </button>
                            
                            {errorMsg && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm flex gap-3 items-start animate-in slide-in-from-bottom-2">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                                    {errorMsg}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RESULTS PANEL (Right Side) */}
                    <div className="lg:col-span-8">
                        {scenes.length === 0 && !isGeneratingText && !thumbnailImage && !isGeneratingThumbnail && !isGeneratingSuggestions && !socialCaptions ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 glass-panel rounded-2xl p-12 min-h-[500px] border-dashed border-2 border-slate-700">
                                <div className="bg-slate-800/50 p-6 rounded-full mb-6">
                                    <Film className="w-16 h-16 text-slate-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-300 mb-2">Belum Ada Storyboard</h3>
                                <p className="text-slate-500 max-w-sm text-center">Isi detail video di panel sebelah kiri dan klik tombol di bawah untuk memulai secara gratis.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Demo Mode Notification Banner */}
                                {isDemo && !isGeneratingText && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-xs text-yellow-200 flex justify-between items-center animate-in fade-in">
                                        <div className="flex gap-2 items-center">
                                            <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></span>
                                            <span>Anda sedang melihat <strong>Hasil Simulasi Mode Demo</strong>. Masukkan API Key di panel kiri untuk membuat topik kustom Anda!</span>
                                        </div>
                                    </div>
                                )}

                                {/* Loading State for Text */}
                                {isGeneratingText && (
                                    <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
                                        <div className="relative w-20 h-20 mb-6">
                                            <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-full"></div>
                                            <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Merancang Storyboard</h3>
                                        <p className="text-cyan-400/80 animate-pulse text-sm">Sedang menulis naskah & menyiapkan visual...</p>
                                    </div>
                                )}

                                {/* Feature Tab Switcher */}
                                {!isGeneratingText && (scenes.length > 0 || thumbnailImage || isGeneratingThumbnail || isGeneratingSuggestions || socialCaptions) && (
                                    <div className="flex flex-wrap bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 gap-1 sm:gap-0">
                                        <button 
                                            onClick={() => setActiveTab("storyboard")}
                                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 min-w-[120px] ${activeTab === "storyboard" ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            <Film className="w-4 h-4" /> Storyboard ({scenes.length})
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setActiveTab("thumbnail");
                                                if (thumbnailSuggestions.length === 0 && (topic || scenes.length > 0)) {
                                                    generateThumbnailIdeas();
                                                }
                                            }}
                                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 min-w-[120px] ${activeTab === "thumbnail" ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            <ImageIcon className="w-4 h-4" /> Thumbnail
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setActiveTab("caption");
                                                if (!socialCaptions) {
                                                    generateSocialMediaPackage();
                                                }
                                            }}
                                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 min-w-[120px] ${activeTab === "caption" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            <Hash className="w-4 h-4" /> Caption & Judul
                                        </button>
                                    </div>
                                )}

                                {/* STORYBOARD TAB VIEW */}
                                {activeTab === "storyboard" && !isGeneratingText && (
                                    <div className="space-y-8">
                                        {storyMeta && (
                                            <div className="glass-panel rounded-2xl p-5 space-y-4 fade-in">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                    <div className="min-w-0">
                                                        <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Ringkasan Cerita</span>
                                                        <h3 className="text-lg font-bold text-white mt-1">{storyMeta.title}</h3>
                                                        {storyMeta.logline && (
                                                            <p className="text-sm text-slate-300 mt-1 leading-relaxed">{storyMeta.logline}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 shrink-0">
                                                        <button
                                                            onClick={copyStoryBible}
                                                            className="text-xs flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-cyan-500/20 cursor-pointer"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" /> Salin Story Bible
                                                        </button>
                                                        <button
                                                            onClick={copyAllVideoPrompts}
                                                            className="text-xs flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-300 hover:text-white transition px-3 py-1.5 rounded-lg border border-purple-500/20 cursor-pointer"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" /> Salin Semua Prompt Video
                                                        </button>
                                                    </div>
                                                </div>
                                                {(storyMeta.bible.characters.length > 0 || storyMeta.bible.locations.length > 0) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {storyMeta.bible.characters.map(c => (
                                                            <div key={c.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                                                                <p className="text-xs font-bold text-yellow-400">👤 {c.name}</p>
                                                                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{c.visual_lock}</p>
                                                            </div>
                                                        ))}
                                                        {storyMeta.bible.locations.map(l => (
                                                            <div key={l.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                                                                <p className="text-xs font-bold text-emerald-400">📍 {l.name}</p>
                                                                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{l.visual_lock}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {scenes.map((scene, index) => {
                                            const combinedOutputText = [
                                                `[SCENE ${scene.scene_number}]`,
                                                scene.story_beat && `* ALUR: ${scene.story_beat}`,
                                                scene.narration_style_direction && `* NADA & SUARA:\n${scene.narration_style_direction}`,
                                                `* NASKAH & DIALOG:\n${scene.narration}`,
                                                scene.audio_prompt && `* AUDIO/DIALOG UNTUK VIDEO:\n${scene.audio_prompt}`,
                                                `* PROMPT GAMBAR:\n${scene.image_prompt || scene.visual_description || ""}`,
                                                `* PROMPT VIDEO:\n${scene.video_prompt}`,
                                                scene.video_prompt_short && `* PROMPT VIDEO (RINGKAS):\n${scene.video_prompt_short}`,
                                                scene.negative_prompt && `* NEGATIVE PROMPT:\n${scene.negative_prompt}`
                                            ].filter(Boolean).join("\n\n");

                                            return (
                                                <div key={index} className="glass-panel rounded-2xl overflow-hidden shadow-xl transition-all hover:border-cyan-500/30 flex flex-col md:flex-row group fade-in" style={{animationDelay: `${index * 150}ms`}}>
                                                    
                                                    {/* Image Section */}
                                                    <div className={`relative md:w-5/12 bg-black shrink-0 ${ratio === "9:16" ? 'h-[500px] md:h-auto md:min-h-[400px]' : 'h-64 md:h-auto'}`}>
                                                        {scene.generatedImage ? (
                                                            <>
                                                                <img 
                                                                    src={scene.generatedImage} 
                                                                    alt={`Scene ${scene.scene_number}`} 
                                                                    className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                                                
                                                                {/* Download Image Button */}
                                                                <button
                                                                    onClick={() => downloadImage(scene.generatedImage, `Wilhen_Cinecreator_Scene_${scene.scene_number}.png`)}
                                                                    className="absolute bottom-4 right-4 bg-white/10 hover:bg-cyan-500 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/20 transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 cursor-pointer"
                                                                    title="Download Gambar High-Res"
                                                                >
                                                                    <Download className="w-5 h-5" />
                                                                </button>

                                                                {/* Regenerate Image Button */}
                                                                <button
                                                                    onClick={() => regenerateScene(index)}
                                                                    className="absolute bottom-4 right-16 bg-white/10 hover:bg-purple-500 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/20 transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 cursor-pointer"
                                                                    title="Buat Ulang Gambar Scene Ini"
                                                                >
                                                                    <RefreshCw className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        ) : loadingImages[indexToKey(index)] ? (
                                                            <div className="w-full h-full loading-shimmer flex flex-col items-center justify-center text-gray-400 gap-3">
                                                                <ImageIcon className="w-10 h-10 animate-pulse text-slate-500" />
                                                                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Generating Image...</span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                                                                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                                                                <span className="text-xs mb-3 block">Gagal memuat gambar</span>
                                                                <button 
                                                                    onClick={() => regenerateScene(index)}
                                                                    className="px-4 py-2 bg-slate-800 rounded-full text-xs hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                                                                >
                                                                    Coba Lagi
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Scene Badge */}
                                                        <div className="absolute top-4 left-4">
                                                            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2 shadow-lg">
                                                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                                                SCENE {scene.scene_number}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content Section (Merged Output Box) */}
                                                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                                                                <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wider">
                                                                    Naskah & Prompt Video
                                                                </h3>
                                                                <button 
                                                                    onClick={() => copyToClipboard(combinedOutputText)}
                                                                    className="text-xs flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-cyan-500/20 cursor-pointer"
                                                                    title="Salin Naskah dan Prompt Sekaligus"
                                                                >
                                                                    <Copy className="w-3.5 h-3.5" /> Salin Semua
                                                                </button>
                                                            </div>
                                                            
                                                            {/* Unified Preformatted Output block */}
                                                            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800 font-mono text-xs text-slate-300 space-y-4 overflow-y-auto max-h-[460px] custom-scrollbar">
                                                                {(scene.arc_role || scene.story_beat) && (
                                                                    <div>
                                                                        <span className="text-emerald-400 font-bold block mb-1">🧭 ALUR{scene.arc_role ? ` — ${scene.arc_role}` : ""}:</span>
                                                                        <p className="font-sans text-xs text-emerald-200 leading-relaxed pl-3 border-l-2 border-emerald-500/40">
                                                                            {scene.story_beat}
                                                                            {scene.continuity_from_previous ? <span className="block text-emerald-300/70 mt-1">↩ {scene.continuity_from_previous}</span> : null}
                                                                            {scene.cliffhanger_to_next ? <span className="block text-emerald-300/70 mt-1">↪ {scene.cliffhanger_to_next}</span> : null}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {scene.narration_style_direction ? (
                                                                    <div>
                                                                        <span className="text-cyan-400 font-bold block mb-1">🎭 NADA & SUARA:</span>
                                                                        <p className="font-sans text-xs text-cyan-200 italic leading-relaxed pl-3 border-l-2 border-cyan-500/40 whitespace-pre-line">
                                                                            {scene.narration_style_direction}
                                                                        </p>
                                                                    </div>
                                                                ) : null}
                                                                <div>
                                                                    <span className="text-yellow-500 font-bold block mb-1">📢 NASKAH & DIALOG:</span>
                                                                    <p className="font-sans text-sm text-white leading-relaxed pl-3 border-l-2 border-yellow-500/40 whitespace-pre-line">
                                                                        {scene.narration}
                                                                    </p>
                                                                </div>
                                                                {scene.audio_prompt ? (
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-orange-400 font-bold">🔊 AUDIO & DIALOG (generator video ber-audio):</span>
                                                                            <CopyMini onCopy={() => copyToClipboard(scene.audio_prompt)} />
                                                                        </div>
                                                                        <p className="text-slate-400 leading-relaxed pl-3 border-l-2 border-orange-500/40 whitespace-pre-line">{scene.audio_prompt}</p>
                                                                    </div>
                                                                ) : null}
                                                                {(scene.image_prompt || scene.visual_description) ? (
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-pink-400 font-bold">🖼️ PROMPT GAMBAR (frame awal):</span>
                                                                            <CopyMini onCopy={() => copyToClipboard(scene.image_prompt || scene.visual_description)} />
                                                                        </div>
                                                                        <p className="text-slate-400 leading-relaxed pl-3 border-l-2 border-pink-500/40 whitespace-pre-line">{scene.image_prompt || scene.visual_description}</p>
                                                                    </div>
                                                                ) : null}
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-purple-400 font-bold">🎬 PROMPT VIDEO (lengkap):</span>
                                                                        <CopyMini onCopy={() => copyToClipboard(scene.video_prompt)} />
                                                                    </div>
                                                                    <p className="text-slate-400 leading-relaxed pl-3 border-l-2 border-purple-500/40 whitespace-pre-line">
                                                                        {scene.video_prompt}
                                                                    </p>
                                                                </div>
                                                                {scene.video_prompt_short ? (
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-violet-400 font-bold">⚡ PROMPT VIDEO (ringkas):</span>
                                                                            <CopyMini onCopy={() => copyToClipboard(scene.video_prompt_short)} />
                                                                        </div>
                                                                        <p className="text-slate-400 leading-relaxed pl-3 border-l-2 border-violet-500/40">{scene.video_prompt_short}</p>
                                                                    </div>
                                                                ) : null}
                                                                {scene.negative_prompt ? (
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-red-400 font-bold">🚫 NEGATIVE PROMPT:</span>
                                                                            <CopyMini onCopy={() => copyToClipboard(scene.negative_prompt)} />
                                                                        </div>
                                                                        <p className="text-slate-500 leading-relaxed pl-3 border-l-2 border-red-500/30">{scene.negative_prompt}</p>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        <div className="pt-4 border-t border-slate-800/60 mt-4">
                                                            <p className="text-[10px] text-slate-500">
                                                                Klik tombol <strong>"Salin Semua"</strong> di atas untuk menyalin gabungan gaya narasi, naskah, & prompt dalam format siap pakai.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        <div className="flex justify-center pt-8 pb-12">
                                            <button 
                                                onClick={apiKey ? generateStory : runDemoSimulation}
                                                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-medium transition border border-slate-700 flex items-center gap-2 cursor-pointer"
                                            >
                                                <RefreshCw className="w-4 h-4" /> Buat Variasi Baru
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* THUMBNAIL TAB VIEW */}
                                {activeTab === "thumbnail" && !isGeneratingText && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-300">
                                        
                                        {/* Canvas Preview Element (Left Workspace) */}
                                        <div className="md:col-span-7 space-y-4">
                                            <div className="glass-panel rounded-2xl p-4 flex flex-col">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Live Preview Canvas</span>
                                                    <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                                                        {ratio === "9:16" ? "9:16 Shorts/Reels" : "16:9 Landscape"}
                                                    </span>
                                                </div>

                                                <div className={`relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center ${
                                                    ratio === "9:16" ? "aspect-[9/16] max-h-[550px] w-auto mx-auto" : "aspect-video w-full"
                                                }`}>
                                                    {thumbnailImage ? (
                                                        <>
                                                            <img 
                                                                src={thumbnailImage} 
                                                                alt="Thumbnail Canvas Draft" 
                                                                className="w-full h-full object-cover select-none"
                                                            />
                                                            
                                                            {thumbnailOverlayText && (
                                                                <div className={`absolute inset-x-4 flex items-center justify-center select-none ${
                                                                    overlayPosition === "top" ? "top-10" : 
                                                                    overlayPosition === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-10"
                                                                }`}>
                                                                    <span 
                                                                        className="italic uppercase font-extrabold text-center tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] leading-tight select-none"
                                                                        style={{
                                                                            fontSize: ratio === '9:16' ? '1.5rem' : '2.5rem',
                                                                            color: overlayColor,
                                                                            fontFamily: "Impact, sans-serif",
                                                                            WebkitTextStroke: "2.5px black",
                                                                            textShadow: "4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000"
                                                                        }}
                                                                    >
                                                                        {thumbnailOverlayText}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : isGeneratingThumbnail ? (
                                                        <div className="w-full h-full loading-shimmer flex flex-col items-center justify-center text-gray-400 gap-3">
                                                            <RefreshCw className="w-10 h-10 animate-spin text-purple-400" />
                                                            <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">Rendering Visuals...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="p-8 text-center text-slate-500">
                                                            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                            <p className="text-xs">Klik tombol <strong>"Render Background Gambar"</strong> di kanan untuk mulai membuat.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {thumbnailImage && (
                                                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap gap-2 justify-between">
                                                        <span className="text-[10px] text-slate-400 my-auto">
                                                            *Kualitas penuh composite text akan digabungkan secara otomatis saat didownload.
                                                        </span>
                                                        <button
                                                            onClick={downloadCompositeThumbnail}
                                                            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
                                                        >
                                                            <Download className="w-4 h-4" /> Unduh Gambar Tergabung
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Configuration Settings (Right Workspace) */}
                                        <div className="md:col-span-5 space-y-6">
                                            <div className="glass-panel rounded-2xl p-5 space-y-4">
                                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                                                        1. Ide Hook Clickbait (AI)
                                                    </h4>
                                                    <button 
                                                        onClick={generateThumbnailIdeas}
                                                        disabled={isGeneratingSuggestions}
                                                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold px-2 py-1 rounded border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
                                                    >
                                                        {isGeneratingSuggestions ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Segarkan Ide"}
                                                    </button>
                                                </div>

                                                {isGeneratingSuggestions ? (
                                                    <div className="space-y-2 py-4">
                                                        <div className="h-6 bg-slate-800 rounded animate-pulse"></div>
                                                        <div className="h-6 bg-slate-800 rounded animate-pulse"></div>
                                                        <div className="h-6 bg-slate-800 rounded animate-pulse"></div>
                                                    </div>
                                                ) : thumbnailSuggestions.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] text-slate-400">Klik rekomendasi di bawah untuk memasangnya langsung pada Canvas:</p>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {thumbnailSuggestions.map((sug, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setThumbnailOverlayText(sug)}
                                                                    className={`p-2.5 text-left text-xs rounded-xl border font-mono transition-all flex justify-between items-center cursor-pointer ${
                                                                        thumbnailOverlayText === sug 
                                                                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                                                                            : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-white'
                                                                    }`}
                                                                >
                                                                    <span className="truncate">"{sug}"</span>
                                                                    <span className="text-[9px] bg-slate-800 text-slate-500 px-1 py-0.5 rounded">Terapkan</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 italic">Belum ada ide. Silakan masukkan topik lalu buat rekomendasi.</p>
                                                )}

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase text-slate-400 font-bold block">Teks Kustom Canvas:</label>
                                                    <input 
                                                        type="text"
                                                        value={thumbnailOverlayText}
                                                        onChange={(e) => setThumbnailOverlayText(e.target.value)}
                                                        placeholder="Ketik teks overlay kustom..."
                                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none transition"
                                                    />
                                                </div>
                                            </div>

                                            <div className="glass-panel rounded-2xl p-5 space-y-4">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-white/5">
                                                    2. Kustomisasi Teks Canvas
                                                </h4>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase text-slate-400 font-bold block">Posisi Teks:</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {["top", "middle", "bottom"].map((pos) => (
                                                            <button
                                                                key={pos}
                                                                onClick={() => setOverlayPosition(pos)}
                                                                className={`py-1.5 text-xs rounded-lg border capitalize transition ${
                                                                    overlayPosition === pos 
                                                                        ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                                                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                                                }`}
                                                            >
                                                                {pos === "top" ? "Atas" : pos === "middle" ? "Tengah" : "Bawah"}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase text-slate-400 font-bold block">Warna Isian Teks:</label>
                                                    <div className="flex gap-3">
                                                        {[
                                                            { hex: "#facc15", label: "Yellow" },
                                                            { hex: "#ef4444", label: "Red" },
                                                            { hex: "#06b6d4", label: "Cyan" },
                                                            { hex: "#ffffff", label: "White" }
                                                        ].map((col) => (
                                                            <button
                                                                key={col.hex}
                                                                onClick={() => setOverlayColor(col.hex)}
                                                                className="w-8 h-8 rounded-full border-2 border-slate-700 focus:outline-none relative transition transform hover:scale-105 active:scale-95"
                                                                style={{ backgroundColor: col.hex }}
                                                                title={col.label}
                                                            >
                                                                {overlayColor === col.hex && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-black font-extrabold text-xs">✓</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass-panel rounded-2xl p-5 space-y-4">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 pb-2 border-b border-white/5">
                                                    3. Background Gambar (AI)
                                                </h4>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase text-slate-400 font-bold block">Gaya Visual Thumbnail:</label>
                                                    <CustomSelect 
                                                        value={thumbnailStyle}
                                                        onChange={setThumbnailStyle}
                                                        disabled={isGeneratingThumbnail}
                                                        options={[
                                                            { value: "match_main", label: `🎨 Sesuai Gaya Video Utama (${theme})` },
                                                            { value: "Clickbait High-Contrast", label: "Clickbait High-Contrast (Pop Saturated)" },
                                                            { value: "Cinematic Pop", label: "Cinematic Dramatic" },
                                                            { value: "3D Disney Pixar Pop", label: "3D Pop Art Cartoon" },
                                                            { value: "Anime Epic Glow", label: "Epic Anime (Ufotable style)" },
                                                            { value: "Cyberpunk Saturated", label: "Neon Saturated Cyberpunk" }
                                                        ]}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase text-slate-400 font-bold block">Blueprint Visual Background (English):</label>
                                                    <textarea 
                                                        rows={3}
                                                        value={thumbnailPrompt}
                                                        onChange={(e) => setThumbnailPrompt(e.target.value)}
                                                        placeholder="AI visual composition description..."
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:border-cyan-500 outline-none transition resize-none leading-relaxed"
                                                    />
                                                </div>

                                                <button
                                                    onClick={generateThumbnailImage}
                                                    disabled={isGeneratingThumbnail || !thumbnailPrompt}
                                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    {isGeneratingThumbnail ? (
                                                        <><RefreshCw className="animate-spin w-4 h-4" /> Mengenerasikan Gambar...</>
                                                    ) : (
                                                        <><ImageIcon className="w-4 h-4" /> Render Background Gambar</>
                                                    )}
                                                </button>
                                            </div>

                                        </div>

                                    </div>
                                )}

                                {/* CAPTION & HASHTAG TAB VIEW */}
                                {activeTab === "caption" && !isGeneratingText && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        
                                        {isGeneratingCaptions ? (
                                            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
                                                <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                                                <h3 className="text-lg font-bold text-white mb-1">Menganalisis Konten & Membuat Copywriting</h3>
                                                <p className="text-emerald-400/80 animate-pulse text-xs">Menulis judul memikat, caption variatif, dan hashtag relevan...</p>
                                            </div>
                                        ) : socialCaptions ? (
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                                
                                                <div className="lg:col-span-5 space-y-6">
                                                    <div className="glass-panel p-5 rounded-2xl space-y-4">
                                                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Rekomendasi Judul Viral (High-CTR)</h3>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 leading-normal">
                                                            Pilihlah satu judul berkinerja tinggi di bawah untuk mendongkrak rasio klik tayang (*Click-Through-Rate*) video Anda:
                                                        </p>

                                                        <div className="space-y-2">
                                                            {socialCaptions.titles && socialCaptions.titles.map((title, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex justify-between items-center gap-3 transition-colors group select-all"
                                                                >
                                                                    <div className="flex gap-2.5 items-start">
                                                                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                                            {i + 1}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-slate-200 leading-snug">
                                                                            {title}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => copyToClipboard(title)}
                                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-400 rounded-lg transition-colors shrink-0 cursor-pointer"
                                                                        title="Salin Judul"
                                                                    >
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="glass-panel p-5 rounded-2xl space-y-4">
                                                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Hash className="w-5 h-5 text-emerald-400" />
                                                                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Kumpulan Hashtag Populer</h3>
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(socialCaptions.hashtags ? socialCaptions.hashtags.join(" ") : "")}
                                                                className="text-xs font-semibold text-emerald-400 hover:text-white hover:bg-emerald-500/20 px-2.5 py-1.5 border border-emerald-500/30 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Copy className="w-3 h-3" /> Salin Semua
                                                            </button>
                                                        </div>

                                                        <div className="flex flex-wrap gap-1.5">
                                                            {socialCaptions.hashtags && socialCaptions.hashtags.map((tag, idx) => (
                                                                <span 
                                                                    key={idx} 
                                                                    className="text-[10px] font-mono bg-slate-900/80 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 px-2 py-1 rounded-lg transition-colors select-all"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                </div>

                                                <div className="lg:col-span-7 space-y-4">
                                                    <div className="glass-panel p-5 rounded-2xl flex flex-col min-h-[400px]">
                                                        
                                                        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                                                            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                                <FileText className="w-5 h-5 text-emerald-400" /> Variasi Copywriting Caption
                                                            </h3>
                                                            <button
                                                                onClick={() => {
                                                                    const currentVal = activeCaptionSubtab === "shorts" ? socialCaptions.caption_shorts 
                                                                                     : activeCaptionSubtab === "instagram" ? socialCaptions.caption_instagram 
                                                                                     : socialCaptions.caption_youtube;
                                                                    copyToClipboard(currentVal);
                                                                }}
                                                                className="text-xs bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" /> Salin Teks Aktif
                                                            </button>
                                                        </div>

                                                        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 mb-5">
                                                            <button 
                                                                onClick={() => setActiveCaptionSubtab("shorts")}
                                                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${activeCaptionSubtab === "shorts" ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                                                            >
                                                                TikTok & Shorts (Punchy)
                                                            </button>
                                                            <button 
                                                                onClick={() => setActiveCaptionSubtab("instagram")}
                                                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${activeCaptionSubtab === "instagram" ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                                                            >
                                                                Instagram (Storytelling)
                                                            </button>
                                                            <button 
                                                                onClick={() => setActiveCaptionSubtab("youtube")}
                                                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${activeCaptionSubtab === "youtube" ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                                                            >
                                                                YouTube (SEO Optimized)
                                                            </button>
                                                        </div>

                                                        <div className="flex-1 bg-slate-950/80 rounded-xl p-5 border border-slate-800 font-sans text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-all overflow-y-auto max-h-[300px] custom-scrollbar">
                                                            {activeCaptionSubtab === "shorts" && (
                                                                <div className="space-y-4">
                                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">TikTok / Shorts / Reels Format:</div>
                                                                    <p className="italic text-base text-white">"{socialCaptions.caption_shorts}"</p>
                                                                </div>
                                                            )}
                                                            {activeCaptionSubtab === "instagram" && (
                                                                <div className="space-y-4">
                                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Instagram / Facebook Post Format:</div>
                                                                    <p className="text-slate-200 font-medium leading-relaxed">{socialCaptions.caption_instagram}</p>
                                                                </div>
                                                            )}
                                                            {activeCaptionSubtab === "youtube" && (
                                                                <div className="space-y-4">
                                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">YouTube Video Description Format (SEO):</div>
                                                                    <p className="text-slate-300 text-xs font-mono whitespace-pre-wrap">{socialCaptions.caption_youtube}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-4 pt-3 border-t border-slate-800/60">
                                                            <span className="text-[10px] text-slate-500 leading-normal block">
                                                                {activeCaptionSubtab === "shorts" && "💡 Tips: Unggah di TikTok menggunakan judul dengan CTR tinggi dan tempelkan caption super ringkas di atas untuk mengoptimalkan algoritma pencarian FYP!"}
                                                                {activeCaptionSubtab === "instagram" && "📸 Tips: Gunakan paragraf pemisah di atas untuk visual feed yang rapi dan memacu interaksi followers di kolom komentar."}
                                                                {activeCaptionSubtab === "youtube" && "🔍 Tips: Deskripsi ini padat akan kata kunci SEO guna membantu video Anda muncul di halaman pencarian teratas YouTube secara organik."}
                                                            </span>
                                                        </div>

                                                    </div>

                                                    <div className="flex justify-end">
                                                        <button 
                                                            onClick={generateSocialMediaPackage}
                                                            disabled={isGeneratingCaptions}
                                                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" /> Susun Ulang Copywriting
                                                        </button>
                                                    </div>

                                                </div>

                                            </div>
                                        ) : (
                                            <div className="glass-panel p-12 rounded-2xl text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
                                                <Share2 className="w-12 h-12 mb-3 opacity-20 text-emerald-400" />
                                                <p className="text-sm mb-4">Ingin menyusun taktik caption, judul, dan hashtag yang siap viral?</p>
                                                <button
                                                    onClick={generateSocialMediaPackage}
                                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                                                >
                                                    Dapatkan Paket Optimasi Medsos
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL ASISTEN API KEY INTERAKTIF */}
            {isGuideOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="glass-panel max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-cyan-500/20">
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="bg-cyan-500/20 text-cyan-400 p-1.5 rounded-lg text-sm">🔑</span>
                                Asisten Pembuat API Key Gemini
                            </h3>
                            <button 
                                onClick={() => setIsGuideOpen(false)}
                                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-slate-900/40 px-6 py-4 border-b border-white/5 flex justify-between items-center gap-1 overflow-x-auto">
                            {[1, 2, 3, 4].map((step) => (
                                <button 
                                    key={step}
                                    onClick={() => setGuideStep(step)}
                                    className="flex items-center gap-2 focus:outline-none shrink-0"
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        guideStep === step 
                                            ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                                            : guideStep > step 
                                                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400' 
                                                : 'bg-slate-800 border border-slate-700 text-slate-500'
                                    }`}>
                                        {guideStep > step ? "✓" : step}
                                    </div>
                                    <span className={`text-xs font-semibold ${guideStep === step ? 'text-white' : 'text-slate-500'}`}>
                                        {step === 1 && "Masuk"}
                                        {step === 2 && "Cari Menu"}
                                        {step === 3 && "Buat Kunci"}
                                        {step === 4 && "Tempel & Selesai"}
                                    </span>
                                    {step < 4 && <div className="w-6 h-[1px] bg-slate-800 hidden sm:block"></div>}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-900/20">
                            {guideStep === 1 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl text-xs text-cyan-300 leading-relaxed">
                                        💡 <strong>Tips Agar Cepat:</strong> Saat Anda mengklik tombol biru di bawah, Google AI Studio akan terbuka di tab baru. <strong>Biarkan tab application ini tetap terbuka</strong> agar Anda bisa kembali ke sini dengan mudah saat sudah mendapatkan kuncinya!
                                    </div>
                                    <h4 className="text-base font-bold text-white">Langkah 1: Buka Google AI Studio</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Klik tombol di bawah untuk membuka konsol pengembang AI Google di tab baru, lalu masuk (*Sign In*) menggunakan akun Google Anda.
                                    </p>
                                    <div className="pt-4 flex justify-center">
                                        <a 
                                            href="https://aistudio.google.com/" 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 animate-bounce"
                                        >
                                            Buka Google AI Studio ↗
                                        </a>
                                    </div>
                                </div>
                            )}

                            {guideStep === 2 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <h4 className="text-base font-bold text-white">Langkah 2: Temukan Menu "Get API key"</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Setelah berhasil masuk, perhatikan panel navigasi di sebelah kiri layar Anda. Cari opsi yang bertuliskan <strong>"Get API key"</strong> yang memiliki simbol kunci kecil.
                                    </p>
                                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-slate-400 border border-slate-800 max-w-md mx-auto">
                                        <div>┌──────────────────────────────────────┐</div>
                                        <div>│  🏠 Home                             │</div>
                                        <div className="text-cyan-400 font-bold">│  🔑 Get API key  ◄─── (KLIK DI SINI) │</div>
                                        <div>│  📊 Dashboard                        │</div>
                                        <div>└──────────────────────────────────────┘</div>
                                    </div>
                                </div>
                            )}

                            {guideStep === 3 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <h4 className="text-base font-bold text-white">Langkah 3: Buat Proyek & Kunci Baru</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                                        1. Klik tombol biru bertuliskan <strong className="text-cyan-400">"Create API key"</strong>.<br/>
                                        2. Pada jendela pilihan yang muncul, pilih opsi paling atas: <strong className="text-white">"Create API key in new project"</strong>. Google akan otomatis membuatkan penampung gratis di sistem mereka.
                                    </p>
                                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-slate-400 border border-slate-800 max-w-md mx-auto">
                                        <div>┌──────────────────────────────────────┐</div>
                                        <div>│  Create API key                      │</div>
                                        <div>├──────────────────────────────────────┤</div>
                                        <div className="text-emerald-400 font-bold">│ 🟩 Create API key in new project     │</div>
                                        <div>│ ⬜ Create API key in existing project│</div>
                                        <div>└──────────────────────────────────────┘</div>
                                    </div>
                                </div>
                            )}

                            {guideStep === 4 && (
                                <div className="space-y-5 animate-in fade-in duration-300">
                                    <h4 className="text-base font-bold text-white">Langkah Akhir: Salin & Simpan Kunci Anda</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Salin kode API Key yang muncul (biasanya diawali huruf <code className="text-cyan-400 font-mono">AIzaSy...</code>) dari tab Google AI Studio, lalu tempelkan langsung pada kolom di bawah ini:
                                    </p>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Tempel API Key Baru di Sini:</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={tempKey}
                                                onChange={(e) => setTempKey(e.target.value.trim())}
                                                placeholder="AIzaSy..."
                                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-cyan-500 outline-none transition"
                                            />
                                        </div>
                                    </div>
                                    {tempKey && tempKey.startsWith("AIzaSy") ? (
                                        <div className="bg-green-500/10 border border-green-500/20 text-green-300 text-xs p-3 rounded-lg flex items-center gap-2">
                                            <span>✓</span> Kunci berformat valid. Klik tombol simpan di bawah untuk mengaktifkan!
                                        </div>
                                    ) : tempKey ? (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs p-3 rounded-lg flex items-center gap-2">
                                            <span>⚠️</span> Format kunci biasanya dimulai dengan "AIzaSy". Pastikan Anda telah menyalinnya dengan benar.
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-slate-900/80 flex justify-between items-center gap-2">
                            <button 
                                disabled={guideStep === 1}
                                onClick={() => setGuideStep(prev => prev - 1)}
                                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>

                            {guideStep < 4 ? (
                                <button 
                                    onClick={() => setGuideStep(prev => prev + 1)}
                                    className="px-5 py-2.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition"
                                >
                                    Selanjutnya
                                </button>
                            ) : (
                                <button 
                                    disabled={!tempKey}
                                    onClick={() => {
                                        setApiKey(tempKey);
                                        safeStore.set("cinecreator_api_key", tempKey);
                                        setIsGuideOpen(false);
                                        setCopySuccess("API Key berhasil diaktifkan!");
                                        setTimeout(() => setCopySuccess(""), 3000);
                                    }}
                                    className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-lg transition shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Simpan & Aktifkan Kunci 🚀
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;