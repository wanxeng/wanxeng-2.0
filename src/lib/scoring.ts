// ==========================================
// 命運能量引擎 - 萬象/Fatexi 核心評分系統
// ==========================================

// ---------- 常數定義 ----------

// 天干
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干陰陽
const GAN_YINYANG: Record<string, '陽' | '陰'> = {
  '甲': '陽', '丙': '陽', '戊': '陽', '庚': '陽', '壬': '陽',
  '乙': '陰', '丁': '陰', '己': '陰', '辛': '陰', '癸': '陰',
};

// 天干五行
const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 地支五行
const ZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// 地支陰陽
const ZHI_YINYANG: Record<string, '陽' | '陰'> = {
  '子': '陽', '丑': '陰', '寅': '陽', '卯': '陰',
  '辰': '陽', '巳': '陰', '午': '陽', '未': '陰',
  '申': '陽', '酉': '陰', '戌': '陽', '亥': '陰',
};

// 日主五行
const DAY_MASTER_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 五行相生
const GENERATING: Record<string, string[]> = {
  '木': ['火'],
  '火': ['土'],
  '土': ['金'],
  '金': ['水'],
  '水': ['木'],
};

// 五行相剋
const OVERCOMING: Record<string, string[]> = {
  '木': ['土'],
  '火': ['金'],
  '土': ['水'],
  '金': ['木'],
  '水': ['火'],
};

// ---------- 工具函式 ----------

/** 取得天干索引 (0-9) */
function ganIndex(g: string): number {
  return GAN.indexOf(g[0]);
}

/** 取得地支索引 (0-11) */
function zhiIndex(z: string): number {
  return ZHI.indexOf(z[0]);
}

/** 取得天干陰陽 */
function ganYinYang(g: string): '陽' | '陰' {
  return GAN_YINYANG[g[0]] || '陽';
}

/** 取得天干五行 */
function ganWuXing(g: string): string {
  return GAN_WUXING[g[0]] || '土';
}

/** 取得地支五行 */
function zhiWuXing(z: string): string {
  return ZHI_WUXING[z[0]] || '土';
}

/** 取得地支陰陽 */
function zhiYinYang(z: string): '陽' | '陰' {
  return ZHI_YINYANG[z[0]] || '陽';
}

/** 取得日主五行 */
function dayMasterWuXing(dm: string): string {
  return DAY_MASTER_WUXING[dm[0]] || '土';
}

/** 天干合化 (年月日時干支) */
function getHeHua(g1: string, g2: string): string | null {
  const map: Record<string, string> = {
    '甲己': '土', '乙庚': '金', '丙辛': '水', '丁壬': '木', '戊癸': '火',
  };
  const key = g1[0] + g2[0];
  return map[key] || null;
}

/** 天干相冲 */
function isChong(g1: string, g2: string): boolean {
  const chongPairs = ['甲庚', '乙辛', '丙壬', '丁癸'];
  const key = g1[0] + g2[0];
  return chongPairs.includes(key) || chongPairs.includes(g2[0] + g1[0]);
}

/** 取得大運方向 (順/逆) */
function getDaYunDirection(birthYearGan: string): number {
  // 甲丙戊庚壬 順行，乙丁己辛癸 逆行
  const shunGans = ['甲', '丙', '戊', '庚', '壬'];
  return shunGans.includes(birthYearGan[0]) ? 1 : -1;
}

/** 計算陰陽五行強度 (-1 到 +1) */
function wuXingStrength(element: string, targetElement: string): number {
  if (element === targetElement) return 1.0;
  if (GENERATING[element]?.includes(targetElement)) return 0.8;
  if (OVERCOMING[element]?.includes(targetElement)) return -0.5;
  return 0;
}

