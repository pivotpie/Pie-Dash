/**
 * TypewriterText - Streaming text component with typewriter effect
 * Mimics ChatGPT/Claude-style progressive text rendering
 */

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  isStreaming: boolean;
  speed?: number; // Words per minute (default: 600)
  className?: string;
  onComplete?: () => void;
  cursor?: boolean; // Show blinking cursor
  preserveWhitespace?: boolean; // Preserve line breaks and whitespace
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  isStreaming,
  speed = 600, // 600 WPM = ~100ms per word, similar to ChatGPT
  className = '',
  onComplete,
  cursor = true,
  preserveWhitespace = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isCompleteRef = useRef(false);

  // Calculate delay between characters/words
  const calculateDelay = (currentText: string, nextChar: string): number => {
    const baseDelay = 60000 / speed / 5; // Convert WPM to ms per character (assuming 5 chars per word)

    // Longer pause after punctuation
    if (['.', '!', '?'].includes(currentText.slice(-1))) {
      return baseDelay * 8;
    }
    if ([',', ';', ':'].includes(currentText.slice(-1))) {
      return baseDelay * 4;
    }

    // Shorter delay for spaces
    if (nextChar === ' ') {
      return baseDelay * 0.5;
    }

    // Normal character delay with slight randomization for natural feel
    return baseDelay + (Math.random() * baseDelay * 0.3);
  };

  // Reset when text changes
  useEffect(() => {
    if (text !== displayedText || currentIndex === 0) {
      setDisplayedText('');
      setCurrentIndex(0);
      isCompleteRef.current = false;
    }
  }, [text]);

  // Main typing effect
  useEffect(() => {
    if (!isStreaming || isCompleteRef.current) {
      // If not streaming, show full text immediately
      if (!isStreaming && displayedText !== text) {
        setDisplayedText(text);
        setCurrentIndex(text.length);
        isCompleteRef.current = true;
        onComplete?.();
      }
      return;
    }

    if (currentIndex < text.length) {
      const nextChar = text[currentIndex];
      const delay = calculateDelay(displayedText, nextChar);

      timeoutRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + nextChar);
        setCurrentIndex(prev => prev + 1);
      }, delay);
    } else if (currentIndex === text.length && !isCompleteRef.current) {
      // Typing complete
      isCompleteRef.current = true;
      onComplete?.();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, text, isStreaming, displayedText, onComplete]);

  // Cursor blinking effect
  useEffect(() => {
    if (!cursor) return;

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // Standard cursor blink rate

    return () => clearInterval(cursorInterval);
  }, [cursor]);

  // Stop cursor blinking when typing is complete
  useEffect(() => {
    if (isCompleteRef.current && cursor) {
      setShowCursor(false);
    }
  }, [displayedText, text, cursor]);

  const textToShow = displayedText || '';
  const shouldShowCursor = cursor && (isStreaming || showCursor) && !isCompleteRef.current;

  return (
    <span className={className}>
      {preserveWhitespace ? (
        <span className="whitespace-pre-wrap">
          {textToShow}
          {shouldShowCursor && (
            <span className="animate-pulse text-blue-500">|</span>
          )}
        </span>
      ) : (
        <>
          {textToShow}
          {shouldShowCursor && (
            <span className="animate-pulse text-blue-500">|</span>
          )}
        </>
      )}
    </span>
  );
};

export default TypewriterText;