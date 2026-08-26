// Web Speech API Chinese TTS Service

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoice();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoice();
      }
    }
  }

  private loadVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural standard Mandarin voices
    const zhVoices = voices.filter(v => v.lang.startsWith('zh') || v.lang.includes('cmn') || v.lang.includes('Chinese'));
    
    // Preference: zh-CN > zh-TW > any zh
    this.voice = zhVoices.find(v => v.lang === 'zh-CN') ||
                 zhVoices.find(v => v.name.toLowerCase().includes('chinese') || v.name.toLowerCase().includes('mandarin')) ||
                 zhVoices[0] ||
                 null;
  }

  public speak(text: string, rate: number = 0.85, pitch: number = 1.0, onEnd?: () => void) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported on this browser.');
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;

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
