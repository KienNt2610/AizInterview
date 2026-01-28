import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for handling real-time AI transcript streaming
 * 
 * Supports:
 * - Real-time streaming via WebSocket/SSE/callbacks
 * - Fallback: Simulated streaming for full text
 * 
 * @param {Object} options
 * @param {Function} options.onStreamChunk - Callback when new chunk arrives (preferred)
 * @param {string} options.fullText - Full text to simulate streaming (fallback)
 * @param {number} options.simulateSpeed - Characters per interval for simulation (default: 2)
 * @param {number} options.simulateInterval - Interval in ms for simulation (default: 50)
 */
export const useAiTranscriptStreaming = ({
  onStreamChunk = null,
  fullText = '',
  simulateSpeed = 2,
  simulateInterval = 50,
}) => {
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const simulationRef = useRef(null);
  const currentIndexRef = useRef(0);

  // Handle real-time streaming chunks
  const appendChunk = useCallback((chunk) => {
    setLiveTranscript((prev) => {
      const newText = prev + chunk;
      return newText;
    });
  }, []);

  // Simulate streaming for full text (fallback)
  const simulateStreaming = useCallback((text) => {
    if (!text) return;

    setIsStreaming(true);
    setLiveTranscript('');
    currentIndexRef.current = 0;

    simulationRef.current = setInterval(() => {
      if (currentIndexRef.current < text.length) {
        const nextChunk = text.slice(
          currentIndexRef.current,
          currentIndexRef.current + simulateSpeed
        );
        currentIndexRef.current += simulateSpeed;
        setLiveTranscript((prev) => prev + nextChunk);
      } else {
        // Streaming complete
        clearInterval(simulationRef.current);
        simulationRef.current = null;
        setIsStreaming(false);
        setFinalTranscript(text);
      }
    }, simulateInterval);
  }, [simulateSpeed, simulateInterval]);

  // Start streaming (can be called with full text or chunks)
  const startStreaming = useCallback((textOrChunk) => {
    if (onStreamChunk) {
      // Real streaming mode - expect chunks via callback
      setIsStreaming(true);
      setLiveTranscript('');
      setFinalTranscript('');
      // The parent should call appendChunk when chunks arrive
    } else if (typeof textOrChunk === 'string' && textOrChunk) {
      // Fallback: Simulate streaming
      simulateStreaming(textOrChunk);
    }
  }, [onStreamChunk, simulateStreaming]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setIsStreaming(false);
    // Keep current live transcript as final
    if (liveTranscript) {
      setFinalTranscript(liveTranscript);
    }
  }, [liveTranscript]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    stopStreaming();
    setLiveTranscript('');
    setFinalTranscript('');
    currentIndexRef.current = 0;
  }, [stopStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, []);

  return {
    liveTranscript,
    finalTranscript,
    isStreaming,
    appendChunk, // For real streaming: call this when chunks arrive
    startStreaming, // Start with full text (simulated) or prepare for chunks
    stopStreaming,
    resetTranscript,
  };
};
