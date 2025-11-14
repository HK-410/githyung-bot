import { createCronJobHandler } from '@/lib/cron-handler';
import { runNanalBot } from '@/lib/bots/nanal';
import { runWeatherfairyBot } from '@/lib/bots/weatherfairy';

const BOTS_TO_RUN = [
  { name: 'weatherfairy', func: runWeatherfairyBot },
  { name: 'nanal', func: runNanalBot },
];

export default createCronJobHandler(BOTS_TO_RUN, 'midnight');
