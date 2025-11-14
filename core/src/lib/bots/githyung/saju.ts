export const CHEONGAN_DB = {
  '갑': { ohaeng: '목', yinYang: 'yang' }, '을': { ohaeng: '목', yinYang: 'yin' },
  '병': { ohaeng: '화', yinYang: 'yang' }, '정': { ohaeng: '화', yinYang: 'yin' },
  '무': { ohaeng: '토', yinYang: 'yang' }, '기': { ohaeng: '토', yinYang: 'yin' },
  '경': { ohaeng: '금', yinYang: 'yang' }, '신': { ohaeng: '금', yinYang: 'yin' },
  '임': { ohaeng: '수', yinYang: 'yang' }, '계': { ohaeng: '수', yinYang: 'yin' },
};

export const PERSONA_DB = {
  '[목(木) PM]': CHEONGAN_DB['갑'], '[화(火) 디자이너]': CHEONGAN_DB['병'],
  '[토(土) 인프라/DBA]': CHEONGAN_DB['무'], '[금(金) 개발자]': CHEONGAN_DB['경'],
  '[수(水) DevOps/SRE]': CHEONGAN_DB['임'],
};

export function getShipshin(ilgan: { ohaeng: string, yinYang: string }, todayCheongan: { ohaeng: string, yinYang: string }): string {
  const OHAENG_REL = {
    '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
    '목_극': '토', '화_극': '금', '토_극': '수', '금_극': '목', '수_극': '화',
    '목_생': '수', '화_생': '목', '토_생': '화', '금_생': '토', '수_생': '금',
    '목_극당': '금', '화_극당': '수', '토_극당': '목', '금_극당': '화', '수_극당': '토',
  };
  const isSameYinYang = ilgan.yinYang === todayCheongan.yinYang;
  if (ilgan.ohaeng === todayCheongan.ohaeng) return isSameYinYang ? '비견' : '겁재';
  if (OHAENG_REL[ilgan.ohaeng as keyof typeof OHAENG_REL] === todayCheongan.ohaeng) return isSameYinYang ? '식신' : '상관';
  if (OHAENG_REL[`${ilgan.ohaeng}_극` as keyof typeof OHAENG_REL] === todayCheongan.ohaeng) return isSameYinYang ? '편재' : '정재';
  if (OHAENG_REL[`${ilgan.ohaeng}_극당` as keyof typeof OHAENG_REL] === todayCheongan.ohaeng) return isSameYinYang ? '편관' : '정관';
  if (OHAENG_REL[`${ilgan.ohaeng}_생` as keyof typeof OHAENG_REL] === todayCheongan.ohaeng) return isSameYinYang ? '편인' : '정인';
  return '계산 불가';
}
