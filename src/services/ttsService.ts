// Web Speech API Chinese TTS Service with Natural Voice Prioritization

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private selectedVoiceURI: string = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoice();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoice();
      }
    }
  }

  // Get all available Chinese / Mandarin voices on the user's system
  public getAvailableChineseVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    return voices.filter(v =>
      v.lang.startsWith('zh') ||
      v.lang.includes('cmn') ||
      v.lang.includes('Chinese') ||
      v.name.toLowerCase().includes('chinese') ||
      v.name.toLowerCase().includes('mandarin')
    );
  }

  // Set specific voice by URI or Name
  public setVoiceByURI(uri: string) {
    this.selectedVoiceURI = uri;
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
    if (zhVoices.length === 0) return;

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
    return this.voice ? this.voice.name : 'Mặc định hệ thống';
  }

  public speak(text: string, rate: number = 0.75, pitch: number = 1.0, onEnd?: () => void) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported on this browser.');
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    if (!this.voice) {
      this.loadVoice();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    if (this.voice) {
      utterance.voice = this.voice;
    }

    // Default rate 0.75 is enunciated and clear for Chinese learners
    utterance.rate = Math.max(0.4, Math.min(1.5, rate || 0.75));
    utterance.pitch = Math.max(0.5, Math.min(1.5, pitch || 1.0));

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const tts = new TTSService();
