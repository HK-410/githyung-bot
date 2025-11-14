import axios from 'axios';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
import { GroqClient, TwitterClient, parseTwitterCredentials } from '@hakyung/x-bot-toolkit';
import { getEventsForDate } from './events';
import { systemPrompt } from './prompts';
import { BotRunResult } from '@/lib/cron-handler';

export async function runNanalBot(isDryRun: boolean): Promise<BotRunResult<undefined>> {
  const runIdentifier = Math.random().toString(36).substring(7);
  console.log(`[nanal-${runIdentifier}] Function start. dryRun=${isDryRun}`);

  // 1. Initialize Clients
  const groqClient = new GroqClient(process.env.GROQ_API_KEY!);
  const twitterClient = new TwitterClient(parseTwitterCredentials(process.env.X_CREDENTIALS_NANAL!));
  console.log(`[nanal-${runIdentifier}] Clients initialized.`);

  // 2. Get current date and check for special events
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const year = kstDate.getFullYear();
  const month = kstDate.getUTCMonth() + 1;
  const day = kstDate.getUTCDate();
  const koreanDateString = `${month}월 ${day}일`;
  const apiDateString = koreanDateString.replace(' ', '_');
  const dayOfWeek = kstDate.toLocaleString('ko-KR', { weekday: 'long' });
  console.log(`[nanal-${runIdentifier}] Target date (KST): ${year}년 ${koreanDateString}, Day of Week: ${dayOfWeek}`);

  const todaysSpecialEvents = getEventsForDate(kstDate);

  const formattedSpecialEvents = todaysSpecialEvents.map(event => {
    let eventString = `[${event.name}] ${event.description}`;
    if (event.startYear) {
      const anniversary = year - event.startYear;
      if (anniversary > 0) {
        eventString += ` 올해로 ${anniversary}주년입니다.`;
      }
    }
    return eventString;
  });

  if (formattedSpecialEvents.length > 0) {
    console.log(`[nanal-${runIdentifier}] Special event detected: ${formattedSpecialEvents.join(', ')}`);
  }

  let observances = '';

  // 3. Fetch data from Wikipedia API
  console.log(`[nanal-${runIdentifier}] Attempting to fetch observances from Wikipedia for ${apiDateString}`);
  try {
    const headers = { 
      'User-Agent': 'NaNalBot/1.0 (https://github.com/HK-410/hakyng-bots/tree/main/apps/nanal/; hakyung410+nanal@gmail.com)' 
    };
    const sectionsUrl = `https://ko.wikipedia.org/w/api.php?action=parse&page=${apiDateString}&prop=sections&format=json`;
    const sectionsResponse = await axios.get(sectionsUrl, { headers });
    const sections: Array<{line: string, index: string }> = sectionsResponse.data.parse.sections;
    const holidaySection = sections.find((s: {line: string, index: string}) => s.line === '기념일');

    if (holidaySection) {
      const sectionIndex = Number(holidaySection.index);
      const contentUrl = `https://ko.wikipedia.org/w/api.php?action=parse&page=${apiDateString}&prop=text&section=${sectionIndex}&format=json`;
      const contentResponse = await axios.get(contentUrl, { headers });

      const turndownService = new TurndownService({
        headingStyle: 'atx', // h2 -> ##
        bulletListMarker: '*', // ul/li -> *
        codeBlockStyle: 'fenced', // ```
      });
      
      turndownService.addRule('keepLinkTextOnly', {
        filter: 'a',
        replacement: function (content) {
          return content;
        }
      });

      const $ = cheerio.load(contentResponse.data.parse.text['*']);

      $('.mw-editsection').remove();
      $('.mw-references-wrap').remove();
      $('.mw-ext-cite-error').remove();
      $('.mw-heading').remove();
      $('sup.reference').remove();

      const contentHtml = $('.mw-parser-output').html();
      
      if (contentHtml) {
        observances = turndownService.turndown(contentHtml);
      }
      console.log('result:::', observances);
    }
  } catch (apiError) {
    console.error(`[nanal-${runIdentifier}] Wikipedia API fetch failed:`, apiError);
  }

  const userPrompt = `Today is ${year}년 ${koreanDateString} (${dayOfWeek}).
${formattedSpecialEvents.length > 0 ? `
**Today's Special Events:**
- ${formattedSpecialEvents.join('\n- ')}
` : ''}
Here is the list of observances from Wikipedia:

\
${observances}
\

Follow the instructions to create a tweet.`;

  const tweetContent = await groqClient.generateResponse(
    systemPrompt,
    userPrompt,
    'openai/gpt-oss-120b'
  );

  if (typeof tweetContent !== 'string' || !tweetContent) {
    throw new Error(`[nanal-${runIdentifier}] Failed to generate tweet content.`);
  }
  console.log(`[nanal-${runIdentifier}] Successfully generated tweet content.`);

  // 4. Post to Twitter (or log for dry run)
  if (isDryRun) {
    console.log(`[nanal-${runIdentifier}] --- DRY RUN ---`);
    console.log(`[nanal-${runIdentifier}] Tweet content for ${koreanDateString} (${twitterClient.calculateBytes(tweetContent)} bytes):`);
    console.log(tweetContent);
  } else {
    console.log(`[nanal-${runIdentifier}] Posting tweet...`);
    await twitterClient.postTweet(tweetContent);
    console.log(`[nanal-${runIdentifier}] Successfully posted tweet.`);
  }

  return {
    success: true,
    dryRun: isDryRun,
    tweet: tweetContent,
  };
}