/** 十神判定 */
function getTenGod(stem: string, dayMaster: string): string {
  const dmElement = dayMasterWuXing(dayMaster);
  const stemElement = ganWuXing(stem);
  
  if (stemElement === dmElement) {
    return stem === dayMaster ? '比' : '劫';
  }
  
  const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  const beiKe: Record<string, string> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };
  const shengWo: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
  
  if (sheng[dmElement] === stemElement) {
    return ['丙', '丁'].includes(stem) ? '食' : '傷';
  }
  if (ke[dmElement] === stemElement) {
    return ['戊', '己'].includes(stem) ? '財' : '才';
  }
  if (beiKe[dmElement] === stemElement) {
    return ['庚', '辛'].includes(stem) ? '官' : '殺';
  }
  if (shengWo[dmElement] === stemElement) {
    return ['壬', '癸'].includes(stem) ? '印' : '梟';
  }
  return '其他';
}

/** 六十甲子循環 */
const JIAZI = ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
               '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
               '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
               '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
               '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
               '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'];

/** 根據年份取得甲子 */
function getYearGanZhi(year: number): string {
  const baseYear = 1984; // 甲子年
  const offset = (year - baseYear) % 60;
  return JIAZI[offset < 0 ? offset + 60 : offset];
}

/** 根據年份和月份取得月干 */
function getMonthGan(year: number, month: number): string {
  const monthGans = ['甲', '丙', '戊', '庚', '壬'];
  const yearGanIdx = ganIndex(getYearGanZhi(year)[0]);
  return monthGans[(yearGanIdx * 2 + month) % 10];
}

/** 根據年份和日期取得日干 */
function getDayGan(year: number, month: number, day: number): string {
  const baseDate = new Date(1984, 0, 6); // 甲子日
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  return JIAZI[(diffDays % 60 + 60) % 60][0];
}

/** 根據時辰取得時干 */
function getHourGan(dayGan: string, hour: number): string {
  const hourGans = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const dayGanIdx = ganIndex(dayGan);
  return hourGans[(dayGanIdx * 2 + Math.floor(hour / 2)) % 10];
}

// ---------- 能量計算 ----------

/** 計算四柱能量 */
export function calculatePillarEnergy(
  pillars: { year: string; month: string; day: string; hour: string },
  dayMaster: string
): {
  yearEnergy: number;
  monthEnergy: number;
  dayEnergy: number;
  hourEnergy: number;
  fiveElements: Record<string, number>;
  tenGods: Record<string, number>;
} {
  const dmElement = dayMasterWuXing(dayMaster);
  
  // 五行計數
  const fe: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  
  // 十神計數
  const tg: Record<string, number> = { '比': 0, '劫': 0, '食': 0, '傷': 0, '財': 0, '才': 0, '官': 0, '殺': 0, '印': 0, '梟': 0 };
  
  // 年柱
  const yearStem = pillars.year[0];
  const yearBranch = pillars.year[1] || pillars.year[1];
  fe[ganWuXing(yearStem)]++;
  fe[zhiWuXing(yearBranch)]++;
  tg[getTenGod(yearStem, dayMaster)]++;
  
  // 月柱
  const monthStem = pillars.month[0];
  const monthBranch = pillars.month[1] || pillars.month[1];
  fe[ganWuXing(monthStem)]++;
  fe[zhiWuXing(monthBranch)]++;
  tg[getTenGod(monthStem, dayMaster)]++;
  
  // 日柱
  const dayStem = dayMaster;
  const dayBranch = pillars.day[1] || pillars.day[1];
  fe[zhiWuXing(dayBranch)]++;
  
  // 時柱
  const hourStem = pillars.hour[0];
  const hourBranch = pillars.hour[1] || pillars.hour[1];
  fe[ganWuXing(hourStem)]++;
  fe[zhiWuXing(hourBranch)]++;
  tg[getTenGod(hourStem, dayMaster)]++;
  
  // 計算各柱能量 (相對於日主的強弱)
  const yearStrength = wuXingStrength(dmElement, ganWuXing(yearStem));
  const monthStrength = wuXingStrength(dmElement, ganWuXing(monthStem));
  const dayStrength = wuXingStrength(dmElement, zhiWuXing(dayBranch));
  const hourStrength = wuXingStrength(dmElement, zhiWuXing(hourBranch));
  
  return {
    yearEnergy: 50 + yearStrength * 30,
    monthEnergy: 50 + monthStrength * 30,
    dayEnergy: 50 + dayStrength * 30,
    hourEnergy: 50 + hourStrength * 30,
    fiveElements: fe,
    tenGods: tg,
  };
}

