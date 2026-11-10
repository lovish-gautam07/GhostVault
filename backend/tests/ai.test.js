import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  isAiConfigured,
  fallbackChatAnswer,
  chat,
  analyzeVaultMetadata,
  fallbackLetter,
  writeLetter,
  fallbackPasswordTips,
  generateText
} from '../src/services/aiService.js';

const baseMeta = {
  itemCount: 3,
  contactCount: 2,
  itemsWithoutContacts: 0,
  contactsWithoutItems: 0,
  releaseTiers: [30, 90],
  daysSinceCheckin: 1,
  typeCounts: { note: 1, password: 2 }
};

describe('AI Service', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    global.fetch = originalFetch;
  });

  test('reports not configured without a key', () => {
    expect(isAiConfigured()).toBe(false);
  });

  test('generateText refuses to run without a key and never calls the network', async () => {
    global.fetch = jest.fn();
    await expect(generateText({ system: 's', messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED'
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('chat falls back to offline FAQ answers', async () => {
    const res = await chat([{ role: 'user', content: 'How does the dead man switch work?' }]);
    expect(res.source).toBe('offline');
    expect(res.reply).toMatch(/release threshold/i);
  });

  test('fallback chat has a default answer', () => {
    expect(fallbackChatAnswer('banana')).toMatch(/GhostVault/);
  });

  test('sends key in header (not URL) and parses Gemini response', async () => {
    process.env.GEMINI_API_KEY = 'test-key-1234567890';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }] })
    });
    const res = await chat([{ role: 'user', content: 'hi' }]);
    expect(res).toEqual({ reply: 'Hello from Gemini', source: 'ai' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).not.toContain('test-key');
    expect(opts.headers['x-goog-api-key']).toBe('test-key-1234567890');
  });

  test('upstream errors fall back gracefully without leaking details', async () => {
    process.env.GEMINI_API_KEY = 'test-key-1234567890';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await chat([{ role: 'user', content: 'Is my data encrypted?' }]);
    expect(res.source).toBe('offline');
    expect(res.reply).toMatch(/AES-256/);
    expect(spy.mock.calls.flat().join(' ')).not.toContain('test-key');
    spy.mockRestore();
  });

  test('falls back to the next model when the first is busy (503)', async () => {
    process.env.GEMINI_API_KEY = 'test-key-1234567890';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'From fallback' }] } }] })
      });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await chat([{ role: 'user', content: 'hi' }]);
    expect(res).toEqual({ reply: 'From fallback', source: 'ai' });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).not.toBe(global.fetch.mock.calls[1][0]);
    spy.mockRestore();
  });

  test('does not try other models when the key is rejected (403)', async () => {
    process.env.GEMINI_API_KEY = 'test-key-1234567890';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await chat([{ role: 'user', content: 'hi' }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('advisor: healthy setup scores high', () => {
    const r = analyzeVaultMetadata(baseMeta);
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.findings[0].level).toBe('good');
  });

  test('advisor: flags missing contacts and unassigned items', () => {
    const r = analyzeVaultMetadata({ ...baseMeta, contactCount: 0, itemsWithoutContacts: 3 });
    expect(r.score).toBeLessThan(60);
    expect(r.findings.some((f) => f.level === 'critical')).toBe(true);
  });

  test('advisor: warns when check-in is close to the shortest threshold', () => {
    const r = analyzeVaultMetadata({ ...baseMeta, releaseTiers: [7], daysSinceCheckin: 6 });
    expect(r.findings.some((f) => /check in soon/i.test(f.title))).toBe(true);
  });

  test('letter falls back to a template that keeps the draft', async () => {
    const res = await writeLetter({ draft: 'I am proud of you.', recipientName: 'Asha', tone: 'heartfelt' });
    expect(res.source).toBe('offline');
    expect(res.letter).toContain('Dear Asha,');
    expect(res.letter).toContain('I am proud of you.');
    expect(fallbackLetter({ draft: 'x', tone: 'formal' })).toMatch(/With respect/);
  });

  test('password tips flag weak passwords', () => {
    const tips = fallbackPasswordTips({
      length: 6, hasLower: true, hasUpper: false, hasDigit: true, hasSymbol: false,
      isCommon: true, hasSequence: true, hasRepeat: false, hasYear: false, looksLikeWord: false,
      entropyBits: 20, score: 0
    });
    expect(tips.join(' ')).toMatch(/longer/);
    expect(tips.join(' ')).toMatch(/common/);
  });
});
