// Scoring Engine - Personalised four-dimensional calculation
// Based on user's BaZi data + formula configs + yearly/monthly cycles

export interface BaZiData {
  dayMaster: string;      // 日主: 甲/乙/丙/丁/戊/己/庚/辛/壬/癸
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  fiveElements: Record<string, number>;  // 五行分佈
  tenGods: Record<string, string>;      // 十神
  [key: string]: any;
}

export interface FormulaConfig {
  name: string;
  emoji?: string;
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

export interface KLineConfig {
  ma5: number;
  ma10: number;
  goldenCross: string;
  deathCross: string;
  yangLine: string;
  yinLine: string;
}

export interface ScoringResult {
  wealth: number;
  career: number;
  love: number;
  vitality: number;
  wealthFactors: string[];
  careerFactors: string[];
  loveFactors: string[];
  vitalityFactors: string[];
}

// Day Master to Element mapping
const DAY_MASTER_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// Five Elements interaction matrix
const ELEMENT_STRENGTH: Record<string, Record<string, number>> = {
  '木': { '木': 1.0, '火': 0.8, '土': 0.5, '金': 0.3, '水': 1.2 },
  '火': { '木': 1.2, '火': 1.0, '土': 0.8, '金': 0.3, '水': 0.5 },
  '土': { '木': 0.5, '火': 1.2, '土': 1.0, '金': 0.8, '水': 0.3 },
  '金': { '木': 0.3, '火': 0.5, '土': 1.2, '金': 1.0, '水': 0.8 },
  '水': { '木': 0.8, '火': 0.3, '土': 0.5, '金': 1.2, '水': 1.0 },
};

// Stem (天干) interactions
const STEM_INTERACTIONS: Record<string, Record<string, number>> = {
  '甲': { '甲': 1.0, '乙': 0.9, '丙': 1.2, '丁': 1.1, '戊': 0.8, '己': 0.7, '庚': 0.5, '辛': 0.4, '壬': 1.1, '癸': 1.0 },
  '乙': { '甲': 0.9, '乙': 1.0, '丙': 1.1, '丁': 1.2, '戊': 0.7, '己': 0.8, '庚': 0.4, '辛': 0.5, '壬': 1.0, '癸': 1.1 },
  '丙': { '甲': 1.1, '乙': 0.8, '丙': 1.0, '丁': 0.9, '戊': 1.2, '己': 1.0, '庚': 0.6, '辛': 0.5, '壬': 0.7, '癸': 0.8 },
  '丁': { '甲': 1.0, '乙': 1.1, '丙': 0.9, '丁': 1.0, '戊': 1.0, '己': 1.2, '庚': 0.5, '辛': 0.6, '壬': 0.8, '癸': 0.7 },
  '戊': { '甲': 0.7, '乙': 1.2, '丙': 0.8, '丁': 0.9, '戊': 1.0, '己': 0.9, '庚': 1.1, '辛': 1.0, '壬': 0.5, '癸': 0.6 },
  '己': { '甲': 0.8, '乙': 0.7, '丙': 1.0, '丁': 1.2, '戊': 0.9, '己': 1.0, '庚': 1.0, '辛': 1.1, '壬': 0.6, '癸': 0.5 },
  '庚': { '甲': 0.5, '乙': 1.0, '丙': 0.6, '丁': 0.7, '戊': 0.8, '己': 0.9, '庚': 1.0, '辛': 0.9, '壬': 1.2, '癸': 1.1 },
  '辛': { '甲': 0.6, '乙': 0.5, '丙': 0.7, '丁': 0.6, '戊': 0.9, '己': 0.8, '庚': 0.9, '辛': 1.0, '壬': 1.1, '癸': 1.2 },
  '壬': { '甲': 1.0, '乙': 0.8, '丙': 1.1, '丁': 1.0, '戊': 0.6, '己': 0.7, '庚': 0.8, '辛': 1.2, '壬': 1.0, '癸': 0.9 },
  '癸': { '甲': 1.1, '乙': 1.0, '丙': 1.0, '丁': 1.1, '戊': 0.7, '己': 0.6, '庚': 1.2, '辛': 0.8, '壬': 0.9, '癸': 1.0 },
};

function getElement(stemOrBranch: string): string {
  const elements: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
    '庚': '金', '辛': '金', '壬': '水', '癸': '水',
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
  };
  return elements[stemOrBranch[0]] || '土';
}

