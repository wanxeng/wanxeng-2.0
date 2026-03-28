import { NextRequest, NextResponse } from "next/server";

const ZODIAC_SIGNS = ['白羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];

function toOrdinal(month: number, day: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let ordinal = 0;
  for (let m = 1; m < month; m++) ordinal += daysInMonth[m - 1];
  return ordinal + day;
}

// Traditional calendar-based zodiac
function getTraditionalZodiac(month: number, day: number): string {
  const zodiac = [
    { name: '水瓶', start: 20, end: toOrdinal(2, 18) },
    { name: '雙魚', start: toOrdinal(2, 19), end: toOrdinal(3, 20) },
    { name: '白羊', start: toOrdinal(3, 21), end: toOrdinal(4, 19) },
    { name: '金牛', start: toOrdinal(4, 20), end: toOrdinal(5, 20) },
    { name: '雙子', start: toOrdinal(5, 21), end: toOrdinal(6, 20) },
    { name: '巨蟹', start: toOrdinal(6, 21), end: toOrdinal(7, 22) },
    { name: '獅子', start: toOrdinal(7, 23), end: toOrdinal(8, 22) },
    { name: '處女', start: toOrdinal(8, 23), end: toOrdinal(9, 22) },
    { name: '天秤', start: toOrdinal(9, 23), end: toOrdinal(10, 22) },
    { name: '天蠍', start: toOrdinal(10, 23), end: toOrdinal(11, 21) },
    { name: '射手', start: toOrdinal(11, 22), end: toOrdinal(12, 21) },
    { name: '摩羯', start: toOrdinal(12, 22), end: toOrdinal(12, 31) },
    { name: '摩羯', start: 1, end: toOrdinal(1, 19) },
  ];
  const ordinal = toOrdinal(month, day);
  for (const z of zodiac) {
    if (ordinal >= z.start && ordinal <= z.end) return z.name;
  }
  return '處女';
}

async function getWesternAstrology(date: Date, month: number, day: number) {
  const sunSign = getTraditionalZodiac(month, day);
  try {
    const astronomy = await import("astronomy-engine");
    const time = new astronomy.AstroTime(date);
    const moonEcl = astronomy.EclipticGeoMoon(time);
    const moonLonDeg = ((moonEcl?.lon ?? 0) % 360 + 360) % 360;
    const moonSign = ZODIAC_SIGNS[Math.floor(moonLonDeg / 30)];
    return { sunSign, moonSign };
  } catch {
    return { sunSign, moonSign: '天蠍' };
  }
}

async function getBaziData(input: { year: number; month: number; day: number; hour: number; gender: string; name: string; location: string }) {
  try {
    const { Bazi } = await import("bazi.js");
    const bazi = new Bazi({ year: input.year, month: input.month, day: input.day, hour: input.hour });
    const siZhu = bazi.getSiZhu();
    return {
      yearPillar: `${siZhu.year.gan}${siZhu.year.zhi}`,
      monthPillar: `${siZhu.month.gan}${siZhu.month.zhi}`,
      dayPillar: `${siZhu.day.gan}${siZhu.day.zhi}`,
      hourPillar: `${siZhu.hour.gan}${siZhu.hour.zhi}`,
      lunarDate: '',
    };
  } catch {
    return { yearPillar: '癸亥', monthPillar: '甲子', dayPillar: '庚辰', hourPillar: '壬午', lunarDate: '' };
  }
}

async function analyzeWithDeepSeek(data: {
  name: string;
  gender: string;
  location: string;
  year: number;
  month: number;
  day: number;
  western: { sunSign: string; moonSign: string };
  bazi: { yearPillar: string; monthPillar: string; dayPillar: string; hourPillar: string; lunarDate: string };
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { error: "No API key" };

  const prompt = `你是${data.name}的命理師傅，請用說故事的方式，給${data.name}一份完整的命書。用繁體中文。

想象你是一位隱居山林的老師傅，${data.name}特地前來求教。你一邊喝茶，一邊用白話說給他聽——就像在跟他聊天，但不是普通的聊天，是幾十年功力濃縮的洞察。

【${data.name}的基本資料】
- 性別：${data.gender === '男' ? '男性' : '女性'}
- 出生地：${data.location || '未知'}
- 出生日期：公曆 ${data.year}年${data.month}月${data.day}日

【八字命盤】四柱：
- 年柱 ${data.bazi.yearPillar}（代表童年根基、家庭背景）
- 月柱 ${data.bazi.monthPillar}（代表青春期的社會環境與父母關係）
- 日柱 ${data.bazi.dayPillar}（日主 = ${data.name}的本質，是你自己）
- 時柱 ${data.bazi.hourPillar}（代表晚年的運勢延伸）

【西洋占星】：
- 太陽星座：${data.western.sunSign}
- 月亮星座：${data.western.moonSign}

===

【撰寫格式要求】
- 直接稱呼「你」對${data.name}說話
- 每段要有具體生活例子，不要只說概念
- 比喻要生動，讓人有「這真的是我」的感覺
- 避免太學術或太玄的用詞
- 總長度約 1500-2500 中文字

【六個章節】

## 一、姓名學分析
「${data.name}」這個名字，與你的命格有什麼關係？
- 分析名字筆畫、五行屬性（筆畫數對應的五行）
- 名字與你的八字日主是互補還是有些衝突？
- 評分（極吉/大吉/吉/中吉/平/凶）並說明原因
- 具體影響：「在事業上，你的名字讓你比別人更容易...」「在感情上...」
- 一句叮嚀：「建議你...」

## 二、八字命理解讀
${data.name}的四柱：${data.bazi.yearPillar}年 / ${data.bazi.monthPillar}月 / ${data.bazi.dayPillar}日 / ${data.bazi.hourPillar}時

用生活比喻說：你這個人骨子裡像什麼？（例如：像一棵在石縫中生長的樹，木氣旺但根不深）
- 日主五行是什麼？代表你什麼樣的性格特質？
- 五行強弱：哪個五行太旺？哪個太弱？（例如：木太旺容易固執，金太弱容易優柔寡斷）
- 喜用神：這個五行就像你的幸運符，日常生活中該怎麼順勢而為？
- 忌神：這個五行代表你的弱點，什麼情況下你特別容易出問題？
- 流年提示：最近1-2年的運勢怎樣？該注意什麼？

## 三、五行生活指南
根據你的五行分佈，給出具體可行的日常建議（像營養師開處方一樣）：
- 【幸運顏色】多穿什麼顏色的衣服、家裡用什麼色系的裝飾
- 【最佳方位】睡覺時頭朝哪個方向、出門往哪個方向走最順
- 【適合行業】什麼類型的工作最契合你？（例如：木旺的人適合創意、教育、文字工作）
- 【飲食建議】多吃什麼、少吃什麼來補足五行
- 【數字與時辰】你的幸運數字是多少？一天中哪個時辰運勢最旺？
- 【一個生活比喻】「你的命就像...」，例如：「像夏天中午的太陽，正在最旺的時候」

## 四、星座性格解析
你是${data.western.sunSign}（太陽）+ ${data.western.moonSign}（月亮）

【太陽星座 ${data.western.sunSign}】
- ${data.name}給別人的第一印象通常是什麼？例如：「彿彿身邊的人都覺得你是個...的人」
- ${data.western.sunSign}的優點：用一句話描述，例如「天秤座的人，天生就知道怎麼讓身邊的人舒服」
- 這個星座的盲點/要注意的地方，說得溫和一點，例如：「有時候太在意別人的看法，反而委屈了自己」

【月亮星座 ${data.western.moonSign}】
- ${data.name}內心深處是什麼樣的人？例如：「月亮在雙子的人，表面上很冷靜，但其實內心有兩個聲音在對話」
- 什麼事情會讓${data.name}特別有安全感？什麼又會讓你莫名焦慮？
- 跟別人起衝突時，你內心的第一個反應是什麼？

【一個生活比喻】「${data.name}就像...」

## 五、同月同日名人
找出3-5位與${data.name}相同月日出生的知名人物（例如：${data.month}月${data.day}日）：
- 只要月和日相同即可，不需要同年
- 名字、出生日期（月日）、成就
- 名字、出生日期、成就
- 說明他們與你有什麼共同的命格特質
- 如果${data.name}的命格跟他們有什麼相同或不同的地方

## 六、命書詩語
用50-100字，寫一句給${data.name}的話——像老師傅在命書最後蓋印章時說的一句叮嚀。要有詩意、有畫面、有溫度。

例如：「你是山間一棵松，風越大根越深。年少時搖擺不定，中年自有方圓。」

===

請開始撰寫。用繁體中文，${data.name}正等著你為他解讀命運。`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一位修行數十年的命理大師，精通八字、姓名學、五行、西洋占星。你說話古樸有深度，卻又白話易懂，擅用生活比喻讓人聽得懂。用繁體中文回答。"
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 3500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { error: `DeepSeek API error: ${response.status}` };
    }

    const result = await response.json();
    return {
      analysis: result.choices?.[0]?.message?.content ?? "命理分析暫時無法提供。",
    };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, year, month, day, hour, gender, location } = body;

    if (!year || !month || !day || !hour) {
      return NextResponse.json({ error: "Missing birth data" }, { status: 400 });
    }

    const shichenMap: Record<string, number> = {
      '子': 0, '丑': 1, '寅': 3, '卯': 5,
      '辰': 7, '巳': 9, '午': 11, '未': 13,
      '申': 15, '酉': 17, '戌': 19, '亥': 21,
    };
    const hourNum = typeof hour === 'number' ? hour : (shichenMap[hour] ?? 12);
    const birthDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hourNum, 30, 0));

    const [western, bazi, personality] = await Promise.all([
      getWesternAstrology(birthDate, Number(month), Number(day)),
      getBaziData({ year: Number(year), month: Number(month), day: Number(day), hour: hourNum, gender, name, location }),
      Promise.resolve(null),
    ]);

    const analysisResult = await analyzeWithDeepSeek({
      name, gender, location,
      year: Number(year), month: Number(month), day: Number(day),
      western, bazi,
    });

    return NextResponse.json({
      success: true,
      data: { western, bazi, personality, ...analysisResult },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
