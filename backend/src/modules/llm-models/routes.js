import { Router } from 'express';
import { successResponse } from '../../common/utils/response.util.js';

const router = Router();

const DEFAULT_MODELS = [
  { id: '1', modelId: 'gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)', tier: 'free', provider: 'openai', isActive: true },
  { id: '2', modelId: 'gpt-4o', name: 'GPT-4o (OpenAI)', tier: 'free', provider: 'openai', isActive: true },
  { id: '3', modelId: 'gpt-4-turbo', name: 'GPT-4 Turbo (OpenAI)', tier: 'pro', provider: 'openai', isActive: true },
  { id: '4', modelId: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)', tier: 'pro', provider: 'anthropic', isActive: true },
  { id: '5', modelId: 'claude-3-haiku', name: 'Claude 3 Haiku (Anthropic)', tier: 'free', provider: 'anthropic', isActive: true },
];

router.get('/available', (_req, res) => {
  return successResponse(res, DEFAULT_MODELS, 'Available LLM models');
});

router.get('/', (_req, res) => {
  return successResponse(res, DEFAULT_MODELS, 'LLM models');
});

router.patch('/:id', (req, res) => {
  const model = DEFAULT_MODELS.find(m => m.id === req.params.id || m.modelId === req.params.id);
  if (model) {
    Object.assign(model, req.body);
  }
  return successResponse(res, model || req.body, 'LLM model updated');
});

export default router;
