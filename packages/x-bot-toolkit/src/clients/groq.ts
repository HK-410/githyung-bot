import Groq from 'groq-sdk';

// Use TypeScript's Parameters utility to robustly get the type for the create method's parameters
type GroqCompletionCreateParams = Parameters<Groq['chat']['completions']['create']>[0];

/**
 * A generic interface for the data structure expected from the LLM.
 */
export interface LlmResponse {
  [key: string]: any;
}

/**
 * A client for interacting with the Groq API.
 */
export class GroqClient {
  private groq: Groq;

  /**
   * Creates an instance of GroqClient.
   * @param apiKey The Groq API key.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Groq API key is required.');
    }
    this.groq = new Groq({ apiKey });
  }

  /**
   * Generates a response from the Groq API using a provided model.
   * @param systemPrompt The system prompt defining the AI's role and rules.
   * @param userPrompt The user prompt containing the specific request.
   * @param model The LLM model to use for the generation.
   * @param responseFormat The desired response format.
   * @returns A promise that resolves to the parsed JSON object or a string.
   */
  async generateResponse<T extends LlmResponse>(
    systemPrompt: string, 
    userPrompt: string,
    model: string = 'openai/gpt-oss-120b',
    responseFormat?: GroqCompletionCreateParams['response_format']
  ): Promise<T | string> {
    console.log(`Generating content with Groq API using model: ${model}...`);

    const completionParams: GroqCompletionCreateParams = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: model,
      temperature: 0.75,
      stream: false,
    };

    if (responseFormat) {
      completionParams.response_format = responseFormat;
    }

    const chatCompletion = await this.groq.chat.completions.create(completionParams) as Groq.Chat.ChatCompletion;
    const generatedContent = chatCompletion.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('Groq API did not return any content.');
    }

    if (responseFormat?.type === 'json_object' || responseFormat?.type === 'json_schema') {
      try {
        const parsedJson = JSON.parse(generatedContent);
        return parsedJson as T;
      } catch (e: any) {
        console.error('Failed to parse LLM JSON response:', e.message);
        console.error('Raw LLM output:', generatedContent);
        throw new Error('LLM did not return a valid JSON object as requested.');
      }
    }

    return generatedContent;
  }
}
