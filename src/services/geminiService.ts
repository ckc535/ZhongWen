import { Word, StoryPassage, DetectedNewWord, StoryToken } from '../types';

export type AiConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export interface GeminiAutoFillResult {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  hanViet: string;
  exampleSentence: string;
  examplePinyin: string;
  exampleVietnamese: string;
  radicals: string;
  mnemonic: string;
  hskLevel: number;
}

export interface StoryLengthOption {
  type: 'short' | 'medium' | 'long' | 'custom';
  customWords?: number;
}

// Clean and use exact model name specified by user (e.g. gemini-3.6-flash, gemini-3.7-flash, gemini-3.5-flash)
function normalizeModelName(rawModel?: string): string {
  if (!rawModel || !rawModel.trim()) {
    return import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
  }
  return rawModel.trim().replace(/^models\//, '');
}

// Helper to strip Vietnamese accents for fuzzy matching
function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Fallback dictionary for common inputs if API key is not yet set
const OFFLINE_FALLBACK_DICT: Record<string, Partial<GeminiAutoFillResult>> = {
  'tao': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },
  'qua tao': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },
  'trai tao': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },
  'pingguo': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },
  '苹果': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },

  'uong nuoc': { hanzi: '喝水', pinyin: 'hē shuǐ', vietnamese: 'uống nước', hanViet: 'Hát thủy', exampleSentence: '我想喝水。', examplePinyin: 'Wǒ xiǎng hē shuǐ.', exampleVietnamese: 'Tôi muốn uống nước.', radicals: '口 + 氵', mnemonic: 'Mở miệng (口) uống dòng nước (氵).', hskLevel: 1 },
  'heshui': { hanzi: '喝水', pinyin: 'hē shuǐ', vietnamese: 'uống nước', hanViet: 'Hát thủy', exampleSentence: '我想喝水。', examplePinyin: 'Wǒ xiǎng hē shuǐ.', exampleVietnamese: 'Tôi muốn uống nước.', radicals: '口 + 氵', mnemonic: 'Mở miệng (口) uống dòng nước (氵).', hskLevel: 1 },
  '喝水': { hanzi: '喝水', pinyin: 'hē shuǐ', vietnamese: 'uống nước', hanViet: 'Hát thủy', exampleSentence: '我想喝水。', examplePinyin: 'Wǒ xiǎng hē shuǐ.', exampleVietnamese: 'Tôi muốn uống nước.', radicals: '口 + 氵', mnemonic: 'Mở miệng (口) uống dòng nước (氵).', hskLevel: 1 },

  'an com': { hanzi: '吃饭', pinyin: 'chī fàn', vietnamese: 'ăn cơm / dùng bữa', hanViet: 'Ngật phạn', exampleSentence: '你吃饭了吗？', examplePinyin: 'Nǐ chī fàn le ma?', exampleVietnamese: 'Bạn ăn cơm chưa?', radicals: '口 + 饣', mnemonic: 'Mở miệng (口) thưởng thức đồ ăn (饣).', hskLevel: 1 },
  'chifan': { hanzi: '吃饭', pinyin: 'chī fàn', vietnamese: 'ăn cơm / dùng bữa', hanViet: 'Ngật phạn', exampleSentence: '你吃饭了吗？', examplePinyin: 'Nǐ chī fàn le ma?', exampleVietnamese: 'Bạn ăn cơm chưa?', radicals: '口 + 饣', mnemonic: 'Mở miệng (口) thưởng thức đồ ăn (饣).', hskLevel: 1 },
  '吃饭': { hanzi: '吃饭', pinyin: 'chī fàn', vietnamese: 'ăn cơm / dùng bữa', hanViet: 'Ngật phạn', exampleSentence: '你吃饭了吗？', examplePinyin: 'Nǐ chī fàn le ma?', exampleVietnamese: 'Bạn ăn cơm chưa?', radicals: '口 + 饣', mnemonic: 'Mở miệng (口) thưởng thức đồ ăn (饣).', hskLevel: 1 },

  'di hoc': { hanzi: '去上学', pinyin: 'qù shàngxué', vietnamese: 'đi học', hanViet: 'Khứ thượng học', exampleSentence: '我们一起去上学吧。', examplePinyin: 'Wǒmen yìqǐ qù shàngxué ba.', exampleVietnamese: 'Chúng ta cùng đi học nhé.', radicals: '土 + 厶 + 冂', mnemonic: 'Bước chân rời nhà đến trường học.', hskLevel: 1 },
  'yeu': { hanzi: '爱', pinyin: 'ài', vietnamese: 'yêu / thương', hanViet: 'Ái', exampleSentence: '我爱你。', examplePinyin: 'Wǒ ài nǐ.', exampleVietnamese: 'Tôi yêu bạn.', radicals: '爫 + 冖 + 友', mnemonic: 'Dùng cả trái tim và sự bao bọc để đối xử với bạn bè/người thương.', hskLevel: 1 },
  'ai': { hanzi: '爱', pinyin: 'ài', vietnamese: 'yêu / thương', hanViet: 'Ái', exampleSentence: '我爱你。', examplePinyin: 'Wǒ ài nǐ.', exampleVietnamese: 'Tôi yêu bạn.', radicals: '爫 + 冖 + 友', mnemonic: 'Dùng cả trái tim và sự bao bọc để đối xử với bạn bè/người thương.', hskLevel: 1 },
  '爱': { hanzi: '爱', pinyin: 'ài', vietnamese: 'yêu / thương', hanViet: 'Ái', exampleSentence: '我爱你。', examplePinyin: 'Wǒ ài nǐ.', exampleVietnamese: 'Tôi yêu bạn.', radicals: '爫 + 冖 + 友', mnemonic: 'Dùng cả trái tim và sự bao bọc để đối xử với bạn bè/người thương.', hskLevel: 1 },

  'ban be': { hanzi: '朋友', pinyin: 'péngyou', vietnamese: 'bạn bè / bằng hữu', hanViet: 'Bằng hữu', exampleSentence: '他是我的好朋友。', examplePinyin: 'Tā shì wǒ de hǎo péngyou.', exampleVietnamese: 'Cậu ấy là bạn tốt của tôi.', radicals: '月 + 月 + 又', mnemonic: 'Hai vầng trăng soi chiếu cùng đôi bàn tay kề vai sát cánh.', hskLevel: 1 },
  'pengyou': { hanzi: '朋友', pinyin: 'péngyou', vietnamese: 'bạn bè / bằng hữu', hanViet: 'Bằng hữu', exampleSentence: '他是我的好朋友。', examplePinyin: 'Tā shì wǒ de hǎo péngyou.', exampleVietnamese: 'Cậu ấy là bạn tốt của tôi.', radicals: '月 + 月 + 又', mnemonic: 'Hai vầng trăng soi chiếu cùng đôi bàn tay kề vai sát cánh.', hskLevel: 1 },
  '朋友': { hanzi: '朋友', pinyin: 'péngyou', vietnamese: 'bạn bè / bằng hữu', hanViet: 'Bằng hữu', exampleSentence: '他是我的好朋友。', examplePinyin: 'Tā shì wǒ de hǎo péngyou.', exampleVietnamese: 'Cậu ấy là bạn tốt của tôi.', radicals: '月 + 月 + 又', mnemonic: 'Hai vầng trăng soi chiếu cùng đôi bàn tay kề vai sát cánh.', hskLevel: 1 },

  'tra': { hanzi: '茶', pinyin: 'chá', vietnamese: 'trà / chè', hanViet: 'Trà', exampleSentence: '请喝茶。', examplePinyin: 'Qǐng hē chá.', exampleVietnamese: 'Mời bạn uống trà.', radicals: '艹 + 人 + 木', mnemonic: 'Người (人) đứng giữa ngọn cỏ (艹) và thân cây (木) để hái lá trà.', hskLevel: 1 },
  'cha': { hanzi: '茶', pinyin: 'chá', vietnamese: 'trà / chè', hanViet: 'Trà', exampleSentence: '请喝茶。', examplePinyin: 'Qǐng hē chá.', exampleVietnamese: 'Mời bạn uống trà.', radicals: '艹 + 人 + 木', mnemonic: 'Người (人) đứng giữa ngọn cỏ (艹) và thân cây (木) để hái lá trà.', hskLevel: 1 },
  '茶': { hanzi: '茶', pinyin: 'chá', vietnamese: 'trà / chè', hanViet: 'Trà', exampleSentence: '请喝茶。', examplePinyin: 'Qǐng hē chá.', exampleVietnamese: 'Mời bạn uống trà.', radicals: '艹 + 人 + 木', mnemonic: 'Người (人) đứng giữa ngọn cỏ (艹) và thân cây (木) để hái lá trà.', hskLevel: 1 },

  'ca phe': { hanzi: '咖啡', pinyin: 'kāfēi', vietnamese: 'cà phê', hanViet: 'Cà phê', exampleSentence: '我想喝咖啡。', examplePinyin: 'Wǒ xiǎng hē kāfēi.', exampleVietnamese: 'Tôi muốn uống cà phê.', radicals: '口 + 口', mnemonic: 'Mở miệng (口) thưởng thức hương vị cà phê.', hskLevel: 1 },
  'kafei': { hanzi: '咖啡', pinyin: 'kāfēi', vietnamese: 'cà phê', hanViet: 'Cà phê', exampleSentence: '我想喝咖啡。', examplePinyin: 'Wǒ xiǎng hē kāfēi.', exampleVietnamese: 'Tôi muốn uống cà phê.', radicals: '口 + 口', mnemonic: 'Mở miệng (口) thưởng thức hương vị cà phê.', hskLevel: 1 },
  '咖啡': { hanzi: '咖啡', pinyin: 'kāfēi', vietnamese: 'cà phê', hanViet: 'Cà phê', exampleSentence: '我想喝咖啡。', examplePinyin: 'Wǒ xiǎng hē kāfēi.', exampleVietnamese: 'Tôi muốn uống cà phê.', radicals: '口 + 口', mnemonic: 'Mở miệng (口) thưởng thức hương vị cà phê.', hskLevel: 1 },

  'sach': { hanzi: '书', pinyin: 'shū', vietnamese: 'sách / thư', hanViet: 'Thư', exampleSentence: '这是一本书。', examplePinyin: 'Zhè shì yì běn shū.', exampleVietnamese: 'Đây là một quyển sách.', radicals: '𠃍 + 丨 + 丶', mnemonic: 'Hình ảnh cuốn sách mở ra với chiếc bút đang viết.', hskLevel: 1 },
  'shu': { hanzi: '书', pinyin: 'shū', vietnamese: 'sách / thư', hanViet: 'Thư', exampleSentence: '这是一本书。', examplePinyin: 'Zhè shì yì běn shū.', exampleVietnamese: 'Đây là một quyển sách.', radicals: '𠃍 + 丨 + 丶', mnemonic: 'Hình ảnh cuốn sách mở ra với chiếc bút đang viết.', hskLevel: 1 },
  '书': { hanzi: '书', pinyin: 'shū', vietnamese: 'sách / thư', hanViet: 'Thư', exampleSentence: '这是一本书。', examplePinyin: 'Zhè shì yì běn shū.', exampleVietnamese: 'Đây là một quyển sách.', radicals: '𠃍 + 丨 + 丶', mnemonic: 'Hình ảnh cuốn sách mở ra với chiếc bút đang viết.', hskLevel: 1 }
};