/** 計算流年能量 */
export function calculateLiuNianEnergy(
  year: number,
  dayMaster: string,
  daYunYear: number = 0
): { power: number; element: string; ganZhi: string; heHua: string | null; isChong: boolean } {
  const dmElement = dayMasterWuXing(dayMaster);
  const ganZhi = getYearGanZhi(year);
  const stem = ganZhi[0];
  const branch = ganZhi[1];
  const stemElement = ganWuXing(stem);
  
  // 天干生助日主
  const stemSupport = stemElement === dmElement ? 1 : GENERATING[dmElement]?.includes(stemElement) ? 0.5 : 0;
  
  // 地支與日主關係
  const branchRelation = wuXingStrength(dmElement, zhiWuXing(branch));
  
  // 天干合化
  const heHua = getHeHua(stem, dayMaster);
  
  // 天干相冲
  const chong = isChong(stem, dayMaster);
  
  // 大運影響
  const daYunEffect = Math.sin(daYunYear / 10 * Math.PI) * 10;
  
  // 流年能量
  const power = 50 + stemSupport * 25 + branchRelation * 15 + daYunEffect;
  
  return {
    power: Math.max(20, Math.min(120, power)),
    element: stemElement,
    ganZhi,
    heHua,
    isChong: chong,
  };
}

/** 計算月份能量加成 */
export function calculateMonthBonus(
  month: number,
  western?: { sunSign?: string }
): { wealth: number; career: number; love: number; vitality: number } {
  // 默認月份星座加成（可以從 Firestore 覆蓋）
  const zodiacBonus: Record<number, { wealth: number; career: number; love: number; vitality: number }> = {
    1: { wealth: 5, career: 10, love: 0, vitality: -5 },
    2: { wealth: 8, career: 5, love: 5, vitality: 0 },
    3: { wealth: 0, career: 5, love: 10, vitality: 10 },
    4: { wealth: 10, career: 0, love: -5, vitality: 5 },
    5: { wealth: 5, career: 10, love: 5, vitality: 0 },
    6: { wealth: 0, career: 5, love: 15, vitality: -5 },
    7: { wealth: 5, career: 5, love: 10, vitality: 10 },
    8: { wealth: 15, career: 5, love: 10, vitality: 0 },
    9: { wealth: 5, career: 15, love: 5, vitality: 5 },
    10: { wealth: 0, career: 10, love: 0, vitality: 5 },
    11: { wealth: -5, career: 5, love: 5, vitality: 15 },
    12: { wealth: 10, career: 15, love: -5, vitality: 10 },
  };
  
  return zodiacBonus[month] || { wealth: 0, career: 0, love: 0, vitality: 0 };
}

// ---------- 四維度評分 ----------

export interface FormulaConfig {
  base: number;
  factors: Record<string, { weight: number; desc: string }>;
}

export interface YearlyConfig {
  ganZhi: string;
  element: string;
  desc: string;
  wealth: number;
  career: number;
  love: number;
  vitality: number;
}

export interface MonthlyConfig {
  wealth: number;
  career: number;
  love: number;
  vitality: number;
}

export interface ScoringResult {
  wealth: number;
  career: number;
  love: number;
  vitality: number;
}

