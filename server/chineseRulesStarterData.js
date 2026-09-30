export const CHINESE_RULES_STARTER_DATA = [
  {
    id: 'rule-tone3-tone3',
    title: 'Biến điệu hai thanh 3 đi liền nhau (3 + 3 ➔ 2 + 3)',
    category: 'pronunciation',
    formula: 'Thanh 3 (ˇ) + Thanh 3 (ˇ) ➔ Thanh 2 (ˊ) + Thanh 3 (ˇ)',
    summary: 'Khi 2 âm tiết mang thanh 3 đi liền nhau, âm thứ nhất đọc thành thanh 2 (dấu sắc), âm thứ hai giữ nguyên thanh 3.',
    detail: 'Trong tiếng Hán, việc phát âm hai thanh 3 liên tiếp rất nặng nề và khó nối âm. Vì vậy quy tắc biến điệu bắt buộc âm đầu tiên đổi thành thanh 2 khi phát âm. Lưu ý: Trong chữ viết Pinyin chuẩn, người ta vẫn ghi nguyên thanh 3 (ví dụ nǐ hǎo), nhưng khi đọc thì đọc là ní hǎo.\n\nĐối với 3 thanh 3 liên tiếp:\n- Nếu chia theo cấu trúc [1 + 2] (ví dụ 我 + 很好): Đọc là 3 + 2 + 3 (Wǒ hén hǎo).\n- Nếu chia theo cấu trúc [2 + 1] (ví dụ 展览馆 [展览 + 馆]): Đọc là 2 + 2 + 3 (Zhánlán guǎn).',
    examples: [
      {
        chinese: '你好',
        pinyin: 'nǐ hǎo ➔ ní hǎo',
        vietnamese: 'Xin chào',
        note: 'Viết nǐ hǎo nhưng đọc ní hǎo'
      },
      {
        chinese: '可以',
        pinyin: 'kěyǐ ➔ kéyǐ',
        vietnamese: 'Có thể',
        note: 'Đọc âm thứ nhất thành thanh 2'
      },
      {
        chinese: '很好',
        pinyin: 'hěn hǎo ➔ hén hǎo',
        vietnamese: 'Rất tốt',
        note: 'Biến điệu thành thanh 2 + thanh 3'
      },
      {
        chinese: '手表',
        pinyin: 'shǒubiǎo ➔ shóubiǎo',
        vietnamese: 'Đồng hồ đeo tay',
        note: 'Phát âm biến thanh'
      },
      {
        chinese: '洗澡',
        pinyin: 'xǐzǎo ➔ xízǎo',
        vietnamese: 'Tắm rửa',
        note: 'Hai thanh 3 biến thành 2-3'
      }
    ],
    exceptions: 'Quy tắc này chỉ áp dụng khi nói / phát âm thực tế. Trên văn bản sách báo, ký hiệu phiên âm Pinyin vẫn giữ nguyên dấu thanh 3 ban đầu.',
    tags: ['thanh 3', 'biến điệu', 'phát âm', 'pinyin'],
    isBuiltIn: true,
    createdAt: 1700000000001,
    practiceQuestions: [
      {
        id: 'q-tone3-1',
        question: 'Khi hai từ mang thanh 3 đi liền nhau (ví dụ: "你好"), từ thứ nhất sẽ được phát âm theo thanh mấy?',
        options: ['Thanh 2 (dấu sắc)', 'Thanh 1 (ngang)', 'Thanh 4 (hạ mạnh)', 'Thanh 3 (giữ nguyên)'],
        correctAnswer: 'Thanh 2 (dấu sắc)',
        explanation: 'Quy tắc biến điệu thanh 3: Thanh 3 + Thanh 3 ➔ Thanh 2 + Thanh 3. Do đó âm đầu đọc thành thanh 2 (ní hǎo).'
      },
      {
        id: 'q-tone3-2',
        question: 'Từ "可以" (kěyǐ) trong thực tế giao tiếp phát âm như thế nào?',
        options: ['kéyǐ (thanh 2 + thanh 3)', 'kěyí (thanh 3 + thanh 2)', 'kèyǐ (thanh 4 + thanh 3)', 'kēyǐ (thanh 1 + thanh 3)'],
        correctAnswer: 'kéyǐ (thanh 2 + thanh 3)',
        explanation: 'Cả 2 chữ "可" (kě) và "以" (yǐ) đều mang thanh 3, do đó chữ đầu "可" biến âm thành thanh 2 (ké).'
      }
    ]
  },
  {
    id: 'rule-time-minute',
    title: 'Quy tắc đọc Giờ & Phút trong tiếng Trung',
    category: 'time_numbers',
    formula: '[Số giờ] + 点 (diǎn) + [Số phút] + 分 (fēn)',
    summary: 'Dưới 10 phút dùng "零" + số + "分"; từ 10 phút trở lên có thể bỏ "分", nhưng riêng đúng 10 phút (十分) bắt buộc đọc "分" để tránh nhầm số giờ.',
    detail: 'Quy tắc chi tiết diễn đạt thời gian:\n1. Cấu trúc cơ bản: [Giờ] + 点 (diǎn) + [Phút] + 分 (fēn).\n2. Phút từ 1 đến 9: BẮT BUỘC dùng chữ 零 (líng) và kèm chữ 分 (fēn). Ví dụ: 8:05 đọc là 八点零五分 (bā diǎn líng wǔ fēn) hoặc 八点五分 (phải có 分).\n3. Mốc đúng 10 phút: BẮT BUỘC phải phát âm chữ 分 (fēn): 九点十分 (jiǔ diǎn shí fēn). Nếu chỉ nói "九点十" sẽ gây mơ hồ như "9 giờ 10".\n4. Các mốc phút tròn chục từ 20 trở lên hoặc phút có 2 chữ số (8:25): Có thể lược bỏ chữ 分 trong khẩu ngữ (ví dụ: 八点二十五).\n5. Các mốc đặc biệt:\n   - 15 phút = 一刻 (yí kè). Ví dụ 7:15 = 七点一刻.\n   - 30 phút = 半 (bàn). Ví dụ 8:30 = 八点半.\n   - 45 phút = 三刻 (sān kè) hoặc dùng giờ kém: 差一刻...点.\n   - 2 giờ: Dùng 两点 (liǎng diǎn), KHÔNG dùng 二点 (èr diǎn).',
    examples: [
      {
        chinese: '八点零五分',
        pinyin: 'bā diǎn líng wǔ fēn',
        vietnamese: '8 giờ 5 phút',
        note: 'Dưới 10 phút phải có 零 và 分'
      },
      {
        chinese: '九点十分',
        pinyin: 'jiǔ diǎn shí fēn',
        vietnamese: '9 giờ 10 phút',
        note: 'Đúng 10 phút bắt buộc đọc chữ 分'
      },
      {
        chinese: '两点半',
        pinyin: 'liǎng diǎn bàn',
        vietnamese: '2 giờ rưỡi (2:30)',
        note: 'Dùng 两点 thay vì 二点, 半 là 30 phút'
      },
      {
        chinese: '七点一刻',
        pinyin: 'qī diǎn yí kè',
        vietnamese: '7 giờ 15 phút',
        note: '一刻 tương đương 15 phút'
      },
      {
        chinese: '差五分八点',
        pinyin: 'chà wǔ fēn bā diǎn',
        vietnamese: '8 giờ kém 5 phút',
        note: '差 (chà) dùng để nói giờ kém'
      }
    ],
    exceptions: 'Tuyệt đối không dùng "二点" khi nói 2 giờ, luôn luôn phải dùng "两点" (liǎng diǎn).',
    tags: ['thời gian', 'giờ phút', 'số đếm', 'khẩu ngữ'],
    isBuiltIn: true,
    createdAt: 1700000000002,
    practiceQuestions: [
      {
        id: 'q-time-1',
        question: 'Cách đọc chuẩn cho thời gian 8 giờ 5 phút (08:05) trong tiếng Trung là gì?',
        options: ['八点零五分 (bā diǎn líng wǔ fēn)', '八点五 (bā diǎn wǔ)', '八点十分 (bā diǎn shí fēn)', '二点零五分 (èr diǎn líng wǔ fēn)'],
        correctAnswer: '八点零五分 (bā diǎn líng wǔ fēn)',
        explanation: 'Khi số phút dưới 10, bắt buộc phải dùng chữ 零 (líng) và có chữ 分 (fēn) ở cuối.'
      },
      {
        id: 'q-time-2',
        question: 'Tại sao khi đọc 9 giờ 10 phút (09:10) lại bắt buộc phải có chữ "分" (九点十分)?',
        options: ['Để tránh nghe nhầm hoặc hiểu lầm với số giờ', 'Vì tất cả các số phút đều không được bỏ chữ 分', 'Vì chữ 十 mang thanh 2', 'Để làm câu nói dài hơn'],
        correctAnswer: 'Để tránh nghe nhầm hoặc hiểu lầm với số giờ',
        explanation: 'Đúng 10 phút (十) rất dễ gây nhầm lẫn nếu không có chữ 分 (fēn). Từ 20 phút trở lên (二十, 三十...) mới có thể lược bỏ chữ 分 trong văn nói.'
      },
      {
        id: 'q-time-3',
        question: '"2 giờ đúng" trong tiếng Trung đọc là gì?',
        options: ['两点 (liǎng diǎn)', '二点 (èr diǎn)', '两时 (liǎng shí)', '第二点 (dì èr diǎn)'],
        correctAnswer: '两点 (liǎng diǎn)',
        explanation: 'Khi chỉ giờ giấc và lượng thời gian, số 2 bắt buộc dùng "两" (liǎng), không dùng "二" (èr).'
      }
    ]
  },
  {
    id: 'rule-tone-bu',
    title: 'Biến điệu của chữ 不 (bù ➔ bú)',
    category: 'pronunciation',
    formula: '不 (bù) + Thanh 4 ➔ 不 (bú) + Thanh 4',
    summary: 'Bình thường đọc là "bù" (thanh 4). Khi đứng trước một từ mang thanh 4 khác, "不" biến điệu thành thanh 2 "bú".',
    detail: 'Quy tắc biến âm chữ 不 (bù):\n1. Trước thanh 4 (dấu huyền/hạ giọng): Đọc thành "bú" (thanh 2). Ví dụ: 不是 (bú shì), 不要 (bú yào), 不谢 (bú xiè), 不客气 (bú kèqi).\n2. Trước thanh 1, thanh 2, thanh 3: Giữ nguyên thanh 4 "bù". Ví dụ: 不吃 (bù chī - thanh 1), 不来 (bù lái - thanh 2), 不好 (bù hǎo - thanh 3).\n3. Khi đứng giữa trong câu hỏi chính phản hoặc cụm từ lặp: Đọc thanh nhẹ "bu". Ví dụ: 好不好 (hǎo bu hǎo), 去不去 (qù bu qù), 听得懂看不懂.',
    examples: [
      {
        chinese: '不是',
        pinyin: 'bù shì ➔ bú shì',
        vietnamese: 'Không phải',
        note: 'Đứng trước 是 (thanh 4) đổi thành bú'
      },
      {
        chinese: '不要',
        pinyin: 'bù yào ➔ bú yào',
        vietnamese: 'Không cần / Đừng',
        note: 'Đứng trước 要 (thanh 4) đổi thành bú'
      },
      {
        chinese: '不吃',
        pinyin: 'bù chī',
        vietnamese: 'Không ăn',
        note: 'Đứng trước thanh 1 giữ nguyên bù'
      },
      {
        chinese: '不好',
        pinyin: 'bù hǎo',
        vietnamese: 'Không tốt',
        note: 'Đứng trước thanh 3 giữ nguyên bù'
      },
      {
        chinese: '去不去',
        pinyin: 'qù bu qù',
        vietnamese: 'Đi hay không đi?',
        note: 'Đứng giữa đọc thanh nhẹ không dấu'
      }
    ],
    exceptions: 'Trong từ điển hoặc phiên âm gốc một chữ rời rạc, "不" luôn được ghi nhận là bù (thanh 4).',
    tags: ['không', 'bù', 'biến điệu', 'phát âm'],
    isBuiltIn: true,
    createdAt: 1700000000003,
    practiceQuestions: [
      {
        id: 'q-bu-1',
        question: 'Trong cụm từ "不是" (không phải), chữ "不" được phát âm theo thanh nào?',
        options: ['bú (thanh 2)', 'bù (thanh 4)', 'bǔ (thanh 3)', 'bu (thanh nhẹ)'],
        correctAnswer: 'bú (thanh 2)',
        explanation: 'Vì từ "是" (shì) mang thanh 4, nên chữ "不" đứng trước phải biến âm thành thanh 2: "bú shì".'
      },
      {
        id: 'q-bu-2',
        question: 'Trước một từ mang thanh 1 (như trong "不吃" - bù chī), chữ "不" đọc là gì?',
        options: ['bù (giữ nguyên thanh 4)', 'bú (thanh 2)', 'bū (thanh 1)', 'bu (thanh nhẹ)'],
        correctAnswer: 'bù (giữ nguyên thanh 4)',
        explanation: 'Trước các thanh 1, 2, 3, chữ "不" vẫn giữ nguyên thanh 4 chuẩn là "bù".'
      }
    ]
  },
  {
    id: 'rule-tone-yi',
    title: 'Biến điệu của chữ 一 (yī ➔ yí / yì / yāo)',
    category: 'pronunciation',
    formula: '一 + Thanh 4 ➔ yí | 一 + Thanh 1/2/3 ➔ yì | Đứng một mình/thứ tự ➔ yī | Số điện thoại ➔ yāo',
    summary: 'Đứng một mình đọc yī. Trước thanh 4 biến thành yí. Trước thanh 1,2,3 biến thành yì. Trong số điện thoại/số phòng đọc là yāo.',
    detail: 'Biến điệu của chữ 一 (yī) là một trong những quy tắc phát âm quan trọng nhất:\n1. Giữ nguyên thanh 1 (yī): Khi đứng riêng lẻ, đếm số (一, 二, 三), số thứ tự (第一, 一楼), ngày tháng (一月一日).\n2. Biến thành thanh 2 (yí): Khi đứng trước âm mang thanh 4. Ví dụ: 一样 (yí yàng), 一定 (yí dìng), 一共 (yí gòng), 一下 (yí xià).\n3. Biến thành thanh 4 (yì): Khi đứng trước âm mang thanh 1, 2, 3. Ví dụ: 一天 (yì tiān - thanh 1), 一年 (yì nián - thanh 2), 一起 (yì qǐ - thanh 3), 一本 (yì běn - thanh 3).\n4. Đọc thanh nhẹ (yi): Khi đứng giữa động từ lặp lại. Ví dụ: 看一看 (kàn yi kàn), 试一试 (shì yi shì).\n5. Đọc là "yāo": Khi đọc số điện thoại, số phòng khách sạn, biển số xe để tránh nhầm với số 7 (qī).',
    examples: [
      {
        chinese: '一定',
        pinyin: 'yī dìng ➔ yí dìng',
        vietnamese: 'Nhất định',
        note: 'Trước thanh 4 đổi thành yí'
      },
      {
        chinese: '一起',
        pinyin: 'yī qǐ ➔ yì qǐ',
        vietnamese: 'Cùng nhau',
        note: 'Trước thanh 3 đổi thành yì'
      },
      {
        chinese: '第一',
        pinyin: 'dì-yī',
        vietnamese: 'Thứ nhất',
        note: 'Số thứ tự giữ nguyên yī'
      },
      {
        chinese: '看一看',
        pinyin: 'kàn yi kàn',
        vietnamese: 'Xem một chút',
        note: 'Đứng giữa đọc thanh nhẹ yi'
      },
      {
        chinese: '房间101',
        pinyin: 'fángjiān yāo líng yāo',
        vietnamese: 'Phòng 101',
        note: 'Số phòng đọc chữ 1 là yāo'
      }
    ],
    exceptions: 'Khi đọc năm (ví dụ 2026年: èr líng èr liù nián) chữ 一 vẫn đọc là yī nếu có.',
    tags: ['số một', 'yī', 'yāo', 'biến điệu', 'phát âm'],
    isBuiltIn: true,
    createdAt: 1700000000004,
    practiceQuestions: [
      {
        id: 'q-yi-1',
        question: 'Trong từ "一起" (cùng nhau, qǐ là thanh 3), chữ "一" được đọc là gì?',
        options: ['yì (thanh 4)', 'yí (thanh 2)', 'yī (thanh 1)', 'yāo'],
        correctAnswer: 'yì (thanh 4)',
        explanation: 'Trước các từ mang thanh 1, 2 hoặc 3, chữ "一" biến thành thanh 4 "yì".'
      },
      {
        id: 'q-yi-2',
        question: 'Khi đọc số điện thoại di động hoặc số phòng khách sạn, số 1 thường đọc là gì?',
        options: ['yāo', 'yī', 'yí', 'yì'],
        correctAnswer: 'yāo',
        explanation: 'Số 1 đọc thành "yāo" trong viễn thông, số phòng, biển số để tránh nhầm với số 7 (qī).'
      }
    ]
  },
  {
    id: 'rule-er-liang',
    title: 'Phân biệt cách dùng 二 (èr) và 两 (liǎng)',
    category: 'vocabulary',
    formula: 'Số đếm, thứ tự, số nhà/SĐT ➔ 二 | Lượng từ, số lượng người/vật, giờ giấc ➔ 两',
    summary: 'Dùng "二" khi đọc số thuần túy hoặc số thứ tự; dùng "两" khi đứng trước lượng từ chỉ số lượng người/vật hoặc giờ giấc.',
    detail: 'Cả hai đều có nghĩa là 2 nhưng sử dụng trong ngữ cảnh hoàn toàn khác nhau:\n1. Dùng 二 (èr):\n   - Đếm số thuần túy: 一, 二, 三, 四...\n   - Số thứ tự: 第二 (thứ hai), 二月 (tháng hai), 二楼 (tầng hai).\n   - Dãy số, số phòng, số điện thoại, biển xe: 房间二零二 (phòng 202).\n   - Số thập phân, phân số: 零点二 (0.2), 二分之一 (1/2).\n   - Hàng chục: 二十 (20 - tuyệt đối không nói 两十).\n2. Dùng 两 (liǎng):\n   - Trước lượng từ chỉ số lượng: 两个人 (2 người), 两本书 (2 cuốn sách), 两个星期 (2 tuần).\n   - Thời gian và đo lường: 两点 (2 giờ đúng), 两年 (2 năm), 两块钱 (2 đồng tiền).\n   - Hàng nghìn/vạn: 两千 (2.000), 两万 (20.000).\n   - Lưu ý hàng trăm: 200 có thể dùng cả 两百 (liǎng bǎi) lẫn 二百 (èr bǎi).',
    examples: [
      {
        chinese: '两个人',
        pinyin: 'liǎng ge rén',
        vietnamese: 'Hai người',
        note: 'Trước lượng từ 个 bắt buộc dùng 两'
      },
      {
        chinese: '两点钟',
        pinyin: 'liǎng diǎn zhōng',
        vietnamese: '2 giờ đúng',
        note: 'Chỉ giờ giấc dùng 两点'
      },
      {
        chinese: '第二课',
        pinyin: 'dì èr kè',
        vietnamese: 'Bài học số hai',
        note: 'Số thứ tự dùng 第二'
      },
      {
        chinese: '二十块',
        pinyin: 'èrshí kuài',
        vietnamese: '20 tệ',
        note: 'Số 20 bắt buộc dùng 二十'
      }
    ],
    exceptions: 'Tuyệt đối không bao giờ nói "两十" (sai ngữ pháp hoàn toàn), 20 luôn luôn là "二十" (èrshí).',
    tags: ['số đếm', 'èr', 'liǎng', 'lượng từ', 'ngữ pháp'],
    isBuiltIn: true,
    createdAt: 1700000000005,
    practiceQuestions: [
      {
        id: 'q-erliang-1',
        question: 'Muốn nói "2 quyển sách" trong tiếng Trung, cách nói nào sau đây đúng?',
        options: ['两本书 (liǎng běn shū)', '二本书 (èr běn shū)', '两书 (liǎng shū)', '二两书 (èr liǎng shū)'],
        correctAnswer: '两本书 (liǎng běn shū)',
        explanation: 'Trước lượng từ (本) chỉ số lượng đồ vật, bắt buộc phải dùng "两" (liǎng).'
      },
      {
        id: 'q-erliang-2',
        question: 'Số "20" trong tiếng Trung được đọc là gì?',
        options: ['二十 (èrshí)', '两十 (liǎngshí)', '二两 (èrliǎng)', '两两 (liǎngliǎng)'],
        correctAnswer: '二十 (èrshí)',
        explanation: 'Số chục 20 luôn luôn đọc là "二十" (èrshí), không bao giờ dùng 两十.'
      }
    ]
  },
  {
    id: 'rule-word-order-time-place',
    title: 'Trật tự Thời gian & Địa điểm trong câu tiếng Trung',
    category: 'grammar',
    formula: 'Chủ ngữ + [Thời gian] + [Địa điểm] + Động từ + Tân ngữ',
    summary: 'Thời gian và Địa điểm luôn đứng TRƯỚC Động từ chính. Đi từ đơn vị LỚN nhất đến NHỎ nhất.',
    detail: 'Sự khác biệt lớn nhất giữa ngữ pháp tiếng Trung và tiếng Việt:\n1. Vị trí trong câu:\n   - Tiếng Việt: "Tôi ăn cơm ở nhà lúc 7 giờ tối" (Động từ đứng trước thời gian, địa điểm ở cuối).\n   - Tiếng Trung: Bắt buộc đưa Thời gian và Nơi chốn lên TRƯỚC Động từ: "我晚上七点在家里吃饭" (Chủ ngữ + Thời gian + Địa điểm + Động từ + Tân ngữ).\n   - Thời gian cũng có thể đặt ở đầu câu trước Chủ ngữ: "晚上七点我在家里吃饭".\n   - Tuyệt đối KHÔNG đặt thời gian/nơi chốn ở cuối câu (*我吃饭在家里七点* là sai).\n2. Thứ tự thời gian từ LỚN đến BÉ:\n   - Năm ➔ Tháng ➔ Ngày ➔ Buổi sáng/tối ➔ Giờ ➔ Phút.\n   - Ví dụ: 2026年9月30日下午3点 (Năm 2026 tháng 9 ngày 30 chiều 3 giờ).',
    examples: [
      {
        chinese: '我晚上八点在家看书。',
        pinyin: 'Wǒ wǎnshang bā diǎn zài jiā kàn shū.',
        vietnamese: 'Tôi đọc sách ở nhà lúc 8 giờ tối.',
        note: 'Thời gian (晚上八点) + Địa điểm (在家) trước động từ 看书'
      },
      {
        chinese: '他明天去北京。',
        pinyin: 'Tā míngtiān qù Běijīng.',
        vietnamese: 'Ngày mai anh ấy đi Bắc Kinh.',
        note: 'Thời gian (明天) đứng trước động từ 去'
      },
      {
        chinese: '我们在学校学习汉语。',
        pinyin: 'Wǒmen zài xuéxiào xuéxí Hànyǔ.',
        vietnamese: 'Chúng tôi học tiếng Trung ở trường.',
        note: 'Địa điểm (在学校) đứng trước động từ 学习'
      }
    ],
    exceptions: 'Một số động từ chỉ sự di chuyển hoặc kết quả có thể nhận bổ ngữ nơi chốn đứng sau (như 去学校, 住在中国, 放在桌子上).',
    tags: ['cấu trúc câu', 'trật tự từ', 'ngữ pháp', 'thời gian', 'địa điểm'],
    isBuiltIn: true,
    createdAt: 1700000000006,
    practiceQuestions: [
      {
        id: 'q-order-1',
        question: 'Câu "Tôi ăn cơm ở trường lúc 12 giờ trưa" dịch chuẩn ngữ pháp tiếng Trung là câu nào?',
        options: [
          '我中午十二点在学校吃饭。',
          '我吃饭在学校中午十二点。',
          '我在学校吃饭中午十二点。',
          '我吃饭中午十二点在学校。'
        ],
        correctAnswer: '我中午十二点在学校吃饭。',
        explanation: 'Quy tắc vàng tiếng Trung: Chủ ngữ + [Thời gian] + [Địa điểm] + Động từ + Tân ngữ. Thời gian và địa điểm không bao giờ đứng cuối câu.'
      },
      {
        id: 'q-order-2',
        question: 'Khi diễn đạt ngày giờ trong tiếng Trung, thứ tự sắp xếp chuẩn là gì?',
        options: [
          'Từ lớn đến bé: Năm ➔ Tháng ➔ Ngày ➔ Giờ ➔ Phút',
          'Từ bé đến lớn: Phút ➔ Giờ ➔ Ngày ➔ Tháng ➔ Năm',
          'Tự do tuỳ theo văn cảnh',
          'Đặt giờ lên đầu câu rồi mới đến ngày tháng'
        ],
        correctAnswer: 'Từ lớn đến bé: Năm ➔ Tháng ➔ Ngày ➔ Giờ ➔ Phút',
        explanation: 'Tư duy tiếng Trung luôn đi từ bao quát lớn nhất đến chi tiết nhỏ nhất: Năm ➔ Tháng ➔ Ngày ➔ Giờ ➔ Phút.'
      }
    ]
  },
  {
    id: 'rule-de-de-de',
    title: 'Phân biệt 3 chữ "de": 的, 得, 地 (Đích, Đắc, Địa)',
    category: 'grammar',
    formula: 'Định ngữ + 的 + Danh từ | Động từ + 得 + Bổ ngữ | Trạng ngữ + 地 + Động từ',
    summary: '"的" đi trước Danh từ (sở hữu/tính chất); "得" đứng sau Động từ biểu thị mức độ; "地" đứng trước Động từ mô tả cách thức.',
    detail: 'Ba chữ này đều phát âm là "de" (thanh nhẹ) nhưng giữ 3 vai trò ngữ pháp hoàn toàn khác nhau:\n1. Chữ 的 (de - Bạch bao đích):\n   - Đứng trước Danh từ (Định ngữ + 的 + Danh từ).\n   - Biểu thị sở hữu hoặc miêu tả tính chất của danh từ.\n   - Ví dụ: 我的电脑 (máy tính của tôi), 漂亮的衣服 (bộ quần áo đẹp).\n2. Chữ 得 (de - Song nhân đắc):\n   - Đứng sau Động từ hoặc Tính từ (Động từ + 得 + Bổ ngữ trạng thái).\n   - Nối động từ với từ chỉ mức độ/kết quả thực hiện.\n   - Ví dụ: 跑得很快 (chạy rất nhanh), 睡得好 (ngủ ngon), 做得对 (làm đúng).\n3. Chữ 地 (de - Thổ địa):\n   - Đứng trước Động từ (Tính từ + 地 + Động từ).\n   - Đóng vai trò tạo trạng ngữ miêu tả cách thức hành động diễn ra (thường dịch là "một cách...").\n   - Ví dụ: 高兴地说 (nói một cách vui vẻ), 认真地听 (lắng nghe chăm chú).',
    examples: [
      {
        chinese: '我的汉语老师',
        pinyin: 'Wǒ de Hànyǔ lǎoshī',
        vietnamese: 'Giáo viên tiếng Trung của tôi',
        note: '的 đứng trước Danh từ 老师'
      },
      {
        chinese: '他跑得很快',
        pinyin: 'Tā pǎo de hěn kuài',
        vietnamese: 'Anh ấy chạy rất nhanh',
        note: '得 đứng sau Động từ 跑'
      },
      {
        chinese: '高兴地跳起来',
        pinyin: 'gāoxìng de tiào qǐlái',
        vietnamese: 'Vui sướng nhảy cẫng lên',
        note: '地 đứng trước Động từ 跳'
      }
    ],
    exceptions: 'Khi đại từ nhân xưng đứng trước danh từ chỉ người thân hoặc mối quan hệ thân thiết, có thể bỏ "的", ví dụ: 我妈妈 (mẹ tôi), 我朋友 (bạn tôi).',
    tags: ['de', 'ba chữ de', 'ngữ pháp', 'bổ ngữ', 'định ngữ'],
    isBuiltIn: true,
    createdAt: 1700000000007,
    practiceQuestions: [
      {
        id: 'q-de-1',
        question: 'Trong câu "他说___很好" (Anh ấy nói rất hay), cần điền chữ "de" nào?',
        options: ['得', '的', '地', 'Không cần điền'],
        correctAnswer: '得',
        explanation: 'Đứng sau Động từ (说) để bổ nghĩa mức độ (很好), bắt buộc dùng chữ "得" (Đắc).'
      },
      {
        id: 'q-de-2',
        question: 'Chữ "地" (de) trong tiếng Trung giữ chức năng ngữ pháp gì?',
        options: [
          'Đứng trước Động từ để miêu tả cách thức thực hiện hành động',
          'Đứng trước Danh từ để chỉ quyền sở hữu',
          'Đứng sau Động từ để chỉ mức độ đạt được',
          'Đứng cuối câu làm trợ từ nghi vấn'
        ],
        correctAnswer: 'Đứng trước Động từ để miêu tả cách thức thực hiện hành động',
        explanation: 'Cấu trúc: Trạng ngữ (tính từ) + 地 + Động từ (ví dụ: 认真地听 - chăm chú lắng nghe).'
      }
    ]
  },
  {
    id: 'rule-verb-reduplication',
    title: 'Quy tắc lặp lại Động từ (Trùng điệp động từ)',
    category: 'grammar',
    formula: 'Đơn âm: AA hoặc A一A | Song âm: ABAB | Li hợp: AAB',
    summary: 'Lặp lại động từ để diễn tả hành động ngắn, làm thử một chút, làm cho ngữ khí câu nói trở nên nhẹ nhàng, thân mật, lịch sự.',
    detail: 'Cách lặp lại động từ trong tiếng Trung:\n1. Động từ đơn âm tiết:\n   - Dạng AA: 看看 (kànkan), 听听 (tīngting), 问问 (wènwen).\n   - Dạng A一A: 看一看 (kàn yi kàn), 试一试 (shì yi shì).\n   - Trong quá khứ: A了一A hoặc A了A (看了看).\n   - Chữ thứ hai luôn đọc thanh nhẹ.\n2. Động từ song âm tiết thông thường (dạng AB):\n   - Lặp thành ABAB: 休息 ➔ 休息休息 (xiūxi xiūxi), 学习 ➔ 学习学习.\n3. Động từ li hợp (dạng A-B mang kết cấu động tân):\n   - Chỉ lặp lại chữ đầu: Lặp thành AAB.\n   - Ví dụ: 散步 ➔ 散散步 (sànsàn bù - đi dạo chút), 游泳 ➔ 游游泳 (yóuyóu yǒng), 睡觉 ➔ 睡睡觉.\n\nÝ nghĩa: Hành động diễn ra trong thời gian ngắn, thử nghiệm ("thử xem"), hoặc tạo cảm giác thân mật, không mang tính ra lệnh.',
    examples: [
      {
        chinese: '你看一看这本书。',
        pinyin: 'Nǐ kàn yi kàn zhè běn shū.',
        vietnamese: 'Bạn xem thử quyển sách này đi.',
        note: 'Dạng A一A biểu thị xem thử một chút'
      },
      {
        chinese: '周末我们休息休息。',
        pinyin: 'Zhōumò wǒmen xiūxi xiūxi.',
        vietnamese: 'Cuối tuần chúng mình nghỉ ngơi một chút.',
        note: 'Động từ song âm tiết lặp dạng ABAB'
      },
      {
        chinese: '晚上我们去散散步吧。',
        pinyin: 'Wǎnshang wǒmen qù sànsàn bù ba.',
        vietnamese: 'Tối nay tụi mình đi dạo một lát nhé.',
        note: 'Động từ li hợp 散步 lặp dạng AAB'
      }
    ],
    exceptions: 'Không lặp lại những động từ biểu thị trạng thái tư duy kéo dài hoặc không kiểm soát được bằng ý chí (như: 有, 在, 是, 懂, 知道, 喜欢...).',
    tags: ['động từ', 'lặp lại', 'ngữ pháp', 'trùng điệp', 'khẩu ngữ'],
    isBuiltIn: true,
    createdAt: 1700000000008,
    practiceQuestions: [
      {
        id: 'q-redup-1',
        question: 'Động từ li hợp "散步" (đi dạo) khi lặp lại sẽ có dạng nào?',
        options: ['散散步 (sànsàn bù)', '散步散步 (sànbù sànbù)', '散步散 (sànbù sàn)', '散一散步一 (sàn yi sàn bù yi)'],
        correctAnswer: '散散步 (sànsàn bù)',
        explanation: 'Động từ li hợp có kết cấu Động + Tân nên khi lặp lại chỉ lặp động từ đầu tiên: dạng AAB (散散步).'
      },
      {
        id: 'q-redup-2',
        question: 'Tác dụng của việc lặp lại động từ trong câu tiếng Trung là gì?',
        options: [
          'Biểu thị hành động diễn ra nhanh, thử làm, ngữ khí lịch sự nhẹ nhàng',
          'Biểu thị hành động bắt buộc phải thực hiện ngay lập tức',
          'Biểu thị hành động đã xảy ra trong quá khứ xa xưa',
          'Biểu thị sự phủ định tuyệt đối'
        ],
        correctAnswer: 'Biểu thị hành động diễn ra nhanh, thử làm, ngữ khí lịch sự nhẹ nhàng',
        explanation: 'Trùng điệp động từ làm mềm giọng nói, tạo cảm giác thân mật và lịch sự khi nhờ vả hoặc đề xuất.'
      }
    ]
  },
  {
    id: 'rule-stroke-order',
    title: '7 Quy tắc bút thuận cơ bản viết chữ Hán',
    category: 'writing',
    formula: 'Ngang trước sổ sau • Phẩy trước mác sau • Trên trước dưới sau • Ngoài trước trong sau • Vào trước đóng sau',
    summary: 'Quy tắc thứ tự nét giúp viết chữ Hán đúng trật tự, nét chữ ngay ngắn, cân đối và chuẩn xác theo quy chuẩn thư pháp.',
    detail: '7 Quy tắc bút thuận căn bản nhất mọi người học chữ Hán đều phải nắm vững:\n1. Ngang trước, sổ sau (先横后竖): Chữ 十 (viết nét ngang 一 trước, nét sổ 丨 sau).\n2. Phẩy trước, mác sau (先撇后捺): Chữ 人, 八 (viết nét phẩy 丿 trước, nét mác ㇏ sau).\n3. Trên trước, dưới sau (先上后下): Chữ 三, 二, 言 (viết nét phía trên rồi hạ dần xuống dưới).\n4. Trái trước, phải sau (先左后右): Chữ 你, 他, 好 (viết bộ thủ bên trái trước rồi viết phần bên phải sau).\n5. Ngoài trước, trong sau (先外后内): Chữ 月, 同, 风 (viết khung bao bọc bên ngoài trước rồi viết nét bên trong).\n6. Vào trước, đóng sau (先进入后关门): Đối với chữ có khung bao kín 4 phía như 国, 回, 四, 日 (viết khung ngoài 冂 ➔ viết ruột bên trong ➔ cuối cùng mới đóng nét đáy 一).\n7. Giữa trước, hai bên sau (先中间后两边): Đối với chữ đối xứng hai bên như 小, 水 (viết nét chính giữa trước rồi viết hai bên đối xứng sau).',
    examples: [
      {
        chinese: '十',
        pinyin: 'shí',
        vietnamese: 'Số mười',
        note: 'Nét ngang trước, nét sổ sau'
      },
      {
        chinese: '人',
        pinyin: 'rén',
        vietnamese: 'Người',
        note: 'Nét phẩy trước, nét mác sau'
      },
      {
        chinese: '国',
        pinyin: 'guó',
        vietnamese: 'Quốc gia / Đất nước',
        note: 'Vào trước đóng sau: Khung 冂 ➔ 玉 ➔ Đóng đáy 一'
      },
      {
        chinese: '小',
        pinyin: 'xiǎo',
        vietnamese: 'Nhỏ / Bé',
        note: 'Nét móc giữa trước, hai nét hai bên sau'
      }
    ],
    exceptions: 'Quy tắc "Vào trước đóng sau" luôn là nét đáy sau cùng, giống như việc "bước vào phòng rồi mới đóng cửa lại".',
    tags: ['bút thuận', 'tập viết', 'nét chữ', 'thư pháp', 'chữ hán'],
    isBuiltIn: true,
    createdAt: 1700000000009,
    practiceQuestions: [
      {
        id: 'q-stroke-1',
        question: 'Đối với chữ có khung bao bọc như "国" hoặc "回", thứ tự nét đúng là gì?',
        options: [
          'Vào trước đóng sau (viết ruột bên trong rồi mới đóng nét đáy)',
          'Đóng nét đáy trước rồi mới viết ruột bên trong',
          'Viết từ dưới lên trên',
          'Viết ruột trước rồi mới vẽ khung bên ngoài'
        ],
        correctAnswer: 'Vào trước đóng sau (viết ruột bên trong rồi mới đóng nét đáy)',
        explanation: 'Quy tắc kinh điển: "Vào nhà trước, đóng cửa sau" - viết khung 3 phía ➔ viết ruột ➔ đóng nét đáy cuối cùng.'
      },
      {
        id: 'q-stroke-2',
        question: 'Chữ "十" (số 10) tuân theo quy tắc bút thuận cơ bản nào?',
        options: ['Ngang trước, sổ sau', 'Sổ trước, ngang sau', 'Phẩy trước, mác sau', 'Trên trước, dưới sau'],
        correctAnswer: 'Ngang trước, sổ sau',
        explanation: 'Quy tắc số 1 của viết chữ Hán: Ngang trước (一), sổ sau (丨) tạo thành chữ 十.'
      }
    ]
  },
  {
    id: 'rule-measure-words',
    title: 'Quy tắc sử dụng Lượng từ cơ bản trong tiếng Trung',
    category: 'vocabulary',
    formula: 'Số từ + LƯỢNG TỪ + Danh từ',
    summary: 'Trong tiếng Trung, giữa Số từ và Danh từ BẮT BUỘC phải có Lượng từ phù hợp (như 个, 本, 张, 条, 件, 只, 块).',
    detail: 'Không thể nói trực tiếp "Số từ + Danh từ" như tiếng Việt mà luôn phải có lượng từ tương ứng kẹp ở giữa:\n1. 个 (ge): Lượng từ phổ biến nhất cho người và đồ vật thông thường: 一个人 (1 người), 一个苹果 (1 quả táo).\n2. 本 (běn): Dành cho sách vở có gáy: 一本书 (1 cuốn sách), 两本杂志 (2 cuốn tạp chí).\n3. 张 (zhāng): Dành cho vật mỏng, phẳng hoặc có bề mặt phẳng: 一张纸 (1 tờ giấy), 一张桌子 (1 cái bàn), 一张照片 (1 bức ảnh).\n4. 条 (tiáo): Dành cho vật thon dài, uốn lượn: 一条鱼 (1 con cá), 一条路 (1 con đường), 一条裤子 (1 cái quần).\n5. 件 (jiàn): Dành cho quần áo hoặc sự việc: 一件衣服 (1 bộ quần áo), 一件事 (1 việc).\n6. 只 (zhī): Dành cho loài động vật nhỏ hoặc một bên của cặp: 一只猫 (1 con mèo), 一只鸟 (1 con chim), 一只手 (1 bàn tay).\n7. 块 (kuài): Dành cho vật dạng khối/miếng hoặc tiền tệ: 一块西瓜 (1 miếng dưa hấu), 一块钱 (1 đồng tiền).',
    examples: [
      {
        chinese: '三本书',
        pinyin: 'sān běn shū',
        vietnamese: 'Ba quyển sách',
        note: '本 là lượng từ cho sách'
      },
      {
        chinese: '一张桌子',
        pinyin: 'yì zhāng zhuōzi',
        vietnamese: 'Một chiếc bàn',
        note: '张 là lượng từ cho vật có mặt phẳng'
      },
      {
        chinese: '两条鱼',
        pinyin: 'liǎng tiáo yú',
        vietnamese: 'Hai con cá',
        note: '条 là lượng từ cho con vật thon dài'
      },
      {
        chinese: '一件衬衫',
        pinyin: 'yí jiàn chènshān',
        vietnamese: 'Một chiếc áo sơ mi',
        note: '件 là lượng từ cho trang phục áo'
      }
    ],
    exceptions: 'Khi chưa biết lượng từ chuyên dụng của một danh từ nào đó, trong khẩu ngữ người ta thường tạm dùng "个" (ge).',
    tags: ['lượng từ', 'ngữ pháp', 'từ vựng', 'danh từ'],
    isBuiltIn: true,
    createdAt: 1700000000010,
    practiceQuestions: [
      {
        id: 'q-measure-1',
        question: 'Lượng từ chuẩn cho danh từ "书" (sách) là gì?',
        options: ['本 (běn)', '张 (zhāng)', '条 (tiáo)', '件 (jiàn)'],
        correctAnswer: '本 (běn)',
        explanation: 'Sách vở đóng tập có gáy luôn dùng lượng từ "本" (běn): 一本书.'
      },
      {
        id: 'q-measure-2',
        question: 'Muốn nói "một bức ảnh" hoặc "một tờ giấy", ta dùng lượng từ nào?',
        options: ['张 (zhāng)', '个 (ge)', '本 (běn)', '只 (zhī)'],
        correctAnswer: '张 (zhāng)',
        explanation: 'Vật mỏng, phẳng như giấy, ảnh, vé, mặt bàn dùng lượng từ "张" (zhāng).'
      }
    ]
  }
];