export class GeminiService {
  private static connectionState: AiConnectionState = 'idle';
  private static listeners: Set<(state: AiConnectionState) => void> = new Set();
  private static activeWs: WebSocket | null = null;
  private static wsPendingResolve: ((text: string) => void) | null = null;
  private static wsPendingReject: ((err: Error) => void) | null = null;
  private static wsOnChunk: ((acc: string, chunk: string) => void) | null = null;
  private static wsAccumulatedText = '';

  // Multi-API-Key Pool with Automatic Failover / Round-Robin
  private static keyPool: string[] = [];
  private static activeKeyIndex: number = 0;

  public static getConnectionState(): AiConnectionState {
    return GeminiService.connectionState;
  }

  public static onConnectionStateChange(cb: (state: AiConnectionState) => void): () => void {
    GeminiService.listeners.add(cb);
    cb(GeminiService.connectionState);
    return () => {
      GeminiService.listeners.delete(cb);
    };
  }

  private static setConnectionState(state: AiConnectionState) {
    GeminiService.connectionState = state;
    GeminiService.listeners.forEach(cb => cb(state));
  }

  // Parses comma-separated or multi-line API keys into pool
  public static setApiKeyPool(rawKeys?: string): void {
    if (!rawKeys) {
      const envKeys = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!envKeys) {
        GeminiService.keyPool = [];
        return;
      }
      rawKeys = envKeys;
    }
    const parsed = rawKeys
      .split(/[,;\n]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
    GeminiService.keyPool = parsed;
    if (GeminiService.activeKeyIndex >= parsed.length) {
      GeminiService.activeKeyIndex = 0;
    }
  }

