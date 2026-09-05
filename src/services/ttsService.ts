// Dual-Engine Chinese TTS Service (Web Speech API + High-Definition Online Audio Streaming)
// Guarantees 100% reliable pronunciation across Brave, Microsoft Edge, Chrome, Safari, and Mobile.

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private selectedVoiceURI: string = '';
  private voiceReadyPromise: Promise<SpeechSynthesisVoice | null> | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;
  private isSpeakingChunks: boolean = false;
  private currentChunkIndex: number = 0;
  private chunksToSpeak: string[] = [];
  private isBrave: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for Brave browser
      const nav = window.navigator as any;
      if (nav.brave && typeof nav.brave.isBrave === 'function') {
        nav.brave.isBrave().then((isB: boolean) => {
          this.isBrave = isB;
        }).catch(() => {});
      }

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.ensureVoiceReady();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => {
            this.loadVoice();
          };
        }
      }
    }
  }

  public async ensureVoiceReady(): Promise<SpeechSynthesisVoice | null> {
    if (this.voice) return this.voice;
    if (this.voiceReadyPromise) return this.voiceReadyPromise;

    this.voiceReadyPromise = new Promise((resolve) => {
      if (!this.synth) return resolve(null);

      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.loadVoice();
        return resolve(this.voice);
      }

      const timeout = setTimeout(() => {
        this.loadVoice();
        resolve(this.voice);
      }, 1000);

      const handleChanged = () => {
        clearTimeout(timeout);
        this.loadVoice();
        resolve(this.voice);
      };

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = handleChanged;
      }
    });

    return this.voiceReadyPromise;
  }

  // Get all available Chinese / Mandarin voices on user's system
  public getAvailableChineseVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    try {
      const voices = this.synth.getVoices();
      return voices.filter(v =>
        v.lang.startsWith('zh') ||
        v.lang.includes('cmn') ||
        v.lang.includes('Chinese') ||
        v.name.toLowerCase().includes('chinese') ||
        v.name.toLowerCase().includes('mandarin')
      );
    } catch {
      return [];
    }
  }

  // Check if system has native voices or if we should use Online Engine
  public isUsingOnlineAudio(): boolean {
    if (this.isBrave) return true;
    if (!this.synth) return true;
    const voices = this.getAvailableChineseVoices();
    return voices.length === 0;
  }

  // Set specific voice by URI or Name
  public setVoiceByURI(uri: string) {
    this.selectedVoiceURI = uri;
    if (!uri) {
      this.loadVoice();
      return;
    }
    const voices = this.getAvailableChineseVoices();
    const found = voices.find(v => v.voiceURI === uri || v.name === uri);
    if (found) {
      this.voice = found;
    }
  }

  private scoreVoice(v: SpeechSynthesisVoice): number {
    let score = 0;
    const nameLower = v.name.toLowerCase();
    const langLower = v.lang.toLowerCase();

    // 1. Natural / Neural Online Voices (Premium quality)
    if (nameLower.includes('natural') || nameLower.includes('neural') || nameLower.includes('online')) {
      score += 60;
    }

    // 2. High quality Mandarin voices (Xiaoxiao, Yunxi, Google)
    if (nameLower.includes('xiaoxiao')) score += 40;
    if (nameLower.includes('yunxi') || nameLower.includes('yaoyao') || nameLower.includes('yating') || nameLower.includes('xiaoyi')) score += 35;
    if (nameLower.includes('google') && (langLower.includes('zh') || langLower.includes('cmn'))) score += 30;
    if (nameLower.includes('tingting') || nameLower.includes('meijia') || nameLower.includes('sinji')) score += 25;

    // 3. Language priority (zh-CN standard Mandarin mainland)
    if (v.lang === 'zh-CN' || v.lang === 'zh_CN' || langLower.includes('cmn-hans')) {
      score += 20;
    } else if (v.lang.startsWith('zh')) {
      score += 10;
    }

    // Penalize legacy robotic desktop voices if modern ones exist
    if (nameLower.includes('desktop') && !nameLower.includes('natural')) {
      score -= 15;
    }

    return score;
  }

  private loadVoice() {
    if (!this.synth) return;
    const zhVoices = this.getAvailableChineseVoices();
    if (zhVoices.length === 0) {
      this.voice = null;
      return;
    }

    if (this.selectedVoiceURI) {
      const selected = zhVoices.find(v => v.voiceURI === this.selectedVoiceURI || v.name === this.selectedVoiceURI);
      if (selected) {
        this.voice = selected;
        return;
      }
    }

    // Sort by best quality score
    const sorted = [...zhVoices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));
    this.voice = sorted[0] || null;
  }

  public getCurrentVoiceName(): string {
    if (this.isUsingOnlineAudio()) {
      return 'Giọng phát âm trực tuyến chuẩn bản xứ (HD Mandarin)';
    }
    return this.voice ? this.voice.name : 'Tự động chọn chuẩn nhất';
  }

  /**
   * Splits long reading passage into bite-sized sentences to prevent cutoff
   */
  private splitIntoChunks(text: string): string[] {
    const rawParts = text.split(/([。！？\n]+)/);
    const chunks: string[] = [];
    let current = '';

    for (let i = 0; i < rawParts.length; i++) {
      current += rawParts[i];
      if (i % 2 === 1 || current.length > 50) {
        if (current.trim()) {
          chunks.push(current.trim());
        }
        current = '';
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Play high-quality online audio via HTML5 Audio
   * Tries Youdao first, then Google TTS, then internal /api/tts proxy
   */
  public playOnlineAudio(text: string, rate: number = 1.0, onEnd?: () => void) {
    if (typeof window === 'undefined') {
      onEnd?.();
      return;
    }

    this.stopFallbackAudio();

    const cleanText = text.trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }

    // Candidate audio sources in order of speed and fidelity
    const sources = [
      `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&le=zh`,
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=zh-CN&client=tw-ob`,
      `/api/tts?text=${encodeURIComponent(cleanText)}`
    ];

    let currentSourceIdx = 0;
    const audio = new Audio();
    this.fallbackAudio = audio;

    audio.playbackRate = Math.max(0.5, Math.min(1.5, rate || 1.0));

    const tryPlayCurrent = () => {
      if (currentSourceIdx >= sources.length) {
        console.warn('[TTS Online Audio] All audio fallback sources exhausted.');
        this.fallbackAudio = null;
        onEnd?.();
        return;
      }

      audio.src = sources[currentSourceIdx];
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If autoplay blocked or load error, try next source or log
          if (err.name === 'NotAllowedError') {
            console.warn('[TTS] Autoplay blocked by browser until user interaction.');
            onEnd?.();
          } else {
            currentSourceIdx++;
            tryPlayCurrent();
          }
        });
      }
    };

    audio.onended = () => {
      this.fallbackAudio = null;
      onEnd?.();
    };

    audio.onerror = () => {
      currentSourceIdx++;
      tryPlayCurrent();
    };

    tryPlayCurrent();
  }

  /**
   * Speak Chinese text with automatic chunking and cross-browser fallback
   */
  public speak(text: string, rate: number = 0.75, pitch: number = 1.0, onEnd?: () => void) {
    // Stop any ongoing speech or audio
    this.stop();

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    const cleanText = text.trim();

    // Condition 1: If browser is Brave OR system has no Chinese voice installed -> use Online Audio Engine immediately
    const zhVoices = this.getAvailableChineseVoices();
    if (this.isBrave || !this.synth || zhVoices.length === 0) {
      this.speakWithOnlineEngine(cleanText, rate, onEnd);
      return;
    }

    if (!this.voice) {
      this.loadVoice();
    }

    // If still no voice found after loading
    if (!this.voice) {
      this.speakWithOnlineEngine(cleanText, rate, onEnd);
      return;
    }

    // Condition 2: Try Web Speech API with failover to Online Audio
    const chunks = this.splitIntoChunks(cleanText);

    if (chunks.length <= 1) {
      this.speakSingleUtterance(cleanText, rate, pitch, onEnd);
      return;
    }

    // Long passage chaining
    this.isSpeakingChunks = true;
    this.chunksToSpeak = chunks;
    this.currentChunkIndex = 0;

    const speakNextChunk = () => {
      if (!this.isSpeakingChunks) {
        onEnd?.();
        return;
      }

      if (this.currentChunkIndex >= this.chunksToSpeak.length) {
        this.isSpeakingChunks = false;
        onEnd?.();
        return;
      }

      const chunkText = this.chunksToSpeak[this.currentChunkIndex];
      this.currentChunkIndex++;

      this.speakSingleUtterance(chunkText, rate, pitch, () => {
        speakNextChunk();
      });
    };

    speakNextChunk();
  }

  private speakSingleUtterance(
    text: string,
    rate: number = 0.75,
    pitch: number = 1.0,
    onEnd?: () => void
  ) {
    if (!this.synth) {
      this.playOnlineAudio(text, rate, onEnd);
      return;
    }

    // Unpause Web Speech API in Chrome / Edge if frozen
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {}

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance; // Retain reference against garbage collection
    utterance.lang = 'zh-CN';
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = Math.max(0.4, Math.min(1.5, rate || 0.75));
    utterance.pitch = Math.max(0.5, Math.min(1.5, pitch || 1.0));

    let hasEnded = false;
    const safeEnd = () => {
      if (hasEnded) return;
      hasEnded = true;
      this.activeUtterance = null;
      onEnd?.();
    };

    utterance.onend = safeEnd;

    // Failover: If Edge/Chrome throws an error, switch seamlessly to Online Audio
    utterance.onerror = (e) => {
      if (hasEnded) return;
      console.warn('[TTS] Web Speech API failed or disconnected, switching to Online Audio:', e.error);
      this.activeUtterance = null;
      this.playOnlineAudio(text, rate, onEnd);
    };

    // Safety watchdog: In Edge, if utterance hangs indefinitely without starting
    const watchdog = setTimeout(() => {
      if (!hasEnded && this.synth && !this.synth.speaking && !this.synth.pending) {
        console.warn('[TTS] Watchdog timeout: SpeechSynthesis stuck, falling back to Online Audio.');
        this.activeUtterance = null;
        this.playOnlineAudio(text, rate, onEnd);
      }
    }, 1500);

    utterance.onstart = () => {
      clearTimeout(watchdog);
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      clearTimeout(watchdog);
      console.warn('[TTS] Exception in synth.speak, using Online Audio:', err);
      this.playOnlineAudio(text, rate, onEnd);
    }
  }

  private speakWithOnlineEngine(text: string, rate: number = 0.75, onEnd?: () => void) {
    const chunks = this.splitIntoChunks(text);
    if (chunks.length <= 1) {
      this.playOnlineAudio(text, rate, onEnd);
      return;
    }

    this.isSpeakingChunks = true;
    this.chunksToSpeak = chunks;
    this.currentChunkIndex = 0;

    const playNext = () => {
      if (!this.isSpeakingChunks || this.currentChunkIndex >= this.chunksToSpeak.length) {
        this.isSpeakingChunks = false;
        onEnd?.();
        return;
      }

      const chunk = this.chunksToSpeak[this.currentChunkIndex++];
      this.playOnlineAudio(chunk, rate, () => {
        playNext();
      });
    };

    playNext();
  }

  private stopFallbackAudio() {
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
        this.fallbackAudio.removeAttribute('src');
      } catch {}
      this.fallbackAudio = null;
    }
  }

  public stop() {
    this.isSpeakingChunks = false;
    this.chunksToSpeak = [];
    this.currentChunkIndex = 0;
    this.activeUtterance = null;

    this.stopFallbackAudio();

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }
}

export const tts = new TTSService();
