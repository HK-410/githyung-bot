import type { NextApiRequest, NextApiResponse } from 'next';

export interface BotRunResult<T = unknown> {
  success: boolean;
  dryRun: boolean;
  tweet: string;
  error?: string;
  replies?: T[];
}

type Bot = {
  name: string;
  func: (isDryRun: boolean) => Promise<BotRunResult<unknown>>;
};

export function createCronJobHandler(bots: Bot[], jobName: string) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.headers['authorization']?.split(' ')[1] !== process.env.CRON_SECRET) {
      return res.status(401).send('Unauthorized');
    }
    if (req.method !== 'GET') {
      return res.status(405).send('Method Not Allowed');
    }

    const isDryRun = req.query.dryRun === 'true';
    const results: (BotRunResult<unknown> & { bot: string })[] = [];

    for (const bot of bots) {
      try {
        console.log(`[API_CRON_${jobName.toUpperCase()}] Running ${bot.name} bot...`);
        const result = await bot.func(isDryRun);
        results.push({ bot: bot.name, ...result });
        console.log(`[API_CRON_${jobName.toUpperCase()}] Finished ${bot.name} bot.`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`[API_CRON_${jobName.toUpperCase()}] Error executing ${bot.name} bot:`, errorMessage);
        results.push({ bot: bot.name, success: false, dryRun: isDryRun, tweet: '', error: errorMessage });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${jobName} job execution completed.`,
      results,
    });
  };
}
