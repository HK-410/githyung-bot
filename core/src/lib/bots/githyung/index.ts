import KoreanLunarCalendar from 'korean-lunar-calendar';
import { GroqClient, TwitterClient, parseTwitterCredentials } from '@hakyung/x-bot-toolkit';

import { CHEONGAN_DB, PERSONA_DB, getShipshin } from './saju';
import { LlmResponseData, LlmResponseDataSchema, systemPrompt, LlmReply } from './prompts';
import { BotRunResult } from '@/lib/cron-handler'; // Import BotRunResult

interface FinalReply extends LlmReply {
  rank: number;
}

export async function runGithyungBot(isDryRun: boolean): Promise<BotRunResult<FinalReply>> {
  const runIdentifier = Math.random().toString(36).substring(7);
  console.log(`[githyung-${runIdentifier}] Function start. dryRun=${isDryRun}`);

  // 1. Initialize Clients
  const groqClient = new GroqClient(process.env.GROQ_API_KEY as string);
  const twitterClient = new TwitterClient(parseTwitterCredentials(process.env.X_CREDENTIALS_GITHYUNG!));
  console.log(`[githyung-${runIdentifier}] Clients initialized.`);

  // 2. Core Logic
  const kstTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  const kstDate = new Date(kstTime);
  const calendar = new KoreanLunarCalendar();
  calendar.setSolarDate(kstDate.getUTCFullYear(), kstDate.getUTCMonth() + 1, kstDate.getUTCDate());
  const iljin: string = calendar.getKoreanGapja().day;
  const todayCheonganChar: string = iljin.charAt(0);
  const todayCheonganData = CHEONGAN_DB[todayCheonganChar as keyof typeof CHEONGAN_DB];
  const fullDateString = `${kstDate.getUTCFullYear()}년 ${kstDate.getUTCMonth() + 1}월 ${kstDate.getUTCDate()}일`;
  const dayOfWeek = kstDate.toLocaleString('ko-KR', { weekday: 'long' });
  console.log(`[githyung-${runIdentifier}] Target date (KST): ${fullDateString}, Iljin: ${iljin}, Day of Week: ${dayOfWeek}`);

  const shipshinResultsForLLM: string[] = [];
  for (const [personaName, ilganData] of Object.entries(PERSONA_DB)) {
    const shipshin = getShipshin(ilganData, todayCheonganData);
    shipshinResultsForLLM.push(`- ${personaName}은(는) [${shipshin}]입니다.`);
  }
  console.log(`[githyung-${runIdentifier}] Calculated Shipshin for all personas.`);

  const userPrompt = `Today is ${iljin} (${fullDateString}, ${dayOfWeek}).
Today's Iljin (Cheongan) is: '${todayCheonganChar}' (Ohaeng: ${todayCheonganData.ohaeng}).

Here are the calculated Shipshin for each persona:
${shipshinResultsForLLM.join('\n')}

Based on your <Core Mission>, *subjectively analyze* the influence of today's Iljin (${iljin}) on each of these Shipshin.
Rank all 5 personas from 1st to 5th.
Generate the complete JSON response strictly following the <Output Format>.
Ensure the 'details' array is sorted by your rank (1st to 5th).`;

  // 3. Generate content
  console.log(`[githyung-${runIdentifier}] Generating fortune content...`);
  const llmResponse = await groqClient.generateResponse<LlmResponseData>(
    systemPrompt, 
    userPrompt,
    'openai/gpt-oss-120b',
    0.75,
    {
      type: 'json_schema',
      json_schema: {
        name: 'daily_fortune_response',
        description: 'The structured JSON response for the daily IT persona fortune.',
        schema: LlmResponseDataSchema,
        strict: true,
      }
    }
  );

  if (typeof llmResponse === 'string') {
    console.error(`[githyung-${runIdentifier}] LLM returned a string instead of a JSON object:`, llmResponse);
    throw new Error('Invalid response type from LLM. Expected a JSON object.');
  }
  console.log(`[githyung-${runIdentifier}] Successfully generated content.`);

  const llmResponseData = llmResponse;
  const mainTweetContent = `${fullDateString} 오늘의 직무 운세 🔮\n\n${llmResponseData.mainTweetSummary}`;
  const finalReplies: FinalReply[] = llmResponseData.details.map((reply, index) => ({
    ...reply,
    rank: index + 1,
  }));

  // 4. Post to Twitter or log for dry run
  if (!isDryRun) {
    console.log(`[githyung-${runIdentifier}] Posting tweet thread...`);
    const replyContents = finalReplies.map(reply => 
      `[${reply.rank}위: ${reply.persona} (${reply.shipshin} / ${reply.luck_level})]
${reply.explanation}

🍀 행운의 아이템: ${reply.lucky_item}`
    );
    await twitterClient.postThread(mainTweetContent, replyContents);
    console.log(`[githyung-${runIdentifier}] Successfully posted tweet thread.`);
  } else {
    console.log(`[githyung-${runIdentifier}] --- DRY RUN ---`);
    console.log(`[githyung-${runIdentifier}] [Main Tweet] (${twitterClient.calculateBytes(mainTweetContent)} bytes):\n${mainTweetContent}`);
    console.log('---------------------------------');
    
    for (const reply of finalReplies) {
      const replyContent = `[${reply.rank}위: ${reply.persona} (${reply.shipshin} / ${reply.luck_level})]
${reply.explanation}

🍀 행운의 아이템: ${reply.lucky_item}`;
      console.log(`[githyung-${runIdentifier}] [Reply ${reply.rank}] (${twitterClient.calculateBytes(replyContent)} bytes):\n${replyContent}`);
      console.log('---------------------------------');
    }
  }

  return {
    success: true,
    dryRun: isDryRun,
    tweet: mainTweetContent,
    replies: finalReplies,
  };
}
