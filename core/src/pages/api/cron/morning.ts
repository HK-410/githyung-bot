import { runGithyungBot } from '@/lib/bots/githyung';
import { createCronJobHandler } from '@/lib/cron-handler';

const BOTS_TO_RUN = [{ name: 'githyung', func: runGithyungBot }];

export default createCronJobHandler(BOTS_TO_RUN, 'morning');
