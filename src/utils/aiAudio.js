/**
 * AI Audio utilities for playing base64 audio from AI responses
 * Handles flexible audio_base64 extraction and playback
 */

let currentAudioInstance = null;

/**
 * Extract audio_base64 from AI response payload (flexible location)
 * @param {object} aiPayload - AI response payload
 * @returns {string|null} - Base64 audio string or null
 */
export function extractAudioBase64(aiPayload) {
  if (!aiPayload || typeof aiPayload !== 'object') {
    return null;
  }

  // Priority order for extraction
  const paths = [
    // Direct root level
    () => aiPayload.audio_base64,
    // Nested in data
    () => aiPayload.data?.audio_base64,
    // Question audio
    () => aiPayload.question?.audio_base64,
    () => aiPayload.next_question?.audio_base64,
    // Evaluation audio
    () => aiPayload.evaluation?.audio_base64,
    // Nested audio objects
    () => aiPayload.evaluation?.audio?.audio_base64,
    () => aiPayload.question?.audio?.audio_base64,
    () => aiPayload.next_question?.audio?.audio_base64,
  ];

  for (const getPath of paths) {
    try {
      const value = getPath();
      if (value && typeof value === 'string' && value.trim().length > 0) {
        // Ignore if it's an object/array (not a string)
        if (typeof value === 'string') {
          const path = getPath.toString().match(/aiPayload\.([\w.]+)/)?.[1] || 'root';
          console.log(`[AI VOICE] found audio_base64 at ${path}`);
          return value;
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }

  return null;
}

/**
 * Convert base64 audio string to Blob URL
 * @param {string} audioBase64 - Base64 audio string (with or without data URL prefix)
 * @returns {{url: string, mime: string}} - Blob URL and MIME type
 */
export function base64ToBlobUrl(audioBase64) {
  if (!audioBase64 || typeof audioBase64 !== 'string') {
    throw new Error('Invalid audioBase64: must be a non-empty string');
  }

  let base64Data = audioBase64.trim();
  let mime = 'audio/mpeg'; // Default MIME type

  // Check if it's a data URL (data:audio/xxx;base64,...)
  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mime = match[1] || 'audio/mpeg';
      base64Data = match[2];
    } else {
      // Try to extract just the base64 part
      const base64Match = base64Data.match(/base64,(.+)$/);
      if (base64Match) {
        base64Data = base64Match[1];
      }
    }
  }

  // Decode base64 to Uint8Array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create Blob and URL
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);

  return { url, mime };
}

/**
 * Play audio from base64 string
 * @param {string} audioBase64 - Base64 audio string
 * @param {object} opts - Options
 * @param {function} opts.onStart - Callback when audio starts
 * @param {function} opts.onEnd - Callback when audio ends
 * @param {function} opts.onError - Callback when audio errors
 * @returns {Promise<void>} - Resolves when audio ends, rejects on error
 */
export function playAudioBase64(audioBase64, opts = {}) {
  return new Promise((resolve, reject) => {
    if (!audioBase64 || typeof audioBase64 !== 'string' || audioBase64.trim().length === 0) {
      const error = new Error('Invalid audioBase64: must be a non-empty string');
      if (opts.onError) opts.onError(error);
      reject(error);
      return;
    }

    // Stop any currently playing audio (prevent overlap)
    if (currentAudioInstance) {
      try {
        currentAudioInstance.pause();
        currentAudioInstance.currentTime = 0;
        if (currentAudioInstance.src && currentAudioInstance.src.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudioInstance.src);
        }
      } catch (e) {
        console.warn('[AI VOICE] Error stopping previous audio:', e);
      }
      currentAudioInstance = null;
    }

    try {
      // Convert base64 to Blob URL
      const { url, mime } = base64ToBlobUrl(audioBase64);
      const audioLength = audioBase64.length;
      console.log(`[AI VOICE] playing audio (mime=${mime}, len=${audioLength})`);

      // Create Audio instance
      const audio = new Audio(url);
      currentAudioInstance = audio;

      // Attach event handlers
      audio.onplay = () => {
        if (opts.onStart) opts.onStart();
      };

      audio.onended = () => {
        // Cleanup
        URL.revokeObjectURL(url);
        currentAudioInstance = null;
        if (opts.onEnd) opts.onEnd();
        resolve();
      };

      audio.onerror = (error) => {
        // Cleanup
        URL.revokeObjectURL(url);
        currentAudioInstance = null;
        const err = new Error(`Audio playback error: ${error.message || 'Unknown error'}`);
        console.error('[AI VOICE] Audio playback error:', err);
        if (opts.onError) opts.onError(err);
        reject(err);
      };

      // Play audio
      audio.play().catch((playError) => {
        // Cleanup on play failure
        URL.revokeObjectURL(url);
        currentAudioInstance = null;
        const err = new Error(`Audio play failed: ${playError.message || 'Unknown error'}`);
        console.error('[AI VOICE] Audio play failed:', err);
        if (opts.onError) opts.onError(err);
        reject(err);
      });
    } catch (error) {
      const err = new Error(`Failed to process audio: ${error.message || 'Unknown error'}`);
      console.error('[AI VOICE] Failed to process audio:', err);
      if (opts.onError) opts.onError(err);
      reject(err);
    }
  });
}

/**
 * Stop any currently playing audio
 */
export function stopAudioBase64() {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
      if (currentAudioInstance.src && currentAudioInstance.src.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudioInstance.src);
      }
    } catch (e) {
      console.warn('[AI VOICE] Error stopping audio:', e);
    }
    currentAudioInstance = null;
  }
}
