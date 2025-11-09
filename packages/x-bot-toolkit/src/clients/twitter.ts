import { TwitterApi } from 'twitter-api-v2';
import twitter from 'twitter-text';

const MAX_TWEET_BYTES = 280;

export interface TwitterClientConfig {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

/**
 * A client for interacting with the Twitter API v2.
 */
export class TwitterClient {
  private client: TwitterApi;

  /**
   * Creates an instance of TwitterClient.
   * @param config The configuration object containing API keys and tokens.
   */
  constructor(config: TwitterClientConfig) {
    if (!config.appKey || !config.appSecret || !config.accessToken || !config.accessSecret) {
      throw new Error('Twitter API configuration is incomplete.');
    }
    this.client = new TwitterApi(config);
  }

  /**
   * Posts a main tweet and a thread of replies.
   * @param mainTweetContent The content of the main tweet.
   * @param replies An array of strings for the reply thread.
   */
  async postThread(mainTweetContent: string, replies: string[]): Promise<void> {
    let mainTweetId: string;
    try {
      const mainTweetResult = await this.client.v2.tweet(mainTweetContent);
      mainTweetId = mainTweetResult.data.id;
      console.log(`Main tweet posted: ${mainTweetId}`);
    } catch (e: any) {
      console.error('Failed to post main tweet:', e);
      throw new Error(`Failed to post main tweet: ${e.message}`);
    }

    let lastTweetId = mainTweetId;

    for (const replyContent of replies) {
      try {
        let finalReplyContent = replyContent;

        if (this.calculateBytes(finalReplyContent) > MAX_TWEET_BYTES) {
          console.warn(`Warning: Truncating reply as it exceeds byte limit.`);
          const ellipsis = '...';
          const maxLength = MAX_TWEET_BYTES - this.calculateBytes(ellipsis);
          
          let truncatedText = "";
          let currentLength = 0;
          const chars = Array.from(finalReplyContent);
          for(const char of chars) {
              const charWeight = this.calculateBytes(char);
              if (currentLength + charWeight > maxLength) {
                  break;
              }
              truncatedText += char;
              currentLength += charWeight;
          }
          finalReplyContent = truncatedText + ellipsis;
        }

        const replyResult = await this.client.v2.tweet(finalReplyContent, {
          reply: { in_reply_to_tweet_id: lastTweetId },
        });
        lastTweetId = replyResult.data.id;
        console.log(`Posted reply.`);
        
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (e: any) {
        console.error(`Failed to post a reply:`, e);
      }
    }
    console.log('--- Tweet thread posted successfully ---');
  }

  /**
   * Calculates the weighted length of a tweet.
   * @param text The text of the tweet.
   * @returns The weighted length.
   */
  calculateBytes(text: string): number {
    return twitter.parseTweet(text).weightedLength;
  }
}