/** 計算四維度個人化分數 */
export function calculateScores(
  bazi: {
    yearPillar?: string;
    monthPillar?: string;
    dayPillar?: string;
    hourPillar?: string;
    fiveElements?: Record<string, number>;
    tenGods?: Record<string, number>;
    birthYear?: number;
    western?: { sunSign?: string };
  },
  formulas: Record<string, FormulaConfig>,
  yearly?: Record<string, YearlyConfig>,
  monthly?: Record<string, MonthlyConfig>,
  targetYear: number = new Date().getFullYear(),
  targetMonth: number = new Date().getMonth() + 1,
  currentYear: number = new Date().getFullYear()
): ScoringResult {
  const dayMaster = bazi.dayPillar?.[0] || '甲';
  const dmElement = dayMasterWuXing(dayMaster);
  
  // 大運年（相對於起運年）
  const birthYear = bazi.birthYear || targetYear;
  const daYunYear = targetYear - birthYear;
  const daYunDirection = getDaYunDirection(bazi.yearPillar?.[0] || dayMaster);
  
  // 流年能量
  const liuNian = calculateLiuNianEnergy(targetYear, dayMaster, daYunYear);
  
  // 五行分佈
  const fe = bazi.fiveElements || { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const dmFeCount = fe[dmElement] || 1;
  
  // 十神分佈
  const tg = bazi.tenGods || {};
  
  // 月份加成
  const monthBonus = monthly?.[targetMonth] || calculateMonthBonus(targetMonth, bazi.western);
  
  // 流年自定義分數（優先使用）
  const yearData = yearly?.[String(targetYear)];
  
  // 計算財富
  const wealthFormula = formulas['wealth'];
  let wealth = yearData?.wealth || wealthFormula?.base || 60;
  if (wealthFormula?.factors) {
    // 年干生助日主
    if (wealthFormula.factors.yearStemSupport && liuNian.heHua === dmElement) {
      wealth += wealthFormula.factors.yearStemSupport.weight;
    }
    // 年支陰陽
    if (wealthFormula.factors.yearBranchYinYang) {
      const isYin = dmElement === '陰';
      wealth += isYin ? wealthFormula.factors.yearBranchYinYang.weight : -wealthFormula.factors.yearBranchYinYang.weight * 0.5;
    }
    // 月乾十神
    if (wealthFormula.factors.monthStemWealth && (tg['財'] || tg['才'])) {
      wealth += wealthFormula.factors.monthStemWealth.weight * (tg['財'] + tg['才']);
    }
    // 流年天干能量
    if (wealthFormula.factors.yearStemEnergy) {
      wealth += liuNian.power * (wealthFormula.factors.yearStemEnergy.weight / 50);
    }
    // 大運周期
    if (wealthFormula.factors.daYunCycle) {
      wealth += Math.sin(daYunYear / 10 * Math.PI) * wealthFormula.factors.daYunCycle.weight * daYunDirection;
    }
  }
  wealth += monthBonus.wealth;
  
  // 計算事業
  const careerFormula = formulas['career'];
  let career = yearData?.career || careerFormula?.base || 60;
  if (careerFormula?.factors) {
    // 月乾官殺
    if (careerFormula.factors.monthStemOfficial && (tg['官'] || tg['殺'])) {
      career += careerFormula.factors.monthStemOfficial.weight * (tg['官'] + tg['殺']);
    }
    // 月支事業宮
    if (careerFormula.factors.monthBranchCareer && bazi.monthPillar) {
      const monthBranch = bazi.monthPillar[1] || bazi.monthPillar[1];
      const monthStrength = wuXingStrength(dmElement, zhiWuXing(monthBranch));
      career += monthStrength * careerFormula.factors.monthBranchCareer.weight;
    }
    // 土星周期（約29年）
    if (careerFormula.factors.saturnCycle) {
      career += Math.sin(daYunYear / 29 * Math.PI) * careerFormula.factors.saturnCycle.weight;
    }
    // 流年官運
    if (careerFormula.factors.yearOfficial) {
      career += liuNian.power * (careerFormula.factors.yearOfficial.weight / 50);
    }
  }
  career += monthBonus.career;
  
  // 計算愛情
  const loveFormula = formulas['love'];
  let love = yearData?.love || loveFormula?.base || 55;
  if (loveFormula?.factors) {
    // 日支夫妻宮
    if (loveFormula.factors.dayBranchSpouse && bazi.dayPillar) {
      const dayBranch = bazi.dayPillar[1] || bazi.dayPillar[1];
      const dayStrength = wuXingStrength(dmElement, zhiWuXing(dayBranch));
      love += dayStrength * loveFormula.factors.dayBranchSpouse.weight;
    }
    // 金星周期（每月亮相）
    if (loveFormula.factors.venusCycle) {
      love += Math.sin(targetMonth / 1.0) * loveFormula.factors.venusCycle.weight;
    }
    // 月亮相位
    if (loveFormula.factors.moonPhase) {
      love += Math.sin(targetMonth / 4.0 * Math.PI) * loveFormula.factors.moonPhase.weight;
    }
    // 流年桃花
    if (loveFormula.factors.yearPeachBlossom) {
      const hasPeach = liuNian.ganZhi.includes('卯') || liuNian.ganZhi.includes('子');
      if (hasPeach) {
        love += loveFormula.factors.yearPeachBlossom.weight;
      }
    }
  }
  love += monthBonus.love;
  
  // 計算能量
  const vitalityFormula = formulas['vitality'];
  let vitality = yearData?.vitality || vitalityFormula?.base || 60;
  if (vitalityFormula?.factors) {
    // 時柱
    if (vitalityFormula.factors.hourPillar && bazi.hourPillar) {
      const hourBranch = bazi.hourPillar[1] || bazi.hourPillar[1];
      const hourStrength = wuXingStrength(dmElement, zhiWuXing(hourBranch));
      vitality += hourStrength * vitalityFormula.factors.hourPillar.weight;
    }
    // 天王星周期（約7年）
    if (vitalityFormula.factors.uranusCycle) {
      vitality += Math.sin(daYunYear / 7 * Math.PI) * vitalityFormula.factors.uranusCycle.weight;
    }
    // 日出能量
    if (vitalityFormula.factors.sunriseEnergy) {
      // 上午能量較高
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 10) {
        vitality += vitalityFormula.factors.sunriseEnergy.weight;
      }
    }
    // 健康流年
    if (vitalityFormula.factors.healthYear) {
      vitality += liuNian.power * (vitalityFormula.factors.healthYear.weight / 50);
    }
  }
  vitality += monthBonus.vitality;
  
  // 範圍限制
  return {
    wealth: Math.max(0, Math.min(100, Math.round(wealth))),
    career: Math.max(0, Math.min(100, Math.round(career))),
    love: Math.max(0, Math.min(100, Math.round(love))),
    vitality: Math.max(0, Math.min(100, Math.round(vitality))),
  };
}

