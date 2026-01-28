/**
 * TTS (Text-to-Speech) utilities for Vietnamese voice on Windows
 * Uses Web Speech API with forced vi-VN language and voice selection
 */

let currentUtterance = null;
let voicesCache = null;

/**
 * Ensure voices are loaded from the browser
 * @param {number} timeoutMs - Maximum time to wait for voices (default 2500ms)
 * @returns {Promise<SpeechSynthesisVoice[]>} Array of available voices
 */
export async function ensureVoicesLoaded(timeoutMs = 2500) {
  // If already cached, return immediately
  if (voicesCache && voicesCache.length > 0) {
    return voicesCache;
  }

  // Try to get voices immediately
  let voices = window.speechSynthesis.getVoices();
  
  if (voices && voices.length > 0) {
    voicesCache = voices;
    console.log(`[TTS] Voices loaded immediately: ${voices.length}`);
    return voices;
  }

  // If empty, wait for voiceschanged event or poll
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;

    const checkVoices = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        voicesCache = voices;
        console.log(`[TTS] Voices loaded: ${voices.length}`);
        resolved = true;
        resolve(voices);
        return;
      }

      // Check timeout
      if (Date.now() - startTime >= timeoutMs) {
        console.warn(`[TTS] Voices load timeout after ${timeoutMs}ms. Using empty array.`);
        voicesCache = [];
        resolved = true;
        resolve([]);
        return;
      }

      // Continue polling
      setTimeout(checkVoices, 100);
    };

    // Listen for voiceschanged event (one-time)
    const onVoicesChanged = () => {
      if (resolved) return;
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      checkVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Start polling immediately
    checkVoices();
  });
}

/**
 * Pick Vietnamese voice, preferring male if available
 * @param {boolean} preferMale - Whether to prefer male voice (default true)
 * @returns {Promise<SpeechSynthesisVoice|null>} Selected Vietnamese voice or null
 */
export async function pickVietnameseVoice(preferMale = true) {
  const voices = await ensureVoicesLoaded();

  // Log all voices for debugging (dev only)
  if (process.env.NODE_ENV === 'development') {
    console.log('[TTS] All available voices:');
    voices.forEach((voice, idx) => {
      console.log(`  [${idx}] ${voice.name} | ${voice.lang} | ${voice.localService ? 'local' : 'remote'}`);
    });
  }

  // Filter Vietnamese voices
  const vietnameseVoices = voices.filter((voice) => {
    const lang = (voice.lang || '').toLowerCase();
    const name = (voice.name || '').toLowerCase();

    // Check language: vi, vi-vn, vi-VN, etc.
    const isVietnameseLang = lang.startsWith('vi') || lang.includes('vi-vn');

    // Check name: vietnam, tiếng việt, vietnamese
    const isVietnameseName =
      name.includes('vietnam') ||
      name.includes('tiếng việt') ||
      name.includes('vietnamese');

    return isVietnameseLang || isVietnameseName;
  });

  if (vietnameseVoices.length === 0) {
    console.error(
      '[TTS] No vi-VN voice visible to Chrome. ' +
      'Suggest restart Chrome and check chrome://settings/languages and Windows Speech voices.'
    );
    return null;
  }

  console.log(`[TTS] Found ${vietnameseVoices.length} Vietnamese voice(s):`);
  vietnameseVoices.forEach((voice, idx) => {
    console.log(`  [${idx}] ${voice.name} | ${voice.lang}`);
  });

  // If preferMale, score voices (higher score = better match)
  if (preferMale) {
    const scoredVoices = vietnameseVoices.map((voice) => {
      const name = (voice.name || '').toLowerCase();
      let score = 0;

      // Prefer male voices
      if (name.includes('male') || name.includes('nam') || name.includes('man')) {
        score += 10;
      }

      // Prefer local voices (usually better quality)
      if (voice.localService) {
        score += 5;
      }

      // Prefer vi-VN over vi (more specific)
      const lang = (voice.lang || '').toLowerCase();
      if (lang === 'vi-vn' || lang === 'vi-vn-x-vietnam') {
        score += 3;
      }

      return { voice, score };
    });

    // Sort by score (descending) and return best match
    scoredVoices.sort((a, b) => b.score - a.score);
    const bestVoice = scoredVoices[0].voice;
    console.log(`[TTS] Selected Vietnamese voice: ${bestVoice.name} | ${bestVoice.lang} (score: ${scoredVoices[0].score})`);
    return bestVoice;
  }

  // If not preferMale, just return first Vietnamese voice
  const selectedVoice = vietnameseVoices[0];
  console.log(`[TTS] Selected Vietnamese voice: ${selectedVoice.name} | ${selectedVoice.lang}`);
  return selectedVoice;
}

