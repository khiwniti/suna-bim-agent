/**
 * LLM Configuration for BIM Agent
 *
 * Supports multiple providers via LiteLLM-compatible interface:
 * - GitHub Models (free via GitHub Marketplace)
 * - Anthropic (Claude)
 * - OpenAI (GPT)
 * - Ollama (Local/Self-hosted)
 */

import { ChatOpenAI } from '@langchain/openai';

/**
 * LLM Configuration Options
 */
export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

/**
 * LLM Provider types
 */
type LLMProvider = 'github' | 'anthropic' | 'openai' | 'ollama' | 'litellm';

/**
 * Get LLM provider configuration from environment
 */
function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'github';
  const validProviders: LLMProvider[] = ['github', 'anthropic', 'openai', 'ollama', 'litellm'];
  if (validProviders.includes(provider as LLMProvider)) {
    return provider as LLMProvider;
  }
  return 'github';
}

/**
 * Create LLM instance based on provider configuration
 *
 * Environment variables:
 * - LLM_PROVIDER: 'github' | 'anthropic' | 'openai' | 'ollama' | 'litellm'
 * - GITHUB_API_KEY: GitHub personal access token
 * - LITELLM_BASE_URL: LiteLLM proxy URL (optional)
 * - GITHUB_CHAT_MODEL: Chat model name (default: Phi-4)
 * - GITHUB_VISION_MODEL: Vision model name (default: Llama-3.2-11B-Vision-Instruct)
 */
export function createLLM(config: LLMConfig = {}): ChatOpenAI {
  const provider = getLLMProvider();

  // GitHub Models via LiteLLM or direct
  if (provider === 'github' || provider === 'litellm') {
    const baseUrl = process.env.LITELLM_BASE_URL || 'https://models.inference.ai.azure.com';
    const apiKey = process.env.GITHUB_API_KEY || process.env.GITHUB_TOKEN || '';
    const modelName = config.model || process.env.GITHUB_CHAT_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('GITHUB_API_KEY environment variable is required for GitHub provider');
    }

    return new ChatOpenAI({
      modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      configuration: {
        baseURL: baseUrl,
        apiKey,
      },
    });
  }

  // Ollama (local)
  if (provider === 'ollama') {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const modelName = config.model || process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:3b';

    return new ChatOpenAI({
      modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      configuration: {
        baseURL: `${baseUrl}/v1`,
        apiKey: 'ollama',
      },
    });
  }

  // Anthropic via OpenAI-compatible proxy
  if (provider === 'anthropic') {
    const baseUrl = process.env.ANTHROPIC_BASE_URL;
    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || 'dummy';
    const modelName = config.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

    if (!baseUrl) {
      throw new Error('ANTHROPIC_BASE_URL environment variable is required for anthropic provider');
    }

    return new ChatOpenAI({
      modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      configuration: {
        baseURL: baseUrl,
        apiKey,
        defaultHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    });
  }

  // OpenAI
  const apiKey = process.env.OPENAI_API_KEY || '';
  const modelName = config.model || 'gpt-4o-mini';

  return new ChatOpenAI({
    modelName,
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 4096,
    streaming: config.streaming ?? true,
    openAIApiKey: apiKey,
  });
}

/**
 * Create a fast LLM for simple tasks
 */
export function createFastLLM(config: LLMConfig = {}): ChatOpenAI {
  const provider = getLLMProvider();

  // For GitHub, Phi-4 is already fast
  if (provider === 'github' || provider === 'litellm') {
    return createLLM({
      ...config,
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 1024,
    });
  }

  return createLLM({
    ...config,
    temperature: 0.3,
    maxTokens: 1024,
  });
}

/**
 * Create a powerful LLM for complex reasoning
 */
export function createReasoningLLM(config: LLMConfig = {}): ChatOpenAI {
  const provider = getLLMProvider();

  // For GitHub, use gpt-4o for complex reasoning (most reliable)
  if (provider === 'github' || provider === 'litellm') {
    return createLLM({
      ...config,
      model: 'gpt-4o',
      temperature: 0.1,
      maxTokens: 8192,
    });
  }

  return createLLM({
    ...config,
    temperature: 0.1,
    maxTokens: 8192,
  });
}

/**
 * Create a vision-capable LLM for image analysis
 */
export function createVisionLLM(config: LLMConfig = {}): ChatOpenAI {
  const provider = getLLMProvider();

  // GitHub has vision-capable models (GPT-4o)
  if (provider === 'github' || provider === 'litellm') {
    const modelName = config.model || process.env.GITHUB_VISION_MODEL || 'gpt-4o';
    return createLLM({
      ...config,
      model: modelName,
      temperature: 0.3,
      maxTokens: 4096,
    });
  }

  // Ollama vision model
  if (provider === 'ollama') {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const modelName = config.model || process.env.OLLAMA_VISION_MODEL || 'moondream:1.8b';

    return new ChatOpenAI({
      modelName,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      configuration: {
        baseURL: `${baseUrl}/v1`,
        apiKey: 'ollama',
      },
    });
  }

  // For cloud providers, use vision-capable models
  return createLLM({
    ...config,
    model: 'gpt-4o',
    temperature: 0.3,
  });
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const provider = getLLMProvider();

  if ((provider === 'github' || provider === 'litellm') && !process.env.GITHUB_API_KEY && !process.env.GITHUB_TOKEN) {
    errors.push('Missing GITHUB_API_KEY or GITHUB_TOKEN for GitHub provider');
  }

  if (provider === 'anthropic' && !process.env.ANTHROPIC_BASE_URL) {
    errors.push('Missing ANTHROPIC_BASE_URL for anthropic provider');
  }

  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    errors.push('Missing OPENAI_API_KEY for openai provider');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
