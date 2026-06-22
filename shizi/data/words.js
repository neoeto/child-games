'use strict';

/* ===== data/words.js — 100 character vocabulary for 识字乐园 =====
 *
 * Fixed dataset of 100 common Chinese characters for kindergarten (3-4yo).
 * 10 levels × 10 chars per level, grouped by theme.
 *
 * Schema per entry:
 *   id        — stable identifier (w001..w100)
 *   char      — single Chinese character (must match a data/chars/<char>.json)
 *   pinyin    — pinyin with tone marks (fallback visual hint when TTS unavailable)
 *   level     — 1..10 (themed group, also the unlock sequence)
 *   tip       — ≤15 char kid-friendly mnemonic for parents to use in 亲子认字 mode
 *
 * Loaded via <script src="data/words.js" defer> before game.js.
 * Exposes window.WORDS (array) and window.WORDS_BY_LEVEL (object keyed by level).
 */

var WORDS = [
  /* === Level 1: 数字 === */
  { id: 'w001', char: '一', pinyin: 'yī',    level: 1, tip: '一根手指就是一' },
  { id: 'w002', char: '二', pinyin: 'èr',    level: 1, tip: '两根手指就是二' },
  { id: 'w003', char: '三', pinyin: 'sān',   level: 1, tip: '三根手指就是三' },
  { id: 'w004', char: '四', pinyin: 'sì',    level: 1, tip: '四条边的小方块' },
  { id: 'w005', char: '五', pinyin: 'wǔ',    level: 1, tip: '一只手有五指' },
  { id: 'w006', char: '六', pinyin: 'liù',   level: 1, tip: '六一儿童节快乐' },
  { id: 'w007', char: '七', pinyin: 'qī',    level: 1, tip: '七彩彩虹真美丽' },
  { id: 'w008', char: '八', pinyin: 'bā',    level: 1, tip: '八条腿的小螃蟹' },
  { id: 'w009', char: '九', pinyin: 'jiǔ',   level: 1, tip: '九和久同音长久' },
  { id: 'w010', char: '十', pinyin: 'shí',   level: 1, tip: '十全十美最完美' },

  /* === Level 2: 自然 === */
  { id: 'w011', char: '日', pinyin: 'rì',    level: 2, tip: '天上的太阳就是日' },
  { id: 'w012', char: '月', pinyin: 'yuè',   level: 2, tip: '晚上的月亮弯弯' },
  { id: 'w013', char: '水', pinyin: 'shuǐ',  level: 2, tip: '喝水的水流淌' },
  { id: 'w014', char: '火', pinyin: 'huǒ',   level: 2, tip: '火苗暖暖的' },
  { id: 'w015', char: '木', pinyin: 'mù',    level: 2, tip: '大树的树干是木' },
  { id: 'w016', char: '风', pinyin: 'fēng',  level: 2, tip: '风吹树叶哗哗响' },
  { id: 'w017', char: '云', pinyin: 'yún',   level: 2, tip: '天上飘着白云朵' },
  { id: 'w018', char: '雨', pinyin: 'yǔ',    level: 2, tip: '下雨要打伞' },
  { id: 'w019', char: '雪', pinyin: 'xuě',   level: 2, tip: '冬天白雪飘飘' },
  { id: 'w020', char: '山', pinyin: 'shān',  level: 2, tip: '高高的大山峰' },

  /* === Level 3: 天地方位 === */
  { id: 'w021', char: '天', pinyin: 'tiān',  level: 3, tip: '头顶上面就是天' },
  { id: 'w022', char: '地', pinyin: 'dì',    level: 3, tip: '脚下踩着是大地' },
  { id: 'w023', char: '上', pinyin: 'shàng', level: 3, tip: '抬头看上面' },
  { id: 'w024', char: '下', pinyin: 'xià',   level: 3, tip: '低头看下面' },
  { id: 'w025', char: '左', pinyin: 'zuǒ',   level: 3, tip: '拿碗的那只手是左' },
  { id: 'w026', char: '右', pinyin: 'yòu',   level: 3, tip: '拿筷子的那只是右' },
  { id: 'w027', char: '前', pinyin: 'qián',  level: 3, tip: '脸朝的方向是前' },
  { id: 'w028', char: '后', pinyin: 'hòu',   level: 3, tip: '背朝的方向是后' },
  { id: 'w029', char: '里', pinyin: 'lǐ',    level: 3, tip: '箱子打开看里面' },
  { id: 'w030', char: '外', pinyin: 'wài',   level: 3, tip: '出门到外面玩' },

  /* === Level 4: 身体 === */
  { id: 'w031', char: '人', pinyin: 'rén',   level: 4, tip: '站立的人像这个字' },
  { id: 'w032', char: '口', pinyin: 'kǒu',   level: 4, tip: '嘴巴张开是口' },
  { id: 'w033', char: '手', pinyin: 'shǒu',  level: 4, tip: '小手五根指头' },
  { id: 'w034', char: '足', pinyin: 'zú',    level: 4, tip: '脚丫子就是足' },
  { id: 'w035', char: '头', pinyin: 'tóu',   level: 4, tip: '头顶在脖子上' },
  { id: 'w036', char: '目', pinyin: 'mù',    level: 4, tip: '眼睛就是目字' },
  { id: 'w037', char: '耳', pinyin: 'ěr',    level: 4, tip: '耳朵能听声音' },
  { id: 'w038', char: '牙', pinyin: 'yá',    level: 4, tip: '牙齿白白能咬东西' },
  { id: 'w039', char: '心', pinyin: 'xīn',   level: 4, tip: '心在胸口跳啊跳' },
  { id: 'w040', char: '舌', pinyin: 'shé',   level: 4, tip: '舌头尝味道' },

  /* === Level 5: 家庭 === */
  { id: 'w041', char: '爸', pinyin: 'bà',    level: 5, tip: '爸爸的爸字' },
  { id: 'w042', char: '妈', pinyin: 'mā',    level: 5, tip: '妈妈的妈字' },
  { id: 'w043', char: '爷', pinyin: 'yé',    level: 5, tip: '爷爷的爷字' },
  { id: 'w044', char: '奶', pinyin: 'nǎi',   level: 5, tip: '奶奶的奶字' },
  { id: 'w045', char: '哥', pinyin: 'gē',    level: 5, tip: '哥哥的哥字' },
  { id: 'w046', char: '姐', pinyin: 'jiě',   level: 5, tip: '姐姐的姐字' },
  { id: 'w047', char: '弟', pinyin: 'dì',    level: 5, tip: '弟弟的弟字' },
  { id: 'w048', char: '妹', pinyin: 'mèi',   level: 5, tip: '妹妹的妹字' },
  { id: 'w049', char: '我', pinyin: 'wǒ',    level: 5, tip: '我自己就是我' },
  { id: 'w050', char: '你', pinyin: 'nǐ',    level: 5, tip: '和你说话的你' },

  /* === Level 6: 动作 === */
  { id: 'w051', char: '走', pinyin: 'zǒu',   level: 6, tip: '慢慢走路' },
  { id: 'w052', char: '跑', pinyin: 'pǎo',   level: 6, tip: '飞快地跑步' },
  { id: 'w053', char: '看', pinyin: 'kàn',   level: 6, tip: '用眼睛看一看' },
  { id: 'w054', char: '听', pinyin: 'tīng',  level: 6, tip: '用耳朵听一听' },
  { id: 'w055', char: '说', pinyin: 'shuō',  level: 6, tip: '用嘴巴说一说' },
  { id: 'w056', char: '吃', pinyin: 'chī',   level: 6, tip: '吃饭香喷喷' },
  { id: 'w057', char: '喝', pinyin: 'hē',    level: 6, tip: '喝水咕咚咕咚' },
  { id: 'w058', char: '坐', pinyin: 'zuò',   level: 6, tip: '乖乖坐下来' },
  { id: 'w059', char: '立', pinyin: 'lì',    level: 6, tip: '笔直站立好' },
  { id: 'w060', char: '睡', pinyin: 'shuì',  level: 6, tip: '闭上眼睛睡觉' },

  /* === Level 7: 颜色大小 === */
  { id: 'w061', char: '红', pinyin: 'hóng',  level: 7, tip: '红彤彤的苹果' },
  { id: 'w062', char: '黄', pinyin: 'huáng', level: 7, tip: '黄澄澄的香蕉' },
  { id: 'w063', char: '蓝', pinyin: 'lán',   level: 7, tip: '蓝蓝的天空' },
  { id: 'w064', char: '绿', pinyin: 'lǜ',    level: 7, tip: '绿油油的小草' },
  { id: 'w065', char: '黑', pinyin: 'hēi',   level: 7, tip: '黑漆漆的夜晚' },
  { id: 'w066', char: '白', pinyin: 'bái',   level: 7, tip: '白花花的云朵' },
  { id: 'w067', char: '大', pinyin: 'dà',    level: 7, tip: '大大的大象' },
  { id: 'w068', char: '小', pinyin: 'xiǎo',  level: 7, tip: '小小的小老鼠' },
  { id: 'w069', char: '多', pinyin: 'duō',   level: 7, tip: '好多好多星星' },
  { id: 'w070', char: '少', pinyin: 'shǎo',  level: 7, tip: '只有一点点很少' },

  /* === Level 8: 动物 === */
  { id: 'w071', char: '牛', pinyin: 'niú',   level: 8, tip: '哞哞叫的老牛' },
  { id: 'w072', char: '羊', pinyin: 'yáng',  level: 8, tip: '咩咩叫的小羊' },
  { id: 'w073', char: '马', pinyin: 'mǎ',    level: 8, tip: '奔跑的骏马' },
  { id: 'w074', char: '鱼', pinyin: 'yú',    level: 8, tip: '水里游的鱼' },
  { id: 'w075', char: '鸟', pinyin: 'niǎo',  level: 8, tip: '天上飞的小鸟' },
  { id: 'w076', char: '虫', pinyin: 'chóng', level: 8, tip: '地上爬的小虫' },
  { id: 'w077', char: '狗', pinyin: 'gǒu',   level: 8, tip: '汪汪叫的小狗' },
  { id: 'w078', char: '猫', pinyin: 'māo',   level: 8, tip: '喵喵叫的小猫' },
  { id: 'w079', char: '鸡', pinyin: 'jī',    level: 8, tip: '咯咯叫的母鸡' },
  { id: 'w080', char: '鸭', pinyin: 'yā',    level: 8, tip: '嘎嘎叫的鸭子' },

  /* === Level 9: 食物 === */
  { id: 'w081', char: '米', pinyin: 'mǐ',    level: 9, tip: '白白的稻米' },
  { id: 'w082', char: '面', pinyin: 'miàn',  level: 9, tip: '长长的面条' },
  { id: 'w083', char: '饭', pinyin: 'fàn',   level: 9, tip: '香喷喷的白饭' },
  { id: 'w084', char: '菜', pinyin: 'cài',   level: 9, tip: '绿绿的蔬菜' },
  { id: 'w085', char: '果', pinyin: 'guǒ',   level: 9, tip: '甜甜的水果' },
  { id: 'w086', char: '瓜', pinyin: 'guā',   level: 9, tip: '圆滚滚的西瓜' },
  { id: 'w087', char: '糖', pinyin: 'táng',  level: 9, tip: '甜甜的糖果' },
  { id: 'w088', char: '水', pinyin: 'shuǐ',  level: 9, tip: '咕咚咕咚喝水' },
  { id: 'w089', char: '茶', pinyin: 'chá',   level: 9, tip: '爷爷奶奶爱喝茶' },
  { id: 'w090', char: '豆', pinyin: 'dòu',   level: 9, tip: '圆溜溜的小豆子' },

  /* === Level 10: 常用 === */
  { id: 'w091', char: '的', pinyin: 'de',    level: 10, tip: '我的你的他的' },
  { id: 'w092', char: '了', pinyin: 'le',    level: 10, tip: '吃完了做完了' },
  { id: 'w093', char: '在', pinyin: 'zài',   level: 10, tip: '在这里在那里' },
  { id: 'w094', char: '有', pinyin: 'yǒu',   level: 10, tip: '我有一双手' },
  { id: 'w095', char: '是', pinyin: 'shì',   level: 10, tip: '这是那是都是' },
  { id: 'w096', char: '好', pinyin: 'hǎo',   level: 10, tip: '好孩子真乖' },
  { id: 'w097', char: '不', pinyin: 'bù',    level: 10, tip: '不是不对不好' },
  { id: 'w098', char: '来', pinyin: 'lái',   level: 10, tip: '过来来来来' },
  { id: 'w099', char: '去', pinyin: 'qù',    level: 10, tip: '出去去玩啦' },
  { id: 'w100', char: '中', pinyin: 'zhōng', level: 10, tip: '正中间的中国' }
];

/* ===== Derived lookup: WORDS_BY_LEVEL (object keyed by level 1..10) =====
 * Pre-computed to avoid repeated filtering in mode entry functions. */
var WORDS_BY_LEVEL = {};
for (var i = 1; i <= 10; i++) { WORDS_BY_LEVEL[i] = []; }
for (var j = 0; j < WORDS.length; j++) {
  var w = WORDS[j];
  if (WORDS_BY_LEVEL[w.level]) WORDS_BY_LEVEL[w.level].push(w);
}

/* ===== Expose ===== */
window.WORDS = WORDS;
window.WORDS_BY_LEVEL = WORDS_BY_LEVEL;