/**
 * Speak text in Vietnamese using Web Speech API
 * @param {string} text - Text to speak
 * @param {object} opts - Options
 * @param {number} opts.rate - Speech rate (0.1-10, default 1)
 * @param {number} opts.pitch - Speech pitch (0-2, default 1)
 * @param {number} opts.volume - Speech volume (0-1, default 1)
 * @param {function} opts.onStart - Callback when speech starts
 * @param {function} opts.onEnd - Callback when speech ends
 * @param {function} opts.onError - Callback when speech errors
 * @param {function} opts.onBoundary - Callback for word boundaries (for highlighting)
 * @returns {Promise<void>}
 */
export async function speakTextVi(text, opts = {}) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.warn('[TTS] speakTextVi: Empty text, skipping');
    return;
  }

  // Cancel any ongoing speech
  cancelSpeak();

  // Check if Web Speech API is available
  if (!window.speechSynthesis) {
    console.error('[TTS] Web Speech API not available');
    return;
  }

  try {
    // Pick Vietnamese voice
    const voice = await pickVietnameseVoice(true);

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language (force vi-VN)
    utterance.lang = 'vi-VN';

    // Set voice if available (important: set voice, not just lang)
    if (voice) {
      utterance.voice = voice;
    }

    // Set rate, pitch, volume
    utterance.rate = opts.rate ?? 1;
    utterance.pitch = opts.pitch ?? 1;
    utterance.volume = opts.volume ?? 1;

    // Log voice being used
    console.log(
      `[TTS] Using voice: ${utterance.voice?.name ?? 'default'} | ${utterance.voice?.lang ?? utterance.lang}`
    );

    // Attach event handlers
    if (opts.onStart) {
      utterance.onstart = opts.onStart;
    }
    if (opts.onEnd) {
      utterance.onend = opts.onEnd;
    }
    if (opts.onError) {
      utterance.onerror = opts.onError;
    } else {
      utterance.onerror = (event) => {
        console.error('[TTS] Speech error:', event);
      };
    }
    if (opts.onBoundary) {
      utterance.onboundary = opts.onBoundary;
    }

    // Store current utterance
    currentUtterance = utterance;

    // Speak
    window.speechSynthesis.speak(utterance);
    console.log(`[TTS] Speaking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  } catch (error) {
    console.error('[TTS] speakTextVi error:', error);
  }
}

/**
 * Cancel any ongoing speech
 */
export function cancelSpeak() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    console.log('[TTS] Speech cancelled');
  }
}

/**
 * Unlock TTS via user gesture (required for autoplay restrictions)
 * Must be called from a user interaction handler (button click, etc.)
 */
export function unlockTTS() {
  if (!window.speechSynthesis) {
    console.warn('[TTS] Web Speech API not available');
    return;
  }

  try {
    // Create a silent utterance to unlock TTS
    const utterance = new SpeechSynthesisUtterance('.');
    utterance.volume = 0; // Silent
    utterance.lang = 'vi-VN';

    // Speak and immediately cancel (this unlocks TTS for future calls)
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.cancel();

    console.log('[TTS] Unlocked via user gesture');
  } catch (error) {
    console.error('[TTS] unlockTTS error:', error);
  }
}