  public static getActiveApiKey(fallbackKey?: string): string {
    if (GeminiService.keyPool.length > 0) {
      return GeminiService.keyPool[GeminiService.activeKeyIndex];
    }
    const envKeys = import.meta.env.VITE_GEMINI_API_KEY || fallbackKey || '';
    if (envKeys.trim()) {
      GeminiService.setApiKeyPool(envKeys);
      return GeminiService.keyPool[0] || '';
    }
    return '';
  }

  public static rotateToNextApiKey(): { key: string; index: number; total: number } | null {
    if (GeminiService.keyPool.length <= 1) {
      return null;
    }
    GeminiService.activeKeyIndex = (GeminiService.activeKeyIndex + 1) % GeminiService.keyPool.length;
    const nextKey = GeminiService.keyPool[GeminiService.activeKeyIndex];
    console.log(`[Gemini Multi-Key] Tự động chuyển sang API Key #${GeminiService.activeKeyIndex + 1}/${GeminiService.keyPool.length}`);
    return {
      key: nextKey,
      index: GeminiService.activeKeyIndex + 1,
      total: GeminiService.keyPool.length
    };
  }

  // ================= 1. ALWAYS-ON REALTIME PORT & HEALTH CHECK =================
  public static async initWebSocketSession(rawApiKey?: string, model?: string): Promise<void> {
    const envKey = rawApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';

    if (envKey) {
      GeminiService.setApiKeyPool(envKey);
    }

    const currentKey = GeminiService.getActiveApiKey(envKey);
    if (!currentKey) {
      GeminiService.setConnectionState('idle');
      return;
    }

    GeminiService.setConnectionState('connecting');
    const targetModel = normalizeModelName(envModel);

    // 1. Health-check the active key against Google Gemini API for the exact model in .env
    const verifyKey = async (key: string): Promise<boolean> => {
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}?key=${key}`;
        const res = await fetch(testUrl, { method: 'GET', keepalive: true });
        if (res.ok) {
          return true;
        }
        if (res.status === 429 || res.status === 403) {
          const next = GeminiService.rotateToNextApiKey();
          if (next) {
            console.log(`[Gemini Multi-Key] Key #${GeminiService.activeKeyIndex} bị 429/403. Đang thử Key #${next.index}...`);
            return verifyKey(next.key);
          }
        }
        return false;
      } catch {
        return false;
      }
    };

    const isHealthy = await verifyKey(currentKey);
    if (isHealthy) {
      GeminiService.setConnectionState('connected');
      console.log(`🟢 [Gemini Engine] Đã kết nối sẵn sàng tới model "${targetModel}"`);
    } else {
      GeminiService.setConnectionState('error');
      console.warn(`🔴 [Gemini Engine] Không thể kết nối tới model "${targetModel}". Vui lòng kiểm tra API Key trong .env`);
      return;
    }

    // 2. Open WebSocket Session using the exact target model
    try {
      if (GeminiService.activeWs && GeminiService.activeWs.readyState === WebSocket.OPEN) {
        return;
      }

      const activeKey = GeminiService.getActiveApiKey();
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${activeKey}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        const setupMessage = {
          setup: {
            model: `models/${targetModel}`,
            generationConfig: {
              responseModalities: ['TEXT']
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));
        GeminiService.activeWs = ws;
        console.log(`⚡ [Gemini WebSocket] Cổng WebSocket Bidi đã mở với model "${targetModel}"`);
      };

      ws.onmessage = async (event) => {
        try {
          let textData = '';
          if (typeof event.data === 'string') {
            textData = event.data;
          } else if (event.data instanceof Blob) {
            textData = await event.data.text();
          }

          if (!textData) return;
          const msg = JSON.parse(textData);

          const textChunk = msg.serverContent?.modelTurn?.parts?.[0]?.text || '';
          if (textChunk) {
            GeminiService.wsAccumulatedText += textChunk;
            if (GeminiService.wsOnChunk) {
              GeminiService.wsOnChunk(GeminiService.wsAccumulatedText, textChunk);
            }
          }

          if (msg.serverContent?.turnComplete) {
            if (GeminiService.wsPendingResolve) {
              GeminiService.wsPendingResolve(GeminiService.wsAccumulatedText);
              GeminiService.wsPendingResolve = null;
              GeminiService.wsPendingReject = null;
            }
          }
        } catch {
          // ignore non-json frames
        }
      };

      ws.onerror = () => {
        console.warn(`⚠️ [Gemini WebSocket] WebSocket ngắt, hệ thống sẽ sử dụng luồng HTTP/2 Stream cho model "${targetModel}"`);
      };

      ws.onclose = () => {
        GeminiService.activeWs = null;
      };
    } catch {
      // ignore
    }
  }

  // Send request through the established WebSocket port
  private static async sendThroughWebSocket(
    prompt: string,
    modelName: string,
    onChunk?: (acc: string, chunk: string) => void
  ): Promise<string> {
    if (!GeminiService.activeWs || GeminiService.activeWs.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket port is not ready');
    }

    console.log(`⚡ [WebSocket Stream] Đang gửi yêu cầu trực tiếp tới "${modelName}" qua WebSocket...`);

    return new Promise((resolve, reject) => {
      GeminiService.wsAccumulatedText = '';
      GeminiService.wsOnChunk = onChunk || null;
      GeminiService.wsPendingResolve = resolve;
      GeminiService.wsPendingReject = reject;

      const clientMsg = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          turnComplete: true
        }
      };

      GeminiService.activeWs!.send(JSON.stringify(clientMsg));

      setTimeout(() => {
        if (GeminiService.wsPendingResolve) {
          if (GeminiService.wsAccumulatedText) {
            resolve(GeminiService.wsAccumulatedText);
          } else {
            reject(new Error('WebSocket request timed out'));
          }
          GeminiService.wsPendingResolve = null;
          GeminiService.wsPendingReject = null;
        }
      }, 20000);
    });
  }

  // Pre-warm helper called immediately on site load across all pages
  public static prewarmConnection(rawApiKey?: string, model?: string): void {
    GeminiService.initWebSocketSession(rawApiKey, model);
  }

  // Super-Resilient JSON extractor and auto-repairer
  public static safeExtractAndParseJson(text: string): any {
    let clean = text.trim();

    if (clean.includes('```json')) {
      const parts = clean.split('```json');
      if (parts[1]) {
        clean = parts[1].split('```')[0].trim();
      }
    } else if (clean.includes('```')) {
      const parts = clean.split('```');
      if (parts[1]) {
        clean = parts[1].split('```')[0].trim();
      }
    }

    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');

    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    }

    try {
      return JSON.parse(clean);
    } catch {
      try {
        const repaired = clean
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\\'/g, "'");
        return JSON.parse(repaired);
      } catch {
        try {
          const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/);
          const chineseMatch = text.match(/"chineseText"\s*:\s*"([^"]*)"/);
          const pinyinMatch = text.match(/"pinyinText"\s*:\s*"([^"]*)"/);
          const viMatch = text.match(/"vietnameseTranslation"\s*:\s*"([^"]*)"/);

          if (chineseMatch && chineseMatch[1]) {
            const rawChinese = chineseMatch[1];
            return {
              title: titleMatch ? titleMatch[1] : 'Đoạn văn luyện đọc',
              titlePinyin: pinyinMatch ? pinyinMatch[1] : '',
              titleVietnamese: viMatch ? viMatch[1] : '',
              chineseText: rawChinese,
              pinyinText: pinyinMatch ? pinyinMatch[1] : '',
              vietnameseTranslation: viMatch ? viMatch[1] : '',
              sentences: rawChinese.split(/[。！？\n]/).filter(s => s.trim().length > 0).map(s => ({
                chinese: s.trim() + '。',
                pinyin: '',
                vietnamese: '',
                tokens: []
              })),
              newWordsDetected: []
            };
          }
        } catch {
          // ignore
        }

        console.error('Failed to parse JSON from AI response:', text);
        throw new Error('Dữ liệu AI trả về không đúng cấu trúc JSON chuẩn. Vui lòng thử lại.');
      }
    }
  }

  // Unified High-Speed Stream Engine: WebSocket First with Automatic HTTP Stream Fallback
  public static async callAiEngineStream(
    apiKeyInput: string,
    model: string,
    prompt: string,
    isJson: boolean = true,
    onChunk?: (accumulatedText: string, latestChunk: string) => void
  ): Promise<string> {
    const envKey = apiKeyInput || import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';

    if (envKey) {
      GeminiService.setApiKeyPool(envKey);
    }

    const targetModel = normalizeModelName(envModel);
    const totalKeys = Math.max(1, GeminiService.keyPool.length);
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < totalKeys) {
      const currentKey = GeminiService.getActiveApiKey(envKey);
      if (!currentKey) {
        throw new Error('Vui lòng nhập Google Gemini API Key trong file .env');
      }

      try {
        // 1. Try WebSocket Port first (Zero Handshake Latency)
        if (GeminiService.activeWs && GeminiService.activeWs.readyState === WebSocket.OPEN) {
          try {
            const wsResult = await GeminiService.sendThroughWebSocket(prompt, targetModel, onChunk);
            if (wsResult && wsResult.trim().length > 0) {
              console.log(`✅ [WebSocket] Đã nhận thành công kết quả từ model "${targetModel}" qua WebSocket`);
              return wsResult;
            }
          } catch (wsErr) {
            console.warn('WebSocket stream fallback to HTTP SSE:', wsErr);
          }
        }

        // 2. HTTP SSE Streaming for the exact model in .env
        console.log(`🌐 [HTTP Stream] Đang gửi yêu cầu stream tới model "${targetModel}"...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?key=${currentKey}&alt=sse`;

        const requestBody: {
          contents: Array<{ parts: Array<{ text: string }> }>;
          generationConfig?: {
            temperature: number;
            responseMimeType?: string;
          };
        } = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        };

        if (isJson) {
          requestBody.generationConfig!.responseMimeType = 'application/json';
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          keepalive: true
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || response.statusText;

          // 429: Rate Limit / Quota Exceeded ➔ Auto Switch Key!
          if (response.status === 429 || response.status === 403) {
            if (GeminiService.keyPool.length > 1) {
              const rotated = GeminiService.rotateToNextApiKey();
              if (rotated) {
                console.warn(`Key #${rotated.index - 1} bị giới hạn (429). Tự động đổi sang Key #${rotated.index}...`);
                attempts++;
                // Reconnect socket with new key
                GeminiService.initWebSocketSession(rotated.key, targetModel);
                continue;
              }
            }
            throw new Error(`Mô hình "${targetModel}" đã hết lượt dùng hôm nay (429 Quota Exceeded). Bạn hãy chuyển sang "gemini-3.7-flash" hoặc thêm nhiều API Key trong file .env cách nhau bởi dấu phẩy.`);
          }

          throw new Error(`Lỗi Gemini API (${response.status}): ${errorMsg}`);
        }

        if (!response.body) {
          throw new Error('Không thể khởi tạo luồng dữ liệu stream từ Gemini API');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.substring(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const data = JSON.parse(jsonStr);
                const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (chunk) {
                  accumulatedText += chunk;
                  if (onChunk) {
                    onChunk(accumulatedText, chunk);
                  }
                }
              } catch {
                // ignore partial SSE lines
              }
            }
          }
        }

        if (!accumulatedText) {
          throw new Error('Gemini API không trả về nội dung stream');
        }

        console.log(`✅ [HTTP Stream] Đã nhận thành công kết quả từ model "${targetModel}"`);
        return accumulatedText;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (GeminiService.keyPool.length > 1 && attempts < totalKeys - 1) {
          GeminiService.rotateToNextApiKey();
          attempts++;
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Không thể kết nối đến Gemini API');
  }

  // 1. Auto Fill 3 fields
  public static async autoFillWord(
    input: { hanzi?: string; pinyin?: string; vietnamese?: string },
    apiKey?: string,
    model?: string
  ): Promise<GeminiAutoFillResult> {
    const envKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';

    const rawInput = input.hanzi || input.pinyin || input.vietnamese || '';
    const norm = normalizeText(rawInput);

    if (OFFLINE_FALLBACK_DICT[norm]) {
      const fallback = OFFLINE_FALLBACK_DICT[norm];
      return {
        hanzi: fallback.hanzi || input.hanzi || '',
        pinyin: fallback.pinyin || input.pinyin || '',
        vietnamese: fallback.vietnamese || input.vietnamese || '',
        hanViet: fallback.hanViet || '',
        exampleSentence: fallback.exampleSentence || '',
        examplePinyin: fallback.examplePinyin || '',
        exampleVietnamese: fallback.exampleVietnamese || '',
        radicals: fallback.radicals || '',
        mnemonic: fallback.mnemonic || '',
        hskLevel: fallback.hskLevel || 1
      };
    }

    const prompt = `Bạn là chuyên gia ngôn ngữ tiếng Trung và giảng dạy HSK hàng đầu.
Nhiệm vụ: Điền và phân tích chi tiết từ vựng tiếng Trung dựa trên dữ liệu đầu vào:
Input: "${rawInput}"

Yêu cầu BẮT BUỘC:
- "radicals": Liệt kê rõ các bộ thủ cấu thành chữ kèm tên bộ thủ tiếng Việt (ví dụ: "亻 (nhân đứng) + 尔 (nhĩ)" hoặc "氵 (thủy) + 口 (khẩu)").
- "mnemonic": Viết mẹo nhớ cách nhìn / chiết tự hình tượng sinh động, dễ thuộc lòng ngay lập tức (ví dụ: "Người (亻) đối diện với mình (尔) chính là Bạn (你)." hoặc "Dùng miệng (口) uống nước (氵) thanh mát.").
- "hanViet": Âm Hán Việt chuẩn xác.
- "exampleSentence": 1 câu ví dụ giao tiếp tự nhiên ngắn gọn chứa từ này.
- "examplePinyin": Pinyin có dấu thanh của câu ví dụ.
- "exampleVietnamese": Dịch nghĩa câu ví dụ sang tiếng Việt.

Trả về duy nhất chuỗi JSON chuẩn:
{
  "hanzi": "Chữ Hán giản thể chuẩn",
  "pinyin": "Pinyin có dấu thanh điệu",
  "vietnamese": "Nghĩa tiếng Việt ngắn gọn",
  "hanViet": "Âm Hán Việt",
  "exampleSentence": "Câu ví dụ ngắn",
  "examplePinyin": "Pinyin câu ví dụ",
  "exampleVietnamese": "Dịch câu ví dụ",
  "radicals": "Bộ thủ chi tiết",
  "mnemonic": "Mẹo nhớ mặt chữ & chiết tự dễ thuộc",
  "hskLevel": 1
}`;

    const raw = await GeminiService.callAiEngineStream(envKey, envModel, prompt, true);
    return GeminiService.safeExtractAndParseJson(raw);
  }

  // 2. Batch parse words
  public static async batchParseWords(
    rawText: string,
    apiKey?: string,
    model?: string
  ): Promise<Partial<Word>[]> {
    const envKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';

    const prompt = `Bạn là chuyên gia giảng dạy HSK. Trích xuất và phân tích đầy đủ từ vựng tiếng Trung từ văn bản sau:
"""
${rawText}
"""

Với MỖI từ vựng, BẮT BUỘC cung cấp:
- "radicals": Liệt kê các bộ thủ cấu thành kèm giải nghĩa (ví dụ: "女 (nữ) + 子 (tử)").
- "mnemonic": Mẹo nhớ mặt chữ / chiết tự hình tượng dễ thuộc lòng.
- "hanViet": Âm Hán Việt.
- "exampleSentence", "examplePinyin", "exampleVietnamese": Câu ví dụ ngắn gọn, pinyin và dịch nghĩa.

Trả về mảng JSON chuẩn:
[
  {
    "hanzi": "Chữ Hán",
    "pinyin": "Pinyin có dấu thanh",
    "vietnamese": "Nghĩa tiếng Việt",
    "hanViet": "Âm Hán Việt",
    "exampleSentence": "Câu ví dụ",
    "examplePinyin": "Pinyin ví dụ",
    "exampleVietnamese": "Dịch ví dụ",
    "radicals": "Bộ thủ cấu thành",
    "mnemonic": "Mẹo nhớ mặt chữ sinh động",
    "hskLevel": 1
  }
]`;

    const raw = await GeminiService.callAiEngineStream(envKey, envModel, prompt, true);
    const parsed = GeminiService.safeExtractAndParseJson(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu trả về từ AI không đúng định dạng mảng.');
    }
    return parsed.map((item, index) => ({
      id: `bulk-${Date.now()}-${index}`,
      hanzi: item.hanzi || '',
      pinyin: item.pinyin || '',
      vietnamese: item.vietnamese || '',
      hanViet: item.hanViet || '',
      exampleSentence: item.exampleSentence || '',
      examplePinyin: item.examplePinyin || '',
      exampleVietnamese: item.exampleVietnamese || '',
      radicals: item.radicals || '',
      mnemonic: item.mnemonic || '',
      hskLevel: item.hskLevel || 1,
      box: 1,
      isStarred: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      createdAt: Date.now()
    }));
  }

  // 3. Real-time Streaming Context Reading Passage Generator
  public static async generateContextStoryStream(
    userWords: Word[],
    topic: string = 'Chào hỏi và làm quen',
    level: string = 'Sơ cấp HSK 1-2',
    format: 'dialogue' | 'article' = 'dialogue',
    lengthOption: StoryLengthOption = { type: 'medium' },
    apiKey?: string,
    model?: string,
    onStreamChunk?: (accumulatedText: string, latestChunk: string) => void
  ): Promise<StoryPassage> {
    const envKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';

    const priorityWords = userWords
      .filter(w => w.isStarred || w.box <= 2 || !w.lastReviewed)
      .map(w => w.hanzi)
      .slice(0, 50)
      .join(', ');

    const allVocabularyList = userWords
      .map(w => `${w.hanzi} (${w.vietnamese})`)
      .join(', ');

    let lengthDesc = 'khoảng 50 - 75 chữ (5 - 7 câu)';
    if (lengthOption.type === 'short') {
      lengthDesc = 'ngắn gọn, khoảng 30 - 45 chữ (3 - 4 câu)';
    } else if (lengthOption.type === 'long') {
      lengthDesc = 'dài phong phú, khoảng 85 - 130 chữ (8 - 12 câu)';
    } else if (lengthOption.type === 'custom' && lengthOption.customWords) {
      lengthDesc = `khoảng ${lengthOption.customWords} chữ`;
    }

    const isDialogue = format === 'dialogue';
    const formatInstruction = isDialogue
      ? `BẮT BUỘC THỂ LOẠI: HỘI THOẠI (Dialogue). Phải là đoạn đối thoại qua lại giữa 2 người (ví dụ: A và B, hoặc 大卫 và 李月). MỖI CÂU BẮT BUỘC PHẢI CÓ TÊN NGƯỜI NÓI (speaker) ở đầu câu.`
      : `BẮT BUỘC THỂ LOẠI: VĂN XUÔI / BÀI BÁO (Article). Là bài văn liền mạch, KHÔNG có tên người đối thoại.`;

    const prompt = `Bạn là tác giả sách giáo khoa tiếng Trung HSK giàu kinh nghiệm.
Nhiệm vụ: Hãy tạo một ${isDialogue ? 'đoạn HỘI THOẠI (Dialogue)' : 'đoạn VĂN XUÔI (Article)'} tiếng Trung trình độ ${level}.

${formatInstruction}
- Chủ đề: "${topic}".
- Độ dài mong muốn: ${lengthDesc}.
- Toàn bộ kho từ vựng học viên đã học: [${allVocabularyList}].
${priorityWords ? `- Ưu tiên lồng ghép các từ học viên đang cần ôn: [${priorityWords}].` : ''}
- Kèm thêm 2-4 TỪ MỚI tự nhiên mở rộng vốn từ.

Bắt buộc trả về duy nhất chuỗi JSON hợp lệ theo đúng schema sau (không thêm bất kỳ văn bản nào ngoài JSON):
{
  "title": "Tiêu đề tiếng Trung",
  "titlePinyin": "Pinyin tiêu đề",
  "titleVietnamese": "Dịch tiêu đề",
  "chineseText": "Toàn bộ bài tiếng Trung",
  "pinyinText": "Pinyin toàn bài",
  "vietnameseTranslation": "Dịch toàn bài",
  "format": "${format}",
  "sentences": [
    {
      "chinese": "Câu tiếng Trung ${isDialogue ? '(có tên người nói ở đầu)' : ''}",
      "pinyin": "Pinyin câu",
      "vietnamese": "Dịch câu tiếng Việt",
      "speaker": "${isDialogue ? 'Tên nhân vật nói (ví dụ 大卫 hoặc 李月)' : ''}",
      "tokens": [
        { "hanzi": "chữ/từ", "pinyin": "pinyin", "vietnamese": "nghĩa ngắn" }
      ]
    }
  ],
  "newWordsDetected": [
    {
      "hanzi": "từ mới",
      "pinyin": "pinyin có dấu",
      "vietnamese": "nghĩa tiếng Việt ngắn",
      "hanViet": "Âm Hán Việt",
      "radicals": "Bộ thủ cấu thành",
      "mnemonic": "Mẹo nhớ mặt chữ ngắn gọn sinh động",
      "exampleSentence": "Câu ví dụ ngắn chứa từ này",
      "examplePinyin": "Pinyin câu ví dụ",
      "exampleVietnamese": "Dịch câu ví dụ"
    }
  ]
}`;

    const raw = await GeminiService.callAiEngineStream(
      envKey,
      envModel,
      prompt,
      true,
      onStreamChunk
    );

    const parsed = GeminiService.safeExtractAndParseJson(raw);

    const knownSet = new Set(userWords.map(w => w.hanzi));
    const processedNewWords: DetectedNewWord[] = (parsed.newWordsDetected || []).map((nw: DetectedNewWord) => ({
      ...nw,
      isAlreadyAdded: knownSet.has(nw.hanzi)
    }));

    return {
      id: `story-${Date.now()}`,
      title: parsed.title || 'Đoạn văn luyện đọc',
      titlePinyin: parsed.titlePinyin || '',
      titleVietnamese: parsed.titleVietnamese || '',
      chineseText: parsed.chineseText || '',
      pinyinText: parsed.pinyinText || '',
      vietnameseTranslation: parsed.vietnameseTranslation || '',
      format: format,
      sentences: parsed.sentences || [],
      newWordsDetected: processedNewWords,
      topic,
      createdAt: Date.now()
    };
  }

  // Backward compatible wrapper
  public static async generateContextStory(
    userWords: Word[],
    topic: string = 'Chào hỏi và làm quen',
    level: string = 'Sơ cấp HSK 1-2',
    format: 'dialogue' | 'article' = 'dialogue',
    apiKey?: string,
    model?: string
  ): Promise<StoryPassage> {
    return GeminiService.generateContextStoryStream(
      userWords,
      topic,
      level,
      format,
      { type: 'medium' },
      apiKey,
      model
    );
  }

  // 4. Test API Key
  public static async testGeminiApiKey(apiKey?: string, model?: string): Promise<boolean> {
    try {
      const envKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
      const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
      const res = await GeminiService.callAiEngineStream(envKey, envModel, '{"status": "OK"}', true);
      return res.includes('OK');
    } catch (err) {
      console.error('Test API Key error:', err);
      return false;
    }
  }
}