function getDayMasterElement(dayMaster: string): string {
  return DAY_MASTER_ELEMENT[dayMaster[0]] || '土';
}

function getTenGodKey(stem: string, dayMaster: string): string {
  // 十神映射：比劫、食傷、財星、官殺、印星
  const dayElement = getDayMasterElement(dayMaster);
  const stemElement = getElement(stem);
  
  // 同我者為比劫
  if (stemElement === dayElement) {
    return stem === dayMaster ? '比' : '劫';
  }
  
  // 我生者為食傷
  const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  if (sheng[dayElement] === stemElement) {
    return stem === '丙' || stem === '丁' ? '食' : '傷';
  }
  
  // 我剋者為財星
  const ke: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  if (ke[dayElement] === stemElement) {
    return stem === '戊' || stem === '己' ? '財' : '才';
  }
  
  // 剋我者為官殺
  const beiKe: Record<string, string> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };
  if (beiKe[dayElement] === stemElement) {
    return stem === '庚' || stem === '辛' ? '官' : '殺';
  }
  
  // 生我者為印星
  const shengWo: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
  if (shengWo[dayElement] === stemElement) {
    return stem === '壬' || stem === '癸' ? '印' : '梟';
  }
  
  return '其他';
}

function extractStems(pillar: string): { yearStem: string; monthStem: string; dayStem: string; hourStem: string } {
  return {
    yearStem: pillar[0] || '',
    monthStem: pillar[1] || '',
    dayStem: pillar[2] || '',
    hourStem: pillar[3] || '',
  };
}

