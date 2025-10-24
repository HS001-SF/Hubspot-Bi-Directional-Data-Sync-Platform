/**
 * React hook for managing API connections
 * Provides methods to connect, disconnect, and refresh tokens for HubSpot and Google Sheets
 */

import { useState, useEffect, useCallback } from 'react';

export interface ConnectionStatus {
  connected: boolean;
  portalId?: string | null;
  email?: string | null;
  connectedAt?: Date | null;
  tokenExpiry?: Date | null;
}

export interface ConnectionsData {
  hubspot: ConnectionStatus;
  google: ConnectionStatus;
}

export function useConnections() {
  const [connections, setConnections] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch connection status
   */
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/connections');

      if (!response.ok) {
        throw new Error('Failed to fetch connection status');
      }

      const data = await response.json();
      setConnections(data);
    } catch (err: any) {
      console.error('Error fetching connections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connect to HubSpot
   */
  const connectHubSpot = useCallback(() => {
    window.location.href = '/api/auth/hubspot';
  }, []);

  /**
   * Connect to Google
   */
  const connectGoogle = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async (provider: 'hubspot' | 'google') => {
    try {
      setError(null);

      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refresh token');
      }

      // Refresh connection status
      await fetchConnections();

      return { success: true };
    } catch (err: any) {
      console.error('Error refreshing token:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchConnections]);

  /**
   * Disconnect integration
   */
  const disconnect = useCallback(async (provider: 'hubspot' | 'google') => {
    try {
      setError(null);

      const response = await fetch('/api/connections', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect');
      }

      // Refresh connection status
      await fetchConnections();

      return { success: true };
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchConnections]);

  /**
   * Fetch connections on mount
   */
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    loading,
    error,
    fetchConnections,
    connectHubSpot,
    connectGoogle,
    refreshToken,
    disconnect,
  };
}