// ---------- K 線生成 ----------

export interface KLineData {
  label: string;
  year: number;
  month?: number;
  open: number;
  close: number;
  current: number;  // 兼容舊 chart（等於 close）
  high: number;
  low: number;
  isUp: boolean;
  isCurrent: boolean;
  wealth: number;
  career: number;
  love: number;
  vitality: number;
  element: string;
  ganZhi: string;
  ma5?: number;
  ma10?: number;
}

/** 生成 K 線數據（年視圖：從用戶出生年開始） */
export function generateKLineData(
  bazi: {
    yearPillar?: string;
    monthPillar?: string;
    dayPillar?: string;
    hourPillar?: string;
    fiveElements?: Record<string, number>;
    tenGods?: Record<string, number>;
    birthYear?: number;
    western?: { sunSign?: string };
  },
  formulas: Record<string, FormulaConfig>,
  yearly?: Record<string, YearlyConfig>,
  monthly?: Record<string, MonthlyConfig>,
  startYear?: number,
  endYear?: number
): KLineData[] {
  const currentYear = new Date().getFullYear();
  const birthYear = bazi.birthYear || currentYear;
  const fromYear = startYear || Math.max(birthYear, 1980);
  const toYear = endYear || birthYear + 70;
  
  const data: KLineData[] = [];
  
  for (let year = fromYear; year <= toYear; year++) {
    const scores = calculateScores(bazi, formulas, yearly, monthly, year, 6, currentYear);
    const totalScore = Math.round((scores.wealth + scores.career + scores.love + scores.vitality) / 4);
    
    // Open = 年初能量（前一年年末能量）
    const prevScores = year > fromYear 
      ? calculateScores(bazi, formulas, yearly, monthly, year - 1, 12, currentYear)
      : scores;
    const prevTotal = Math.round((prevScores.wealth + prevScores.career + prevScores.love + prevScores.vitality) / 4);
    
    // Close = 年末能量
    const closeScores = calculateScores(bazi, formulas, yearly, monthly, year, 12, currentYear);
    const closeTotal = Math.round((closeScores.wealth + closeScores.career + closeScores.love + closeScores.vitality) / 4);
    
    // High/Low = 年內月均線的極值
    let high = 0, low = 200;
    for (let m = 1; m <= 12; m++) {
      const mScores = calculateScores(bazi, formulas, yearly, monthly, year, m, currentYear);
      const mTotal = Math.round((mScores.wealth + mScores.career + mScores.love + mScores.vitality) / 4);
      high = Math.max(high, mTotal);
      low = Math.min(low, mTotal);
    }
    
    const open = prevTotal;
    const close = closeTotal;
    
    data.push({
      label: `${year}`,
      year,
      open: Math.max(20, Math.min(180, open)),
      close: Math.max(20, Math.min(180, close)),
      current: Math.max(20, Math.min(180, close)),
      high: Math.max(open, close, high) + 2,
      low: Math.min(open, close, low) - 2,
      isUp: close >= open,
      isCurrent: year === currentYear,
      wealth: scores.wealth,
      career: scores.career,
      love: scores.love,
      vitality: scores.vitality,
      element: getYearGanZhi(year)[1],
      ganZhi: getYearGanZhi(year),
    });
  }
  
  // 計算 MA5 / MA10
  for (let i = 0; i < data.length; i++) {
    if (i >= 4) {
      data[i].ma5 = Math.round(data.slice(i - 4, i + 1).reduce((s, d) => s + d.close, 0) / 5);
    }
    if (i >= 9) {
      data[i].ma10 = Math.round(data.slice(i - 9, i + 1).reduce((s, d) => s + d.close, 0) / 10);
    }
  }
  
  return data;
}