export function calculateScores(
  bazi: BaZiData,
  formulas: Record<string, FormulaConfig>,
  yearly: Record<string, YearlyConfig>,
  monthly: Record<string, MonthlyConfig>,
  currentYear: number = new Date().getFullYear(),
  currentMonth: number = new Date().getMonth() + 1
): ScoringResult {
  const dayMaster = bazi.dayMaster || bazi.dayPillar?.[0] || '戊';
  const dayElement = getDayMasterElement(dayMaster);
  
  // Get current year/month configs
  const yearKey = String(currentYear);
  const yearData = yearly[yearKey] || { wealth: 60, career: 60, love: 60, vitality: 60 };
  
  // Map month number to zodiac
  const zodiacMap: Record<number, string> = {
    1: '摩羯', 2: '水瓶', 3: '雙魚', 4: '牡羊', 5: '金牛', 6: '雙子',
    7: '巨蟹', 8: '獅子', 9: '處女', 10: '天秤', 11: '射手', 12: '摩羯'
  };
  const currentZodiac = zodiacMap[currentMonth] || '牡羊';
  const monthData = monthly[currentZodiac] || { wealth: 0, career: 0, love: 0, vitality: 0 };
  
  // Calculate element balance for day master
  const fiveElements = bazi.fiveElements || {};
  const wood = fiveElements['木'] || 0;
  const fire = fiveElements['火'] || 0;
  const earth = fiveElements['土'] || 0;
  const metal = fiveElements['金'] || 0;
  const water = fiveElements['水'] || 0;
  
  const elementBalance = ELEMENT_STRENGTH[dayElement] || {};
  const woodRatio = wood / 10;
  const fireRatio = fire / 10;
  const earthRatio = earth / 10;
  const metalRatio = metal / 10;
  const waterRatio = water / 10;
  
  // Calculate stem interactions (year stem vs day master)
  const yearStem = bazi.yearPillar?.[0] || '甲';
  const monthStem = bazi.monthPillar?.[1] || '甲';
  const yearStemSupport = STEM_INTERACTIONS[dayMaster]?.[yearStem] || 1.0;
  const monthStemRelation = STEM_INTERACTIONS[dayMaster]?.[monthStem] || 1.0;
  
  // Ten Gods analysis
  const tenGods = bazi.tenGods || {};
  const hasPositiveGod = tenGods['官'] || tenGods['殺'] || tenGods['印'] || tenGods['比'] ? 1 : 0;
  const hasNegativeGod = tenGods['傷'] || tenGods['劫'] || tenGods['梟'] ? -1 : 0;
  
  // Calculate wealth score
  const wealthFormula = formulas['wealth'];
  let wealth = wealthFormula?.base || 60;
  const wealthFactors: string[] = [];
  
  if (wealthFormula?.factors) {
    if (wealthFormula.factors.yearStemSupport) {
      const bonus = yearStemSupport * wealthFormula.factors.yearStemSupport.weight;
      wealth += bonus;
      wealthFactors.push(`${yearStem}年干×${yearStemSupport.toFixed(1)}`);
    }
    if (wealthFormula.factors.yearBranchYinYang) {
      const bonus = hasPositiveGod * wealthFormula.factors.yearBranchYinYang.weight;
      wealth += bonus;
      wealthFactors.push(`十神配置×${hasPositiveGod}`);
    }
    if (wealthFormula.factors.monthStemWealth) {
      const bonus = monthStemRelation * wealthFormula.factors.monthStemWealth.weight;
      wealth += bonus;
      wealthFactors.push(`月干關係×${monthStemRelation.toFixed(1)}`);
    }
    if (wealthFormula.factors.yearStemEnergy) {
      const bonus = yearData.wealth * (wealthFormula.factors.yearStemEnergy.weight / 10);
      wealth += bonus;
      wealthFactors.push(`${currentYear}流年`);
    }
    if (wealthFormula.factors.daYunCycle) {
      const cycleBonus = Math.sin(currentYear / 10) * wealthFormula.factors.daYunCycle.weight;
      wealth += cycleBonus;
      wealthFactors.push(`大運周期`);
    }
  }
  wealth += monthData.wealth;
  wealthFactors.push(`${currentZodiac}月`);
  
  // Calculate career score
  const careerFormula = formulas['career'];
  let career = careerFormula?.base || 60;
  const careerFactors: string[] = [];
  
  if (careerFormula?.factors) {
    if (careerFormula.factors.monthStemOfficial) {
      const bonus = monthStemRelation * careerFormula.factors.monthStemOfficial.weight;
      career += bonus;
      careerFactors.push(`月柱配置×${monthStemRelation.toFixed(1)}`);
    }
    if (careerFormula.factors.saturnCycle) {
      const saturnBonus = Math.sin(currentYear / 29 * Math.PI) * careerFormula.factors.saturnCycle.weight;
      career += saturnBonus;
      careerFactors.push(`土星周期`);
    }
    if (careerFormula.factors.yearOfficial) {
      const bonus = yearData.career * (careerFormula.factors.yearOfficial.weight / 10);
      career += bonus;
      careerFactors.push(`${currentYear}流年`);
    }
  }
  career += monthData.career;
  careerFactors.push(`${currentZodiac}月`);
  
  // Calculate love score
  const loveFormula = formulas['love'];
  let love = loveFormula?.base || 55;
  const loveFactors: string[] = [];
  
  if (loveFormula?.factors) {
    if (loveFormula.factors.venusCycle) {
      const venusBonus = Math.sin(currentMonth / 1 * Math.PI) * loveFormula.factors.venusCycle.weight;
      love += venusBonus;
      loveFactors.push(`金星相位`);
    }
    if (loveFormula.factors.moonPhase) {
      const moonBonus = Math.sin(currentMonth / 4 * Math.PI) * loveFormula.factors.moonPhase.weight;
      love += moonBonus;
      loveFactors.push(`月亮相位`);
    }
    if (loveFormula.factors.yearPeachBlossom) {
      const bonus = yearData.love * (loveFormula.factors.yearPeachBlossom.weight / 10);
      love += bonus;
      loveFactors.push(`${currentYear}流年桃花`);
    }
  }
  love += monthData.love;
  loveFactors.push(`${currentZodiac}月`);
  
  // Calculate vitality score
  const vitalityFormula = formulas['vitality'];
  let vitality = vitalityFormula?.base || 60;
  const vitalityFactors: string[] = [];
  
  if (vitalityFormula?.factors) {
    if (vitalityFormula.factors.hourPillar) {
      const hourElement = getElement(bazi.hourPillar?.[1] || '子');
      const hourBonus = (ELEMENT_STRENGTH[dayElement]?.[hourElement] || 1) * vitalityFormula.factors.hourPillar.weight;
      vitality += hourBonus;
      vitalityFactors.push(`時柱${hourElement}元素`);
    }
    if (vitalityFormula.factors.uranusCycle) {
      const uranusBonus = Math.sin(currentYear / 7 * Math.PI) * vitalityFormula.factors.uranusCycle.weight;
      vitality += uranusBonus;
      vitalityFactors.push(`天王星周期`);
    }
    if (vitalityFormula.factors.healthYear) {
      const bonus = yearData.vitality * (vitalityFormula.factors.healthYear.weight / 10);
      vitality += bonus;
      vitalityFactors.push(`${currentYear}健康流年`);
    }
  }
  vitality += monthData.vitality;
  vitalityFactors.push(`${currentZodiac}月`);
  
  // Clamp values to reasonable range
  wealth = Math.max(0, Math.min(100, Math.round(wealth)));
  career = Math.max(0, Math.min(100, Math.round(career)));
  love = Math.max(0, Math.min(100, Math.round(love)));
  vitality = Math.max(0, Math.min(100, Math.round(vitality)));
  
  return {
    wealth,
    career,
    love,
    vitality,
    wealthFactors,
    careerFactors,
    loveFactors,
    vitalityFactors,
  };
}

