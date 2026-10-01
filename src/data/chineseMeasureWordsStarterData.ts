import { ChineseMeasureWord } from '../types';

export const CHINESE_MEASURE_WORDS_STARTER_DATA: ChineseMeasureWord[] = [
  {
    id: 'mw-zhi-animal',
    measureWord: '只',
    pinyin: 'zhī',
    hanViet: 'Chích',
    vietnameseMeaning: 'con (động vật nhỏ/chim), chiếc lẻ (trong một đôi)',
    category: 'animal',
    explanation:
      'Lượng từ phổ biến nhất cho hầu hết động vật cỡ nhỏ hoặc vừa (mèo, gà, chim, chuột, thỏ) và một chiếc đơn lẻ trong một bộ đôi (một chiếc giày, một chiếc găng tay, một bàn tay).',
    collocations: [
      { phrase: '一只猫', pinyin: 'yì zhī māo', vietnamese: 'một con mèo' },
      { phrase: '两只鸟', pinyin: 'liǎng zhī niǎo', vietnamese: 'hai con chim' },
      { phrase: '一只鞋', pinyin: 'yì zhī xié', vietnamese: 'một chiếc giày (lẻ)' },
      { phrase: '一只手', pinyin: 'yì zhī shǒu', vietnamese: 'một bàn tay' }
    ],
    commonNouns: [
      {
        hanzi: '猫',
        pinyin: 'māo',
        vietnamese: 'con mèo',
        emoji: '🐱',
        exampleSentence: '我家有一只白色的猫。',
        examplePinyin: 'Wǒ jiā yǒu yì zhī báisè de māo.',
        exampleTranslation: 'Nhà tôi có một con mèo màu trắng.'
      },
      {
        hanzi: '鸡',
        pinyin: 'jī',
        vietnamese: 'con gà',
        emoji: '🐔',
        exampleSentence: '院子里跑着一只小鸡。',
        examplePinyin: 'Yuànzi lǐ pǎo zhe yì zhī xiǎojī.',
        exampleTranslation: 'Trong sân có một chú gà con đang chạy.'
      },
      {
        hanzi: '鸟',
        pinyin: 'niǎo',
        vietnamese: 'con chim',
        emoji: '🐦',
        exampleSentence: '树上停着两只鸟。',
        examplePinyin: 'Shù shàng tíng zhe liǎng zhī niǎo.',
        exampleTranslation: 'Trên cây có hai con chim đang đậu.'
      },
      {
        hanzi: '手',
        pinyin: 'shǒu',
        vietnamese: 'bàn tay (chiếc lẻ)',
        emoji: '✋',
        exampleSentence: '他用一只手提着行李。',
        examplePinyin: 'Tā yòng yì zhī shǒu tí zhe xíngli.',
        exampleTranslation: 'Anh ấy dùng một tay xách hành lý.'
      },
      {
        hanzi: '鞋',
        pinyin: 'xié',
        vietnamese: 'chiếc giày (lẻ)',
        emoji: '👟',
        exampleSentence: '我找不到另一只鞋了。',
        examplePinyin: 'Wǒ zhǎo bú dào lìng yì zhī xié le.',
        exampleTranslation: 'Tôi không tìm thấy chiếc giày còn lại rồi.'
      }
    ],
    notesOrTips:
      'Lưu ý: Chỉ dùng "只" cho một chiếc đơn lẻ trong đôi (一只鞋). Nếu là cả một đôi/cặp thì phải dùng "双" (一双鞋). Đối với trâu, bò, voi dùng "头", ngựa dùng "匹", cá và chó thường dùng "条".',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000001,
    tags: ['động vật', 'con', 'chiếc', 'zhī', 'chim', 'mèo'],
    practiceQuestions: [
      {
        id: 'pq-mw-zhi-1',
        question: 'Điền lượng từ chuẩn cho câu: "树上有一____小鸟在唱歌。"',
        noun: '小鸟',
        options: ['只', '头', '张', '本'],
        correctAnswer: '只',
        explanation: 'Chim chóc và các loài động vật nhỏ dùng lượng từ "只" (zhī).'
      }
    ]
  },
  {
    id: 'mw-ba-handle',
    measureWord: '把',
    pinyin: 'bǎ',
    hanViet: 'Bả',
    vietnameseMeaning: 'chiếc, cái (đồ vật có cán/tay cầm), vốc, nắm',
    category: 'tool_handle',
    explanation:
      'Dùng cho các đồ vật có cán, tay cầm nắm được (ô/dù, dao, kéo, quạt, chìa khoá, ghế có lưng tựa) hoặc hành động nắm/vốc một nắm (nắm cát, nắm gạo, một chút sức lực).',
    collocations: [
      { phrase: '一把雨伞', pinyin: 'yì bǎ yǔsǎn', vietnamese: 'một chiếc ô / dù' },
      { phrase: '一把椅子', pinyin: 'yì bǎ yǐzi', vietnamese: 'một chiếc ghế' },
      { phrase: '一把刀', pinyin: 'yì bǎ dāo', vietnamese: 'một con dao' },
      { phrase: '一把钥匙', pinyin: 'yì bǎ yàoshi', vietnamese: 'một chiếc chìa khoá' }
    ],
    commonNouns: [
      {
        hanzi: '雨伞',
        pinyin: 'yǔsǎn',
        vietnamese: 'chiếc ô / cái dù',
        emoji: '☂️',
        exampleSentence: '出门记得带一把雨伞。',
        examplePinyin: 'Chūmén jìde dài yì bǎ yǔsǎn.',
        exampleTranslation: 'Ra ngoài nhớ mang theo một chiếc ô.'
      },
      {
        hanzi: '椅子',
        pinyin: 'yǐzi',
        vietnamese: 'cái ghế',
        emoji: '🪑',
        exampleSentence: '房间里只有一把椅子。',
        examplePinyin: 'Fángjiān lǐ zhǐyǒu yì bǎ yǐzi.',
        exampleTranslation: 'Trong phòng chỉ có một chiếc ghế.'
      },
      {
        hanzi: '刀',
        pinyin: 'dāo',
        vietnamese: 'con dao',
        emoji: '🔪',
        exampleSentence: '请给我一把水果刀。',
        examplePinyin: 'Qǐng gěi wǒ yì bǎ shuǐguǒ dāo.',
        exampleTranslation: 'Làm ơn cho tôi một con dao gọt hoa quả.'
      },
      {
        hanzi: '剪刀',
        pinyin: 'jiǎndāo',
        vietnamese: 'cây kéo',
        emoji: '✂️',
        exampleSentence: '桌上放着一把剪刀。',
        examplePinyin: 'Zhuō shàng fàng zhe yì bǎ jiǎndāo.',
        exampleTranslation: 'Trên bàn có để một chiếc kéo.'
      },
      {
        hanzi: '钥匙',
        pinyin: 'yàoshi',
        vietnamese: 'chìa khoá',
        emoji: '🔑',
        exampleSentence: '我这里有一把大门的钥匙。',
        examplePinyin: 'Wǒ zhèlǐ yǒu yì bǎ dàmén de yàoshi.',
        exampleTranslation: 'Chỗ tôi có một chiếc chìa khoá cổng lớn.'
      }
    ],
    notesOrTips:
      'Ghi nhớ mẹo: Cái gì có "cán" hoặc "tay cầm" để dùng tay nắm vào (như ghế, dao, ô, kéo, chìa khoá, lược, quạt) thì hầu hết đều dùng lượng từ "把". Lưu ý cái bàn phẳng không có cán cầm nên dùng "张", không dùng "把"!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000002,
    tags: ['có cán', 'tay cầm', 'ô', 'ghế', 'dao', 'kéo', 'chìa khoá', 'bǎ'],
    practiceQuestions: [
      {
        id: 'pq-mw-ba-1',
        question: 'Chọn lượng từ thích hợp: "今天下雨，我借了他一____雨伞。"',
        noun: '雨伞',
        options: ['把', '件', '条', '张'],
        correctAnswer: '把',
        explanation: 'Chiếc ô có tay cầm nắm nên lượng từ chuẩn là "把" (bǎ).'
      }
    ]
  },
  {
    id: 'mw-zhang-flat',
    measureWord: '张',
    pinyin: 'zhāng',
    hanViet: 'Trương',
    vietnameseMeaning: 'tờ, tấm, bức, chiếc (mặt phẳng, mỏng, rộng)',
    category: 'shape_flat',
    explanation:
      'Dùng cho các sự vật có bề mặt phẳng, mỏng, rộng như giấy, bàn, giường, vé tàu xe, ảnh chụp, da, bản đồ hoặc bộ phận có thể mở rộng (miệng, mặt).',
    collocations: [
      { phrase: '一张纸', pinyin: 'yì zhāng zhǐ', vietnamese: 'một tờ giấy' },
      { phrase: '一张桌子', pinyin: 'yì zhāng zhuōzi', vietnamese: 'một chiếc bàn' },
      { phrase: '一张床', pinyin: 'yì zhāng chuáng', vietnamese: 'một chiếc giường' },
      { phrase: '一张照片', pinyin: 'yì zhāng zhàopiàn', vietnamese: 'một bức ảnh' },
      { phrase: '一张票', pinyin: 'yì zhāng piào', vietnamese: 'một chiếc vé' }
    ],
    commonNouns: [
      {
        hanzi: '纸',
        pinyin: 'zhǐ',
        vietnamese: 'tờ giấy',
        emoji: '📄',
        exampleSentence: '请给我一张白纸。',
        examplePinyin: 'Qǐng gěi wǒ yì zhāng bái zhǐ.',
        exampleTranslation: 'Làm ơn cho tôi một tờ giấy trắng.'
      },
      {
        hanzi: '桌子',
        pinyin: 'zhuōzi',
        vietnamese: 'cái bàn',
        emoji: '🪵',
        exampleSentence: '客厅里放着一张大桌子。',
        examplePinyin: 'Kètīng lǐ fàng zhe yì zhāng dà zhuōzi.',
        exampleTranslation: 'Phòng khách có kê một chiếc bàn lớn.'
      },
      {
        hanzi: '床',
        pinyin: 'chuáng',
        vietnamese: 'chiếc giường',
        emoji: '🛏️',
        exampleSentence: '房间里有一张舒服的床。',
        examplePinyin: 'Fángjiān lǐ yǒu yì zhāng shūfu de chuáng.',
        exampleTranslation: 'Trong phòng có một chiếc giường rất êm ái.'
      },
      {
        hanzi: '照片',
        pinyin: 'zhàopiàn',
        vietnamese: 'bức ảnh',
        emoji: '📷',
        exampleSentence: '这是我们的一张全家福照片。',
        examplePinyin: 'Zhè shì wǒmen de yì zhāng quánjiāfú zhàopiàn.',
        exampleTranslation: 'Đây là một bức ảnh gia đình của chúng tôi.'
      },
      {
        hanzi: '电影票',
        pinyin: 'diànyǐng piào',
        vietnamese: 'vé xem phim',
        emoji: '🎟️',
        exampleSentence: '我买了两张今晚的电影票。',
        examplePinyin: 'Wǒ mǎi le liǎng zhāng jīnwǎn de diànyǐng piào.',
        exampleTranslation: 'Tôi đã mua hai chiếc vé xem phim tối nay.'
      }
    ],
    notesOrTips:
      'Phân biệt: Bàn là mặt phẳng rộng nên dùng "一张桌子", nhưng ghế có cán tựa tay nên dùng "一把椅子". Đừng nhầm lẫn giữa hai món đồ nội thất này nhé!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000003,
    tags: ['mặt phẳng', 'giấy', 'bàn', 'giường', 'vé', 'ảnh', 'zhāng'],
    practiceQuestions: [
      {
        id: 'pq-mw-zhang-1',
        question: 'Chọn lượng từ thích hợp: "客厅里有一____很大的木桌子。"',
        noun: '桌子',
        options: ['张', '把', '条', '件'],
        correctAnswer: '张',
        explanation: 'Bàn có bề mặt phẳng rộng nên dùng lượng từ "张" (zhāng).'
      }
    ]
  },
  {
    id: 'mw-tiao-long',
    measureWord: '条',
    pinyin: 'tiáo',
    hanViet: 'Điều',
    vietnameseMeaning: 'con (cá, chó, rắn), con (đường, sông), chiếc (quần, váy, cà vạt)',
    category: 'shape_long',
    explanation:
      'Dùng cho các sự vật có hình dáng thon dài, uốn lượn, mềm mại (sông, đường sá, cá, rắn, chó) và trang phục nửa dưới cơ thể (quần, váy, khăn quàng, cà vạt), hoặc tin nhắn, điều luật.',
    collocations: [
      { phrase: '一条鱼', pinyin: 'yì tiáo yú', vietnamese: 'một con cá' },
      { phrase: '一条狗', pinyin: 'yì tiáo gǒu', vietnamese: 'một con chó' },
      { phrase: '一条路', pinyin: 'yì tiáo lù', vietnamese: 'một con đường' },
      { phrase: '一条裤子', pinyin: 'yì tiáo kùzi', vietnamese: 'một chiếc quần' },
      { phrase: '一条短信', pinyin: 'yì tiáo duǎnxìn', vietnamese: 'một tin nhắn' }
    ],
    commonNouns: [
      {
        hanzi: '鱼',
        pinyin: 'yú',
        vietnamese: 'con cá',
        emoji: '🐟',
        exampleSentence: '河里游着几条小鱼。',
        examplePinyin: 'Hé lǐ yóu zhe jǐ tiáo xiǎo yú.',
        exampleTranslation: 'Dưới sông có vài con cá nhỏ đang bơi.'
      },
      {
        hanzi: '路',
        pinyin: 'lù',
        vietnamese: 'con đường',
        emoji: '🛣️',
        exampleSentence: '走这条路去学校比较近。',
        examplePinyin: 'Zǒu zhè tiáo lù qù xuéxiào bǐjiào jìn.',
        exampleTranslation: 'Đi con đường này đến trường sẽ gần hơn.'
      },
      {
        hanzi: '裤子',
        pinyin: 'kùzi',
        vietnamese: 'cái quần',
        emoji: '👖',
        exampleSentence: '他新买了一条牛仔裤。',
        examplePinyin: 'Tā xīn mǎi le yì tiáo niúzǎikù.',
        exampleTranslation: 'Anh ấy mới mua một chiếc quần bò.'
      },
      {
        hanzi: '狗',
        pinyin: 'gǒu',
        vietnamese: 'con chó',
        emoji: '🐕',
        exampleSentence: '邻居家养了一条可爱的小狗。',
        examplePinyin: 'Línjū jiā yǎng le yì tiáo kě\'ài de xiǎo gǒu.',
        exampleTranslation: 'Nhà hàng xóm nuôi một chú chó nhỏ rất đáng yêu.'
      },
      {
        hanzi: '河',
        pinyin: 'hé',
        vietnamese: 'dòng sông',
        emoji: '🌊',
        exampleSentence: '城市中间有一条清澈的河流。',
        examplePinyin: 'Chéngshì zhōngjiān yǒu yì tiáo qīngchè de héliú.',
        exampleTranslation: 'Giữa thành phố có một dòng sông nước trong veo.'
      }
    ],
    notesOrTips:
      'Quy tắc ghi nhớ: Áo mặc thân trên dùng "件" (一件衣服), quần mặc thân dưới dài thon dùng "条" (一条裤子). Chó có thể dùng cả "一只狗" hoặc "一条狗" (người miền Nam Trung Quốc rất hay dùng 一条狗).',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000004,
    tags: ['dài', 'uốn lượn', 'cá', 'chó', 'đường', 'quần', 'sông', 'tiáo'],
    practiceQuestions: [
      {
        id: 'pq-mw-tiao-1',
        question: 'Chọn lượng từ đúng: "小李今天穿了漂亮的黑____裙子。"',
        noun: '裙子',
        options: ['条', '件', '本', '双'],
        correctAnswer: '条',
        explanation: 'Quần hoặc váy là trang phục thân dưới dài nên dùng lượng từ "条" (tiáo).'
      }
    ]
  },
  {
    id: 'mw-ben-book',
    measureWord: '本',
    pinyin: 'běn',
    hanViet: 'Bản',
    vietnameseMeaning: 'cuốn, quyển, tập',
    category: 'book_paper',
    explanation:
      'Dùng cho các tài liệu in ấn có đóng gáy, đóng tập (sách, từ điển, tạp chí, sổ tay, hộ chiếu, album).',
    collocations: [
      { phrase: '一本书', pinyin: 'yì běn shū', vietnamese: 'một cuốn sách' },
      { phrase: '一本词典', pinyin: 'yì běn cídiǎn', vietnamese: 'một quyển từ điển' },
      { phrase: '一本杂志', pinyin: 'yì běn zázhì', vietnamese: 'một cuốn tạp chí' },
      { phrase: '一本护照', pinyin: 'yì běn hùzhào', vietnamese: 'một cuốn hộ chiếu' }
    ],
    commonNouns: [
      {
        hanzi: '书',
        pinyin: 'shū',
        vietnamese: 'cuốn sách',
        emoji: '📚',
        exampleSentence: '我正在读一本很有意思的书。',
        examplePinyin: 'Wǒ zhèngzài dú yì běn hěn yǒu yìsi de shū.',
        exampleTranslation: 'Tôi đang đọc một cuốn sách rất hay.'
      },
      {
        hanzi: '词典',
        pinyin: 'cídiǎn',
        vietnamese: 'quyển từ điển',
        emoji: '📕',
        exampleSentence: '桌上放着一本汉越词典。',
        examplePinyin: 'Zhuō shàng fàng zhe yì běn Hàn-Yuè cídiǎn.',
        exampleTranslation: 'Trên bàn có để một quyển từ điển Hán - Việt.'
      },
      {
        hanzi: '笔记本',
        pinyin: 'bǐjìběn',
        vietnamese: 'cuốn sổ tay / vở ghi',
        emoji: '📓',
        exampleSentence: '他买了一本新的笔记本记生词。',
        examplePinyin: 'Tā mǎi le yì běn xīn de bǐjìběn jì shēngcí.',
        exampleTranslation: 'Anh ấy mua một cuốn sổ tay mới để ghi từ mới.'
      }
    ],
    notesOrTips:
      'Cần phân biệt: "一本词典" (một cuốn từ điển), nhưng nếu chỉ là một tờ giấy đơn lẻ thì dùng "一张纸".',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000005,
    tags: ['sách', 'từ điển', 'quyển', 'cuốn', 'běn', 'vở'],
    practiceQuestions: [
      {
        id: 'pq-mw-ben-1',
        question: 'Chọn lượng từ thích hợp: "图书馆里借来了两____中文语法书。"',
        noun: '书',
        options: ['本', '张', '只', '座'],
        correctAnswer: '本',
        explanation: 'Sách vở đóng tập luôn dùng lượng từ "本" (běn).'
      }
    ]
  },
  {
    id: 'mw-liang-vehicle',
    measureWord: '辆',
    pinyin: 'liàng',
    hanViet: 'Lượng',
    vietnameseMeaning: 'chiếc, cái (xe cộ đường bộ có bánh)',
    category: 'vehicle',
    explanation:
      'Dùng cho các phương tiện giao thông trên cạn có bánh xe (xe ô tô, xe đạp, xe máy, xe buýt, xe taxi). Chú ý không dùng cho tàu hoả (dùng 列), máy bay (dùng 架), tàu thuyền (dùng 艘).',
    collocations: [
      { phrase: '一辆车', pinyin: 'yí liàng chē', vietnamese: 'một chiếc xe' },
      { phrase: '一辆自行车', pinyin: 'yí liàng zìxíngchē', vietnamese: 'một chiếc xe đạp' },
      { phrase: '一辆汽车', pinyin: 'yí liàng qìchē', vietnamese: 'một chiếc ô tô' }
    ],
    commonNouns: [
      {
        hanzi: '汽车',
        pinyin: 'qìchē',
        vietnamese: 'xe ô tô',
        emoji: '🚗',
        exampleSentence: '门前停着一辆黑色汽车。',
        examplePinyin: 'Mén qián tíng zhe yí liàng hēisè qìchē.',
        exampleTranslation: 'Trước cửa đỗ một chiếc xe ô tô màu đen.'
      },
      {
        hanzi: '自行车',
        pinyin: 'zìxíngchē',
        vietnamese: 'xe đạp',
        emoji: '🚲',
        exampleSentence: '我每天骑一辆自行车去上班。',
        examplePinyin: 'Wǒ měitiān qí yí liàng zìxíngchē qù shàngbān.',
        exampleTranslation: 'Mỗi ngày tôi đạp một chiếc xe đạp đi làm.'
      }
    ],
    notesOrTips:
      'Mẹo ghi nhớ: Trong chữ Hán "辆", bên trái có bộ Xa "车" (nghĩa là xe cộ). Do đó cứ là xe có bánh chạy trên đường bộ thì dùng "辆"!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000006,
    tags: ['xe', 'ô tô', 'xe đạp', 'xe máy', 'liàng'],
    practiceQuestions: [
      {
        id: 'pq-mw-liang-1',
        question: 'Chọn lượng từ đúng: "爸爸刚买了一____新的电动汽车。"',
        noun: '汽车',
        options: ['辆', '台', '把', '艘'],
        correctAnswer: '辆',
        explanation: 'Xe ô tô chạy đường bộ dùng lượng từ "辆" (liàng).'
      }
    ]
  },
  {
    id: 'mw-jian-clothing-matter',
    measureWord: '件',
    pinyin: 'jiàn',
    hanViet: 'Kiện',
    vietnameseMeaning: 'chiếc/cái (áo, trang phục thân trên), việc/sự việc, món quà',
    category: 'clothing',
    explanation:
      'Dùng cho quần áo mặc thân trên (áo sơ mi, áo khoác, áo len), sự việc cần giải quyết (việc, sự tình), món quà tặng hoặc kiện hành lý.',
    collocations: [
      { phrase: '一件衣服', pinyin: 'yí jiàn yīfu', vietnamese: 'một bộ quần áo / chiếc áo' },
      { phrase: '一件衬衫', pinyin: 'yí jiàn chènshān', vietnamese: 'một chiếc áo sơ mi' },
      { phrase: '一件事', pinyin: 'yí jiàn shì', vietnamese: 'một sự việc' },
      { phrase: '一件礼物', pinyin: 'yí jiàn lǐwù', vietnamese: 'một món quà' }
    ],
    commonNouns: [
      {
        hanzi: '衣服',
        pinyin: 'yīfu',
        vietnamese: 'quần áo / chiếc áo',
        emoji: '👕',
        exampleSentence: '我想试一下这件衣服。',
        examplePinyin: 'Wǒ xiǎng shì yíxià zhè jiàn yīfu.',
        exampleTranslation: 'Tôi muốn thử một chút chiếc áo này.'
      },
      {
        hanzi: '事情',
        pinyin: 'shìqing',
        vietnamese: 'sự việc',
        emoji: '📋',
        exampleSentence: '有一件事情我想跟你商量。',
        examplePinyin: 'Yǒu yí jiàn shìqing wǒ xiǎng gēn nǐ shāngliang.',
        exampleTranslation: 'Có một sự việc tôi muốn bàn bạc cùng bạn.'
      },
      {
        hanzi: '礼物',
        pinyin: 'lǐwù',
        vietnamese: 'món quà',
        emoji: '🎁',
        exampleSentence: '这是朋友送给我的一件生日礼物。',
        examplePinyin: 'Zhè shì péngyou sòng gěi wǒ de yí jiàn shēngrì lǐwù.',
        exampleTranslation: 'Đây là một món quà sinh nhật bạn tôi tặng.'
      }
    ],
    notesOrTips:
      'Phân biệt kinh điển: Áo thân trên dùng "件" (一件衣服), quần thân dưới dùng "条" (一条裤子), cả bộ hoàn chỉnh dùng "套" (一套西装).',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000007,
    tags: ['áo', 'trang phục', 'sự việc', 'quà tặng', 'jiàn'],
    practiceQuestions: [
      {
        id: 'pq-mw-jian-1',
        question: 'Điền từ thích hợp: "今天在公司发生了一____奇怪的事情。"',
        noun: '事情',
        options: ['件', '把', '条', '本'],
        correctAnswer: '件',
        explanation: 'Sự việc trong tiếng Trung dùng lượng từ "件" (yí jiàn shìqing).'
      }
    ]
  },
  {
    id: 'mw-shuang-pair',
    measureWord: '双',
    pinyin: 'shuāng',
    hanViet: 'Song',
    vietnameseMeaning: 'đôi, cặp (vật đi liền thành cặp tự nhiên)',
    category: 'pair_group',
    explanation:
      'Dùng cho các đồ vật có hai chiếc hợp lại thành một đôi hoặc bộ phận cơ thể đối xứng có hai cái (giày, đũa, tất/vớ, mắt, tay).',
    collocations: [
      { phrase: '一双鞋', pinyin: 'yì shuāng xié', vietnamese: 'một đôi giày' },
      { phrase: '一双筷子', pinyin: 'yì shuāng kuàizi', vietnamese: 'một đôi đũa' },
      { phrase: '一双袜子', pinyin: 'yì shuāng wàzi', vietnamese: 'một đôi tất' },
      { phrase: '一双眼睛', pinyin: 'yì shuāng yǎnjing', vietnamese: 'một đôi mắt' }
    ],
    commonNouns: [
      {
        hanzi: '鞋',
        pinyin: 'xié',
        vietnamese: 'đôi giày',
        emoji: '👞',
        exampleSentence: '他买了一双皮鞋。',
        examplePinyin: 'Tā mǎi le yì shuāng píxié.',
        exampleTranslation: 'Anh ấy mua một đôi giày da.'
      },
      {
        hanzi: '筷子',
        pinyin: 'kuàizi',
        vietnamese: 'đôi đũa',
        emoji: '🥢',
        exampleSentence: '请给我一双干净的筷子。',
        examplePinyin: 'Qǐng gěi wǒ yì shuāng gānjìng de kuàizi.',
        exampleTranslation: 'Làm ơn cho tôi một đôi đũa sạch.'
      }
    ],
    notesOrTips:
      'Khác biệt giữa "双" và "对": "双" dùng cho những vật đi liền không thể tách rời để thực hiện công năng (đôi giày, đôi đũa, đôi tất). "对" dùng cho cặp đôi có yếu tố hòa hợp (đôi vợ chồng 一对夫妻, đôi hoa tai 一对耳环).',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000008,
    tags: ['đôi', 'cặp', 'giày', 'đũa', 'tất', 'shuāng'],
    practiceQuestions: [
      {
        id: 'pq-mw-shuang-1',
        question: 'Chọn lượng từ đúng: "吃饭的时候，中国人习惯用一____筷子。"',
        noun: '筷子',
        options: ['双', '只', '条', '张'],
        correctAnswer: '双',
        explanation: 'Đôi đũa gồm 2 chiếc kết hợp nên dùng lượng từ "双" (shuāng).'
      }
    ]
  },
  {
    id: 'mw-tai-machine',
    measureWord: '台',
    pinyin: 'tái',
    hanViet: 'Đài',
    vietnameseMeaning: 'chiếc, cái, cỗ (máy móc, thiết bị điện tử)',
    category: 'tool_handle',
    explanation:
      'Dùng cho các thiết bị máy móc, đồ gia dụng điện tử có khối động cơ hoặc màn hình (máy tính, tivi, máy giặt, tủ lạnh, máy in, điều hoà, máy quay phim).',
    collocations: [
      { phrase: '一台电脑', pinyin: 'yì tái diànnǎo', vietnamese: 'một chiếc máy tính' },
      { phrase: '一台电视', pinyin: 'yì tái diànshì', vietnamese: 'một chiếc tivi' },
      { phrase: '一台洗衣机', pinyin: 'yì tái xǐyījī', vietnamese: 'một chiếc máy giặt' },
      { phrase: '一台打印机', pinyin: 'yì tái dǎyìnjī', vietnamese: 'một chiếc máy in' }
    ],
    commonNouns: [
      {
        hanzi: '电脑',
        pinyin: 'diànnǎo',
        vietnamese: 'máy tính',
        emoji: '💻',
        exampleSentence: '我刚买了一台苹果笔记本电脑。',
        examplePinyin: 'Wǒ gāng mǎi le yì tái Píngguǒ bǐjìběn diànnǎo.',
        exampleTranslation: 'Tôi vừa mua một chiếc máy tính xách tay Apple.'
      },
      {
        hanzi: '电视',
        pinyin: 'diànshì',
        vietnamese: 'chiếc tivi',
        emoji: '📺',
        exampleSentence: '客厅有一台大屏幕电视。',
        examplePinyin: 'Kètīng yǒu yì tái dà píngmù diànshì.',
        exampleTranslation: 'Phòng khách có một chiếc tivi màn hình lớn.'
      }
    ],
    notesOrTips:
      'Mẹo ghi nhớ: Điện thoại di động (手机) có thể dùng "一部手机" hoặc "一台手机", nhưng máy vi tính và thiết bị văn phòng lớn thì 100% dùng "台".',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000009,
    tags: ['máy móc', 'máy tính', 'tivi', 'điện tử', 'tái'],
    practiceQuestions: [
      {
        id: 'pq-mw-tai-1',
        question: 'Chọn lượng từ phù hợp: "公司给每位新员工配了一____笔记本电脑。"',
        noun: '电脑',
        options: ['台', '本', '把', '个'],
        correctAnswer: '台',
        explanation: 'Máy tính là thiết bị điện tử nên dùng lượng từ "台" (tái).'
      }
    ]
  },
  {
    id: 'mw-zuo-building-mountain',
    measureWord: '座',
    pinyin: 'zuò',
    hanViet: 'Toạ',
    vietnameseMeaning: 'ngọn, toà, cây (công trình kiến trúc đồ sộ, núi, cầu)',
    category: 'building',
    explanation:
      'Dùng cho các công trình to lớn, đồ sộ, cố định không di chuyển được như ngọn núi, cây cầu, toà nhà chọc trời, thành phố, chùa tháp.',
    collocations: [
      { phrase: '一座山', pinyin: 'yí zuò shān', vietnamese: 'một ngọn núi' },
      { phrase: '一座桥', pinyin: 'yí zuò qiáo', vietnamese: 'một cây cầu' },
      { phrase: '一座大楼', pinyin: 'yí zuò dàlóu', vietnamese: 'một toà nhà lớn' },
      { phrase: '一座城市', pinyin: 'yí zuò chéngshì', vietnamese: 'một thành phố' }
    ],
    commonNouns: [
      {
        hanzi: '山',
        pinyin: 'shān',
        vietnamese: 'ngọn núi',
        emoji: '⛰️',
        exampleSentence: '远处有一座高高的雪山。',
        examplePinyin: 'Yuǎnchù yǒu yí zuò gāogāo de xuěshān.',
        exampleTranslation: 'Đằng xa có một ngọn núi tuyết cao sừng sững.'
      },
      {
        hanzi: '桥',
        pinyin: 'qiáo',
        vietnamese: 'cây cầu',
        emoji: '🌉',
        exampleSentence: '河上建了一座现代化的大桥。',
        examplePinyin: 'Hé shàng jiàn le yí zuò xiàndàihuà de dàqiáo.',
        exampleTranslation: 'Trên sông đã xây dựng một cây cầu lớn hiện đại.'
      },
      {
        hanzi: '大楼',
        pinyin: 'dàlóu',
        vietnamese: 'toà nhà',
        emoji: '🏢',
        exampleSentence: '市中心新建了一座八十层的大楼。',
        examplePinyin: 'Shì zhōngxīn xīn jiàn le yí zuò bāshí céng de dàlóu.',
        exampleTranslation: 'Trung tâm thành phố mới xây một toà nhà 80 tầng.'
      }
    ],
    notesOrTips:
      'Ghi nhớ: "座" (ngồi vững) bắt nguồn từ việc công trình đứng vững vàng, bất động, quy mô to lớn. Do đó ngọn núi, cây cầu, thành phố luôn dùng "座".',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000010,
    tags: ['núi', 'cầu', 'toà nhà', 'thành phố', 'công trình', 'zuò'],
    practiceQuestions: [
      {
        id: 'pq-mw-zuo-1',
        question: 'Chọn lượng từ đúng: "这条大河上有三____历史悠久的大桥。"',
        noun: '大桥',
        options: ['座', '条', '把', '只'],
        correctAnswer: '座',
        explanation: 'Cây cầu là công trình kiến trúc lớn cố định nên dùng lượng từ "座" (zuò).'
      }
    ]
  },
  {
    id: 'mw-ke-tree',
    measureWord: '棵',
    pinyin: 'kē',
    hanViet: 'Khỏa (cây)',
    vietnameseMeaning: 'cây (thực vật có thân, rễ lá)',
    category: 'plant',
    explanation:
      'Dùng riêng biệt cho cây cối, thực vật có rễ, thân, cành lá sinh trưởng như cây to, cây ăn quả, cây cỏ non, cây hoa hồng.',
    collocations: [
      { phrase: '一棵树', pinyin: 'yì kē shù', vietnamese: 'một cái cây' },
      { phrase: '一棵苹果树', pinyin: 'yì kē píngguǒ shù', vietnamese: 'một cây táo' },
      { phrase: '一棵草', pinyin: 'yì kē cǎo', vietnamese: 'một ngọn cỏ' }
    ],
    commonNouns: [
      {
        hanzi: '树',
        pinyin: 'shù',
        vietnamese: 'cây',
        emoji: '🌳',
        exampleSentence: '门前种着一棵大柳树。',
        examplePinyin: 'Mén qián zhòng zhe yì kē dà liǔshù.',
        exampleTranslation: 'Trước cửa trồng một cây liễu lớn.'
      },
      {
        hanzi: '白菜',
        pinyin: 'báicài',
        vietnamese: 'cây cải thảo',
        emoji: '🥬',
        exampleSentence: '妈妈买了两棵新鲜的白菜。',
        examplePinyin: 'Māma mǎi le liǎng kē xīnxian de báicài.',
        exampleTranslation: 'Mẹ mua hai cây cải thảo tươi.'
      }
    ],
    notesOrTips:
      'CỰC KỲ QUAN TRỌNG: Cần phân biệt giữa "棵" (có bộ Mộc 木 - dùng cho CÂY CỐI) và "颗" (có bộ Hiệt 页 - dùng cho HẠT TRÒN NHỎ như ngôi sao, trái tim, viên thuốc, viên kẹo)!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000011,
    tags: ['cây', 'thực vật', 'cây cối', 'rau', 'kē', 'cải thảo'],
    practiceQuestions: [
      {
        id: 'pq-mw-ke-1',
        question: 'Phân biệt "棵" và "颗": Điền vào "学校院子里有一____大树。"',
        noun: '树',
        options: ['棵', '颗', '支', '本'],
        correctAnswer: '棵',
        explanation: 'Cây cối thực vật có bộ Mộc nên phải dùng "棵" (kē).'
      }
    ]
  },
  {
    id: 'mw-ke-round',
    measureWord: '颗',
    pinyin: 'kē',
    hanViet: 'Khỏa (hạt tròn)',
    vietnameseMeaning: 'hạt, viên, quả, ngôi (vật thể hình tròn hoặc nhỏ bé)',
    category: 'shape_round',
    explanation:
      'Dùng cho các vật nhỏ bé có hình dạng tròn trịa, hạt, quả hoặc hình cầu như ngôi sao, trái tim, viên ngọc, viên đạn, chiếc răng, viên kẹo, quả nho.',
    collocations: [
      { phrase: '一颗心', pinyin: 'yì kē xīn', vietnamese: 'một trái tim' },
      { phrase: '一颗星星', pinyin: 'yì kē xīngxing', vietnamese: 'một ngôi sao' },
      { phrase: '一颗牙齿', pinyin: 'yì kē yáchǐ', vietnamese: 'một chiếc răng' },
      { phrase: '一颗糖', pinyin: 'yì kē táng', vietnamese: 'một viên kẹo' }
    ],
    commonNouns: [
      {
        hanzi: '心',
        pinyin: 'xīn',
        vietnamese: 'trái tim / tấm lòng',
        emoji: '❤️',
        exampleSentence: '他有一颗善良的心。',
        examplePinyin: 'Tā yǒu yì kē shànliáng de xīn.',
        exampleTranslation: 'Anh ấy có một trái tim lương thiện.'
      },
      {
        hanzi: '星星',
        pinyin: 'xīngxing',
        vietnamese: 'ngôi sao',
        emoji: '⭐',
        exampleSentence: '夜空中有一颗很亮的星星。',
        examplePinyin: 'Yèkōng zhōng yǒu yì kē hěn liàng de xīngxing.',
        exampleTranslation: 'Giữa bầu trời đêm có một ngôi sao rất sáng.'
      },
      {
        hanzi: '珍珠',
        pinyin: 'zhēnzhū',
        vietnamese: 'viên ngọc trai',
        emoji: '🦪',
        exampleSentence: '项链上镶嵌着一颗大珍珠。',
        examplePinyin: 'Xiàngliàn shàng xiāngqiàn zhe yì kē dà zhēnzhū.',
        exampleTranslation: 'Trên sợi dây chuyền có đính một viên ngọc trai lớn.'
      }
    ],
    notesOrTips:
      'Mẹo phân biệt: Chữ "颗" có bộ Quả 果 bên trái (nghĩa là hoa quả, hình tròn quả cầu), do đó các vật hạt nhỏ tròn đều dùng "颗". Trái tim "一颗心" cũng dùng "颗"!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000012,
    tags: ['hạt', 'tròn', 'ngôi sao', 'trái tim', 'răng', 'ngọc', 'kē'],
    practiceQuestions: [
      {
        id: 'pq-mw-ke-round-1',
        question: 'Chọn lượng từ đúng: "小女孩笑起来，露出了两____可爱的小门牙。"',
        noun: '牙齿',
        options: ['颗', '棵', '只', '条'],
        correctAnswer: '颗',
        explanation: 'Răng là vật thể nhỏ hình hạt nên dùng "颗" (kē).'
      }
    ]
  },
  {
    id: 'mw-kuai-chunk',
    measureWord: '块',
    pinyin: 'kuài',
    hanViet: 'Khối',
    vietnameseMeaning: 'miếng, tảng, khối, chiếc (đồng hồ), đồng (tiền tệ)',
    category: 'shape_round',
    explanation:
      'Dùng cho các sự vật có dạng khối, mảng, miếng dày (thịt, bánh mì, xà phòng, đá, đất, bảng đen, đồng hồ đeo tay) hoặc đơn vị tiền tệ khẩu ngữ (đồng nhân dân tệ).',
    collocations: [
      { phrase: '一块手表', pinyin: 'yí kuài shǒubiǎo', vietnamese: 'một chiếc đồng hồ đeo tay' },
      { phrase: '一块面包', pinyin: 'yí kuài miànbāo', vietnamese: 'một lát/ổ bánh mì' },
      { phrase: '一块肉', pinyin: 'yí kuài ròu', vietnamese: 'một miếng thịt' },
      { phrase: '一块钱', pinyin: 'yí kuài qián', vietnamese: 'một đồng tiền' }
    ],
    commonNouns: [
      {
        hanzi: '手表',
        pinyin: 'shǒubiǎo',
        vietnamese: 'đồng hồ đeo tay',
        emoji: '⌚',
        exampleSentence: '他戴着一块很名贵的手表。',
        examplePinyin: 'Tā dài zhe yí kuài hěn míngguì de shǒubiǎo.',
        exampleTranslation: 'Anh ấy đeo một chiếc đồng hồ rất đắt tiền.'
      },
      {
        hanzi: '面包',
        pinyin: 'miànbāo',
        vietnamese: 'miếng bánh mì',
        emoji: '🍞',
        exampleSentence: '早餐我只吃了一块面包。',
        examplePinyin: 'Zǎocān wǒ zhǐ chī le yí kuài miànbāo.',
        exampleTranslation: 'Bữa sáng tôi chỉ ăn một lát bánh mì.'
      },
      {
        hanzi: '黑板',
        pinyin: 'hēibǎn',
        vietnamese: 'tấm bảng đen',
        emoji: '⬛',
        exampleSentence: '教室前面有一块大黑板。',
        examplePinyin: 'Jiàoshì qiánmiàn yǒu yí kuài dà hēibǎn.',
        exampleTranslation: 'Phía trước lớp học có một tấm bảng đen lớn.'
      }
    ],
    notesOrTips:
      'Đặc biệt lưu ý: Đồng hồ đeo tay (手表) dùng lượng từ "块" (yí kuài shǒubiǎo), không dùng "个" hay "只"!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000013,
    tags: ['miếng', 'khối', 'đồng hồ', 'bánh mì', 'tiền', 'kuài'],
    practiceQuestions: [
      {
        id: 'pq-mw-kuai-1',
        question: 'Chọn lượng từ chuẩn: "爷爷送给我一____很有纪念意义的手表。"',
        noun: '手表',
        options: ['块', '把', '张', '本'],
        correctAnswer: '块',
        explanation: 'Đồng hồ đeo tay trong tiếng Trung chuẩn xác dùng lượng từ "块" (kuài).'
      }
    ]
  },
  {
    id: 'mw-wei-polite-person',
    measureWord: '位',
    pinyin: 'wèi',
    hanViet: 'Vị',
    vietnameseMeaning: 'vị (tôn xưng lịch sự dành cho con người)',
    category: 'people',
    explanation:
      'Dùng để biểu thị sự tôn kính, lịch sự khi đếm hoặc giới thiệu con người (thầy cô giáo, bác sĩ, khách quý, giáo sư, chuyên gia, bạn bè đối tác).',
    collocations: [
      { phrase: '一位老师', pinyin: 'yí wèi lǎoshī', vietnamese: 'một vị thầy giáo / giáo viên' },
      { phrase: '一位医生', pinyin: 'yí wèi yīshēng', vietnamese: 'một vị bác sĩ' },
      { phrase: '两位客人', pinyin: 'liǎng wèi kèrén', vietnamese: 'hai vị khách' },
      { phrase: '几位朋友', pinyin: 'jǐ wèi péngyou', vietnamese: 'vài vị bạn bè' }
    ],
    commonNouns: [
      {
        hanzi: '老师',
        pinyin: 'lǎoshī',
        vietnamese: 'thầy cô giáo',
        emoji: '👩‍🏫',
        exampleSentence: '李老师是一位经验丰富的老师。',
        examplePinyin: 'Lǐ lǎoshī shì yí wèi jīngyàn fēngfù de lǎoshī.',
        exampleTranslation: 'Thầy Lý là một người thầy giàu kinh nghiệm.'
      },
      {
        hanzi: '医生',
        pinyin: 'yīshēng',
        vietnamese: 'bác sĩ',
        emoji: '👨‍⚕️',
        exampleSentence: '他是一位医术高超的医生。',
        examplePinyin: 'Tā shì yí wèi yīshù gāochāo de yīshēng.',
        exampleTranslation: 'Ông ấy là một vị bác sĩ có y thuật cao siêu.'
      }
    ],
    notesOrTips:
      'Phép lịch sự trong giao tiếp: Khi xưng hô trực tiếp hoặc nói trước mặt người khác, dùng "位" thể hiện học vấn và sự tôn trọng (VD: "请问您有几位？" - Xin hỏi quý khách có mấy vị?). Nói "一个人" là bình thường, nhưng nói "一位老师" nghe trang nhã hơn rất nhiều!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000014,
    tags: ['người', 'tôn xưng', 'bác sĩ', 'thầy giáo', 'khách', 'wèi'],
    practiceQuestions: [
      {
        id: 'pq-mw-wei-1',
        question: 'Chọn lượng từ lịch sự nhất: "向大家介绍一____新来的教授。"',
        noun: '教授',
        options: ['位', '只', '个', '条'],
        correctAnswer: '位',
        explanation: 'Giới thiệu giáo sư, khách quý cần dùng lượng từ tôn xưng lịch sự "位" (wèi).'
      }
    ]
  },
  {
    id: 'mw-bei-cup',
    measureWord: '杯',
    pinyin: 'bēi',
    hanViet: 'Bôi',
    vietnameseMeaning: 'cốc, ly (đồ uống trong cốc)',
    category: 'container',
    explanation:
      'Lượng từ chỉ đồ chứa: dùng cho các loại chất lỏng, đồ uống đựng trong cốc hoặc ly (nước lọc, trà, cà phê, rượu vang, sữa tươi).',
    collocations: [
      { phrase: '一杯水', pinyin: 'yì bēi shuǐ', vietnamese: 'một cốc nước' },
      { phrase: '一杯茶', pinyin: 'yì bēi chá', vietnamese: 'một tách trà' },
      { phrase: '一杯咖啡', pinyin: 'yì bēi kāfēi', vietnamese: 'một ly cà phê' }
    ],
    commonNouns: [
      {
        hanzi: '茶',
        pinyin: 'chá',
        vietnamese: 'trà',
        emoji: '🍵',
        exampleSentence: '请喝一杯热茶吧。',
        examplePinyin: 'Qǐng hē yì bēi rè chá ba.',
        exampleTranslation: 'Xin mời uống một tách trà nóng.'
      },
      {
        hanzi: '咖啡',
        pinyin: 'kāfēi',
        vietnamese: 'cà phê',
        emoji: '☕',
        exampleSentence: '我早上喜欢喝一杯黑咖啡。',
        examplePinyin: 'Wǒ zǎoshang xǐhuan hē yì bēi hēi kāfēi.',
        exampleTranslation: 'Buổi sáng tôi thích uống một ly cà phê đen.'
      }
    ],
    notesOrTips:
      'Phân biệt đồ chứa: "一杯" là cốc/tách, "一瓶" là chai/bình (一瓶矿泉水), "一碗" là bát/tô (一碗面).',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000015,
    tags: ['cốc', 'ly', 'nước', 'trà', 'cà phê', 'bēi'],
    practiceQuestions: [
      {
        id: 'pq-mw-bei-1',
        question: 'Chọn lượng từ phù hợp: "服务员，请给我来一____热绿茶。"',
        noun: '茶',
        options: ['杯', '本', '把', '条'],
        correctAnswer: '杯',
        explanation: 'Trà uống trong cốc dùng lượng từ "杯" (bēi).'
      }
    ]
  },
  {
    id: 'mw-ping-bottle',
    measureWord: '瓶',
    pinyin: 'píng',
    hanViet: 'Bình',
    vietnameseMeaning: 'chai, bình, lọ',
    category: 'container',
    explanation:
      'Dùng cho các chất lỏng hoặc hạt viên đựng trong chai lọ thuỷ tinh/nhựa (nước khoáng, bia, rượu, sữa, nước hoa, tương ớt).',
    collocations: [
      { phrase: '一瓶水', pinyin: 'yì píng shuǐ', vietnamese: 'một chai nước' },
      { phrase: '一瓶酒', pinyin: 'yì píng jiǔ', vietnamese: 'một chai rượu' },
      { phrase: '一瓶牛奶', pinyin: 'yì píng niúnǎi', vietnamese: 'một chai sữa' }
    ],
    commonNouns: [
      {
        hanzi: '矿泉水',
        pinyin: 'kuàngquánshuǐ',
        vietnamese: 'nước khoáng',
        emoji: '🧴',
        exampleSentence: '我买了一瓶矿泉水。',
        examplePinyin: 'Wǒ mǎi le yì píng kuàngquánshuǐ.',
        exampleTranslation: 'Tôi mua một chai nước khoáng.'
      },
      {
        hanzi: '啤酒',
        pinyin: 'píjiǔ',
        vietnamese: 'bia',
        emoji: '🍺',
        exampleSentence: '他们开了一瓶青岛啤酒。',
        examplePinyin: 'Tāmen kāi le yì píng Qīngdǎo píjiǔ.',
        exampleTranslation: 'Họ đã mở một chai bia Thanh Đảo.'
      }
    ],
    notesOrTips: 'Một chai nước là 一瓶水, nếu rót ra cốc thì thành 一杯水.',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000016,
    tags: ['chai', 'bình', 'lọ', 'nước khoáng', 'bia', 'píng'],
    practiceQuestions: [
      {
        id: 'pq-mw-ping-1',
        question: 'Điền lượng từ thích hợp: "超市里一____可乐卖三块钱。"',
        noun: '可乐',
        options: ['瓶', '张', '本', '座'],
        correctAnswer: '瓶',
        explanation: 'Coca đóng chai dùng lượng từ "瓶" (píng).'
      }
    ]
  },
  {
    id: 'mw-wan-bowl',
    measureWord: '碗',
    pinyin: 'wǎn',
    hanViet: 'Oản',
    vietnameseMeaning: 'bát, tô (đồ ăn)',
    category: 'container',
    explanation: 'Dùng cho thức ăn đựng trong bát tô (cơm, mì sợi, canh, súp, cháo).',
    collocations: [
      { phrase: '一碗米饭', pinyin: 'yì wǎn mǐfàn', vietnamese: 'một bát cơm' },
      { phrase: '一碗牛肉面', pinyin: 'yì wǎn niúròumiàn', vietnamese: 'một tô mì bò' },
      { phrase: '一碗热汤', pinyin: 'yì wǎn rè tāng', vietnamese: 'một bát canh nóng' }
    ],
    commonNouns: [
      {
        hanzi: '米饭',
        pinyin: 'mǐfàn',
        vietnamese: 'bát cơm',
        emoji: '🍚',
        exampleSentence: '他吃了两碗米饭。',
        examplePinyin: 'Tā chī le liǎng wǎn mǐfàn.',
        exampleTranslation: 'Anh ấy đã ăn hai bát cơm.'
      },
      {
        hanzi: '面条',
        pinyin: 'miàntiáo',
        vietnamese: 'tô mì',
        emoji: '🍜',
        exampleSentence: '中午我想吃一碗牛肉面。',
        examplePinyin: 'Zhōngwǔ wǒ xiǎng chī yì wǎn niúròumiàn.',
        exampleTranslation: 'Buổi trưa tôi muốn ăn một tô mì bò.'
      }
    ],
    notesOrTips: 'Bát/tô là 碗, đĩa dẹt là 盘 (一盘菜 - một đĩa thức ăn).',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000017,
    tags: ['bát', 'tô', 'cơm', 'mì', 'canh', 'wǎn'],
    practiceQuestions: [
      {
        id: 'pq-mw-wan-1',
        question: 'Chọn lượng từ đúng: "肚子饿了，我要吃两____米饭。"',
        noun: '米饭',
        options: ['碗', '杯', '张', '本'],
        correctAnswer: '碗',
        explanation: 'Cơm đựng trong bát nên dùng lượng từ "碗" (wǎn).'
      }
    ]
  },
  {
    id: 'mw-zhi-stick',
    measureWord: '支',
    pinyin: 'zhī',
    hanViet: 'Chi (cành, nhánh)',
    vietnameseMeaning: 'chiếc, cây (vật thon cứng như bút, súng), bài (hát), đội ngũ',
    category: 'shape_long',
    explanation:
      'Dùng cho các vật thon, thẳng, cứng như các loại bút (bút chì, bút bi, bút lông), súng ống, ngọn nến, mũi tên, hoặc một bài hát, một đội ngũ (đội bóng).',
    collocations: [
      { phrase: '一支笔', pinyin: 'yì zhī bǐ', vietnamese: 'một cây bút' },
      { phrase: '一支铅笔', pinyin: 'yì zhī qiānbǐ', vietnamese: 'một cây bút chì' },
      { phrase: '一支歌', pinyin: 'yì zhī gē', vietnamese: 'một bài hát' },
      { phrase: '一支球队', pinyin: 'yì zhī qiúduì', vietnamese: 'một đội bóng' }
    ],
    commonNouns: [
      {
        hanzi: '铅笔',
        pinyin: 'qiānbǐ',
        vietnamese: 'cây bút chì',
        emoji: '✏️',
        exampleSentence: '借我一支铅笔用一下。',
        examplePinyin: 'Jiè wǒ yì zhī qiānbǐ yòng yíxià.',
        exampleTranslation: 'Cho tôi mượn một cây bút chì dùng một lát.'
      },
      {
        hanzi: '钢笔',
        pinyin: 'gāngbǐ',
        vietnamese: 'cây bút mực',
        emoji: '✒️',
        exampleSentence: '桌上放着一支名牌钢笔。',
        examplePinyin: 'Zhuō shàng fàng zhe yì zhī míngpái gāngbǐ.',
        exampleTranslation: 'Trên bàn có để một cây bút mực hàng hiệu.'
      }
    ],
    notesOrTips:
      'Phân biệt: "支" dùng cho bút, súng; "根" dùng cho chuối, đũa, sợi tóc; còn "只" dùng cho con vật!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000018,
    tags: ['bút', 'súng', 'cây', 'bài hát', 'zhī'],
    practiceQuestions: [
      {
        id: 'pq-mw-zhi-stick-1',
        question: 'Chọn lượng từ đúng: "请给我一____红色的圆珠笔。"',
        noun: '圆珠笔',
        options: ['支', '只', '条', '件'],
        correctAnswer: '支',
        explanation: 'Bút viết thon thẳng dùng lượng từ "支" (zhī).'
      }
    ]
  },
  {
    id: 'mw-feng-letter',
    measureWord: '封',
    pinyin: 'fēng',
    hanViet: 'Phong',
    vietnameseMeaning: 'bức, lá (thư bọc kín)',
    category: 'book_paper',
    explanation: 'Dùng cho các văn bản đóng phong bì hoặc thư điện tử (bức thư tay, email thư điện tử).',
    collocations: [
      { phrase: '一封信', pinyin: 'yì fēng xìn', vietnamese: 'một bức thư' },
      { phrase: '一封电子邮件', pinyin: 'yì fēng diànzǐ yóujiàn', vietnamese: 'một bức email' }
    ],
    commonNouns: [
      {
        hanzi: '信',
        pinyin: 'xìn',
        vietnamese: 'bức thư',
        emoji: '✉️',
        exampleSentence: '我今天收到了远方朋友寄来的一封信。',
        examplePinyin: 'Wǒ jīntiān shōudào le yuǎnfāng péngyou jì lái de yì fēng xìn.',
        exampleTranslation: 'Hôm nay tôi nhận được một bức thư từ người bạn phương xa gửi tới.'
      }
    ],
    notesOrTips: 'Thư từ dùng "封" (bọc kín). Nếu là một tờ giấy viết thư thì là "一张信纸".',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000019,
    tags: ['thư', 'email', 'bức thư', 'fēng'],
    practiceQuestions: [
      {
        id: 'pq-mw-feng-1',
        question: 'Điền lượng từ đúng: "我打算给老朋友写一____信。"',
        noun: '信',
        options: ['封', '张', '本', '把'],
        correctAnswer: '封',
        explanation: 'Thư từ niêm phong dùng lượng từ "封" (fēng).'
      }
    ]
  },
  {
    id: 'mw-duo-flower',
    measureWord: '朵',
    pinyin: 'duǒ',
    hanViet: 'Đóa',
    vietnameseMeaning: 'bông, đóa (hoa, mây, nấm)',
    category: 'plant',
    explanation: 'Dùng cho hoa nở đơn lẻ, đám mây trên trời hoặc cây nấm xòe tán.',
    collocations: [
      { phrase: '一朵花', pinyin: 'yì duǒ huā', vietnamese: 'một bông hoa' },
      { phrase: '一朵白云', pinyin: 'yì duǒ bái yún', vietnamese: 'một đám mây trắng' }
    ],
    commonNouns: [
      {
        hanzi: '花',
        pinyin: 'huā',
        vietnamese: 'bông hoa',
        emoji: '🌸',
        exampleSentence: '路边开着一朵美丽的红花。',
        examplePinyin: 'Lù biān kāi zhe yì duǒ měilì de hóng huā.',
        exampleTranslation: 'Bên vệ đường có một bông hoa đỏ rực rỡ đang nở.'
      },
      {
        hanzi: '白云',
        pinyin: 'bái yún',
        vietnamese: 'đám mây trắng',
        emoji: '☁️',
        exampleSentence: '蓝天上飘着几朵白云。',
        examplePinyin: 'Lántiān shàng piāo zhe jǐ duǒ bái yún.',
        exampleTranslation: 'Trên nền trời xanh trôi bồng bềnh vài đám mây trắng.'
      }
    ],
    notesOrTips: 'Một bông hoa là 一朵花, nhưng một bó hoa thì dùng 一束花 (yí shù huā).',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000020,
    tags: ['hoa', 'bông', 'đóa', 'mây', 'duǒ'],
    practiceQuestions: [
      {
        id: 'pq-mw-duo-1',
        question: 'Chọn lượng từ đúng: "花园里开出了一____漂亮的花。"',
        noun: '花',
        options: ['朵', '支', '本', '头'],
        correctAnswer: '朵',
        explanation: 'Bông hoa dùng lượng từ "朵" (duǒ).'
      }
    ]
  },
  {
    id: 'mw-ge-general',
    measureWord: '个',
    pinyin: 'gè',
    hanViet: 'Cá',
    vietnameseMeaning: 'cái, con, người, quả (lượng từ vạn năng thông dụng nhất)',
    category: 'general',
    explanation:
      'Lượng từ phổ biến và thông dụng nhất trong tiếng Trung. Dùng cho người, quả táo, quả dưa, các danh từ trừu tượng (vấn đề, câu chuyện, tháng, giờ) hoặc thay thế tạm thời khi người học chưa nhớ lượng từ chuyên dụng.',
    collocations: [
      { phrase: '一个人', pinyin: 'yí gè rén', vietnamese: 'một người' },
      { phrase: '一个苹果', pinyin: 'yí gè píngguǒ', vietnamese: 'một quả táo' },
      { phrase: '一个问题', pinyin: 'yí gè wèntí', vietnamese: 'một câu hỏi / vấn đề' },
      { phrase: '一个月', pinyin: 'yí gè yuè', vietnamese: 'một tháng' }
    ],
    commonNouns: [
      {
        hanzi: '人',
        pinyin: 'rén',
        vietnamese: 'người',
        emoji: '🧑',
        exampleSentence: '门外站着一个人。',
        examplePinyin: 'Mén wài zhàn zhe yí gè rén.',
        exampleTranslation: 'Bên ngoài cửa có một người đang đứng.'
      },
      {
        hanzi: '苹果',
        pinyin: 'píngguǒ',
        vietnamese: 'quả táo',
        emoji: '🍎',
        exampleSentence: '我每天吃一个苹果。',
        examplePinyin: 'Wǒ měitiān chī yí gè píngguǒ.',
        exampleTranslation: 'Mỗi ngày tôi ăn một quả táo.'
      },
      {
        hanzi: '问题',
        pinyin: 'wèntí',
        vietnamese: 'vấn đề / câu hỏi',
        emoji: '❓',
        exampleSentence: '请问你有什么问题吗？',
        examplePinyin: 'Qǐngwèn nǐ yǒu shénme wèntí ma?',
        exampleTranslation: 'Xin hỏi bạn có câu hỏi hay thắc mắc gì không?'
      }
    ],
    notesOrTips:
      'Tuy "个" là lượng từ vạn năng có thể dùng tạm thời, nhưng trong các bài thi HSK và giao tiếp chuyên nghiệp, việc sử dụng đúng lượng từ chuyên biệt (như 一把椅子, 一张桌子, 一本书, 一辆车) sẽ ghi điểm ngôn ngữ cao hơn rất nhiều!',
    isBuiltIn: true,
    isMastered: false,
    createdAt: 1711800000021,
    tags: ['thông dụng', 'vạn năng', 'người', 'táo', 'tháng', 'gè'],
    practiceQuestions: [
      {
        id: 'pq-mw-ge-1',
        question: 'Chọn lượng từ thông dụng: "我们班一共有二十____学生。"',
        noun: '学生',
        options: ['个', '张', '本', '头'],
        correctAnswer: '个',
        explanation: 'Học sinh dùng lượng từ "个" (yí gè xuésheng) hoặc tôn xưng "位".'
      }
    ]
  }
];
