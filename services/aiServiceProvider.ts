// services/aiServiceProvider.ts
// Removed GoogleGenAI import as OpenRouter is used

export type AIProvider = 'local';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  /**
   * Identifier of the model to be used for generation.
   * Using a union type restricts to supported models and enables autocomplete.
   */
  model: 'nvidia/llama-nemotron-rerank-vl-1b-v2:free' | string;

  /**
   * Controls randomness in the output. Defaults to 0.85 if not provided.
   * Value should be between 0 (deterministic) and 2 (highly random).
   */
  temperature?: number;

  /**
   * Maximum number of tokens to generate. Defaults to 800 when omitted.
   */
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerationResult {
  text: string;
  provider: AIProvider;
  model: string;
}

export interface FilePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export class AIServiceProvider {
  private providers = new Map<AIProvider, AIProviderConfig>();

  constructor() {}

  public addProvider(config: AIProviderConfig): void {
    this.providers.set(config.provider, config);
  }

  public async generateContent(
    provider: AIProvider,
    contents: any[],
    config: Partial<AIProviderConfig> = {}
  ): Promise<GenerationResult> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) throw new Error(`Provider ${provider} not configured`);

    const mergedConfig = { ...providerConfig, ...config };

    if (provider === 'local') {
      return this.generateWithLocal(contents, mergedConfig);
    }
    // No other providers supported; only local (OpenRouter) is used
    throw new Error(`Unsupported provider: ${provider}`);
  }

  private async generateWithLocal(
    contents: any[],
    config: AIProviderConfig
  ): Promise<GenerationResult> {
    const formattedMessages = this.convertToOpenAIFormat(contents, config.systemPrompt);

    // Updated: Use local FastAPI server for LLM calls
    // If an OpenRouter API key is provided, use OpenRouter endpoint instead of local server
    const endpoint = config.apiKey 
      ? 'https://openrouter.ai/api/v1/chat/completions' 
      : 'http://127.0.0.1:8005/v1/chat/completions';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
        },
        body: JSON.stringify({
          model: config.model,
          messages: formattedMessages,
          temperature: config.temperature ?? 0.85,
          max_tokens: config.maxTokens ?? 800,
          // Provider field optional for local server
          provider: {
            allow_fallbacks: false,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Local server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();

      if (!text) throw new Error('Local AI returned empty response');

      return {
        text,
        provider: 'local',
        model: config.model,
      };
    } catch (error) {
      // Provide more helpful error messages for common issues
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (config.apiKey) {
          throw new Error(
            `Failed to connect to OpenRouter API. Please check your API key and internet connection.`
          );
        } else {
          throw new Error(
            `Failed to connect to local AI server at http://127.0.0.1:8005. ` +
            `Please start the local server first: ` +
            `cd services && python local_ai_server.py`
          );
        }
      }
      throw error;
    }
  }

  private convertToOpenAIFormat(contents: any[], systemPrompt?: string): any[] {
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    for (const content of contents) {
      if (typeof content === 'string') {
        messages.push({ role: 'user', content });
      } else if (content?.inlineData) {
        messages.push({
          role: 'user',
          content: 'Here is the artist image reference (Visual attachment provided).'
        });
      }
    }
    return messages;
  }

  public async fileToGenerativePart(file: File): Promise<FilePart> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1];
          resolve({
            inlineData: { data: base64Data, mimeType: file.type }
          });
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}