// Calculate K-line data based on yearly cycles
export function calculateKLineData(
  yearly: Record<string, YearlyConfig>,
  startYear: number = 2020,
  endYear: number = 2030
): Array<{ year: number; open: number; close: number; high: number; low: number; element: string }> {
  const data: Array<{ year: number; open: number; close: number; high: number; low: number; element: string }> = [];
  
  for (let year = startYear; year <= endYear; year++) {
    const yearKey = String(year);
    const config = yearly[yearKey] || { wealth: 60, career: 60, love: 60, vitality: 60, element: '土' };
    
    // Average of four dimensions as "energy price"
    const avgScore = (config.wealth + config.career + config.love + config.vitality) / 4;
    
    // Open = previous year's close (or 60 for first year)
    const prevYearKey = String(year - 1);
    const prevConfig = yearly[prevYearKey];
    const open = prevConfig 
      ? Math.round((prevConfig.wealth + prevConfig.career + prevConfig.love + prevConfig.vitality) / 4)
      : 60;
    
    const high = Math.round(Math.max(open, avgScore) * 1.05);
    const low = Math.round(Math.min(open, avgScore) * 0.95);
    const close = Math.round(avgScore);
    
    data.push({ year, open, close, high, low, element: config.element || '土' });
  }
  
  return data;
}

// Calculate MA (Moving Average) from K-line data
export function calculateMA(
  klineData: Array<{ year: number; close: number }>,
  ma5Years: number[] = [5, 10]
): Record<number, number> {
  const ma: Record<number, number> = {};
  
  for (const period of ma5Years) {
    if (klineData.length >= period) {
      const slice = klineData.slice(-period);
      const avg = slice.reduce((sum, d) => sum + d.close, 0) / period;
      ma[period] = Math.round(avg);
    }
  }
  
  return ma;
}
