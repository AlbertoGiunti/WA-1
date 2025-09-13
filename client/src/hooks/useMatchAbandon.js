import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

/**
 * Hook for handling match abandonment with confirmation
 * @param {Object} match - Current match object
 * @param {Function} onMatchUpdate - Callback to update match state
 * @returns {Object} Functions for abandoning matches
 */
export function useMatchAbandon(match, onMatchUpdate) {
  const navigate = useNavigate();

  const abandonMatch = useCallback(async (matchId, isGuest = false) => {
    try {
      const result = isGuest 
        ? await api.abandonGuestMatch(matchId)
        : await api.abandonMatch(matchId);
      
      if (onMatchUpdate) {
        onMatchUpdate(result.match);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to abandon match:', error);
      throw error;
    }
  }, [onMatchUpdate]);

  const abandonAndGoHome = useCallback(async () => {
    if (!match || match.status !== 'playing') {
      navigate('/');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to abandon this match? You will lose your progress and return to the home page.'
    );

    if (confirmed) {
      try {
        const isGuest = !match.userId;
        await abandonMatch(match.id, isGuest);
        navigate('/');
      } catch (error) {
        console.error('Failed to abandon match:', error);
        // Still navigate home even if abandon fails
        navigate('/');
      }
    }
  }, [match, abandonMatch, navigate]);

  return {
    abandonMatch,
    abandonAndGoHome
  };
}