/** 生成月 K 線數據 */
export function generateMonthlyKLineData(
  bazi: {
    yearPillar?: string;
    monthPillar?: string;
    dayPillar?: string;
    hourPillar?: string;
    fiveElements?: Record<string, number>;
    tenGods?: Record<string, number>;
    birthYear?: number;
    western?: { sunSign?: string };
  },
  formulas: Record<string, FormulaConfig>,
  yearly?: Record<string, YearlyConfig>,
  monthly?: Record<string, MonthlyConfig>,
  year?: number
): KLineData[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const targetYear = year || currentYear;
  
  const data: KLineData[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const scores = calculateScores(bazi, formulas, yearly, monthly, targetYear, month, currentYear);
    const totalScore = Math.round((scores.wealth + scores.career + scores.love + scores.vitality) / 4);
    
    const open = month > 1
      ? Math.round((calculateScores(bazi, formulas, yearly, monthly, targetYear, month - 1, currentYear).wealth + 
                   calculateScores(bazi, formulas, yearly, monthly, targetYear, month - 1, currentYear).career +
                   calculateScores(bazi, formulas, yearly, monthly, targetYear, month - 1, currentYear).love +
                   calculateScores(bazi, formulas, yearly, monthly, targetYear, month - 1, currentYear).vitality) / 4)
      : totalScore;
    
    const close = totalScore;
    
    data.push({
      label: `${month}月`,
      year: targetYear,
      month,
      open: Math.max(20, Math.min(180, open)),
      close: Math.max(20, Math.min(180, close)),
      current: Math.max(20, Math.min(180, close)),
      high: Math.max(open, close) + 2,
      low: Math.min(open, close) - 2,
      isUp: close >= open,
      isCurrent: targetYear === currentYear && month === currentMonth,
      wealth: scores.wealth,
      career: scores.career,
      love: scores.love,
      vitality: scores.vitality,
      element: '',
      ganZhi: '',
    });
  }
  
  // MA5 / MA10（月視圖不需要）
  
  return data;
}