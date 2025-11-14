import KoreanLunarCalendar from 'korean-lunar-calendar';

export interface CustomEvent {
  name: string;
  description: string;
  startYear?: number;
  type: 'BOT_MILESTONE' | 'CREATOR_EVENT' | 'MAJOR_HOLIDAY';
  calendar: 'gregorian' | 'lunar';
  month: number;
  day: number;
}

export const customEvents: CustomEvent[] = [
  // Gregorian Events
  {
    name: '나날 봇 서비스 시작일',
    description: '나날 봇이 2025년 11월 10일에 서비스를 시작했습니다.',
    startYear: 2025,
    type: 'BOT_MILESTONE',
    calendar: 'gregorian',
    month: 11,
    day: 10,
  },
  {
    name: '창조주 @HaKyung410 님의 생일',
    description: '나날 봇을 만들어주신 창조주 @HaKyung410 님의 생일입니다. 하경은 2002년 4월 10일에 태어난 것으로 알려져 있습니다.',
    startYear: 2002,
    type: 'CREATOR_EVENT',
    calendar: 'gregorian',
    month: 4,
    day: 10,
  },
  {
    name: '새해 첫날',
    description: '새해가 시작되는 첫 날입니다.',
    type: 'MAJOR_HOLIDAY',
    calendar: 'gregorian',
    month: 1,
    day: 1,
  },
  {
    name: '어린이날',
    description: '어린이의 인격을 소중히 여기고, 그들의 행복을 도모하기 위해 제정된 기념일입니다.',
    startYear: 1923,
    type: 'MAJOR_HOLIDAY',
    calendar: 'gregorian',
    month: 5,
    day: 5,
  },
  // Lunar Events
  {
    name: '설날',
    description: '음력 새해의 첫 날, 한국의 가장 큰 명절 중 하나입니다.',
    type: 'MAJOR_HOLIDAY',
    calendar: 'lunar',
    month: 1,
    day: 1,
  },
  {
    name: '추석',
    description: '한가위라고도 불리며, 풍요로운 수확에 감사하는 한국의 주요 명절입니다.',
    type: 'MAJOR_HOLIDAY',
    calendar: 'lunar',
    month: 8,
    day: 15,
  },
  {
    name: '정월대보름',
    description: '새해 첫 보름달이 뜨는 날로, 오곡밥과 나물을 먹으며 한 해의 건강과 풍요를 기원합니다.',
    type: 'MAJOR_HOLIDAY',
    calendar: 'lunar',
    month: 1,
    day: 15,
  }
];

export const getEventsForDate = (date: Date): CustomEvent[] => {
  const calendar = new KoreanLunarCalendar();
  calendar.setSolarDate(date.getFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

  const solarCalendar = calendar.getSolarCalendar();
  const lunarCalendar = calendar.getLunarCalendar();

  const solarMonth = solarCalendar.month;
  const solarDay = solarCalendar.day;
  const lunarMonth = lunarCalendar.month;
  const lunarDay = lunarCalendar.day;

  return customEvents.filter(event => {
    if (event.calendar === 'gregorian') {
      return event.month === solarMonth && event.day === solarDay;
    }
    if (event.calendar === 'lunar') {
      return event.month === lunarMonth && event.day === lunarDay;
    }
    return false;
  });
};
