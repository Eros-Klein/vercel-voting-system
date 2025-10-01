'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
  createdBy: string;
  createdAt: number;
}

interface VoteData {
  options: VoteOption[];
  lastUpdate: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [newOptionText, setNewOptionText] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  
  const userName = session?.user?.name || '';

  // Fetch initial data
  useEffect(() => {
    fetch('/api/votes')
      .then(res => res.json())
      .then(data => setVoteData(data));
  }, []);

  // Setup SSE connection
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'connected' && data.options) {
          setVoteData(data);
        }
      } catch (error) {
        // Ignore malformed messages
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleVoteClick = (optionId: string) => {
    if (!session) {
      signIn('keycloak');
      return;
    }
    submitVote(optionId);
  };

  const handleRemoveVote = (optionId: string) => {
    if (!session) {
      signIn('keycloak');
      return;
    }
    removeVote(optionId);
  };

  const submitVote = async (optionId: string) => {
    setError('');
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          optionId,
          userName
        })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to vote');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const removeVote = async (optionId: string) => {
    setError('');
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeVote',
          optionId,
          userName
        })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to remove vote');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleAddOptionClick = () => {
    if (!session) {
      signIn('keycloak');
      return;
    }
    setShowAddOption(true);
  };

  const submitAddOption = async () => {
    if (!newOptionText.trim()) {
      setError('Please enter an option');
      return;
    }

    setError('');
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addOption',
          newOption: newOptionText,
          userName
        })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to add option');
      } else {
        setNewOptionText('');
        setShowAddOption(false);
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const totalVotes = voteData?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0;

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading...</p>
        </div>
      </main>
    );
  }

  // Show login prompt if not authenticated
  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 md:p-8 relative overflow-hidden animate-gradient">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-float"></div>
          <div className="absolute w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-float delay-1000"></div>
          <div className="absolute w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl top-1/2 left-1/2 animate-float delay-300"></div>
        </div>

        {/* Grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none"></div>

        <div className="max-w-2xl mx-auto relative z-10 flex items-center justify-center min-h-screen">
          <div className="glass-strong p-8 md:p-12 rounded-3xl backdrop-blur-2xl bg-white/95 border border-white shadow-[0_20px_80px_rgba(0,0,0,0.3)] w-full animate-scale-in relative overflow-hidden text-center">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            <div className="text-6xl mb-6 animate-float">🗳️</div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Live Voting System
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Sign in with your HTL Leonding account to participate
            </p>
            
            <button
              onClick={() => signIn('keycloak')}
              className="w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white font-bold text-lg hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              <span className="relative z-10 flex items-center justify-center gap-3">
                <span className="text-2xl">🔐</span>
                Sign in with Keycloak
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 md:p-8 relative overflow-hidden animate-gradient">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-float"></div>
        <div className="absolute w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-float delay-1000"></div>
        <div className="absolute w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl top-1/2 left-1/2 animate-float delay-300"></div>
      </div>

      {/* Grid overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
          <div className="inline-block mb-6">
            <div className="relative">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100">
                  Live Voting
                </span>
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-30 -z-10"></div>
            </div>
          </div>
          <p className="text-white/90 text-lg md:text-xl mb-6 font-light">
            Cast your vote or add new options • Real-time results
          </p>
          
          {/* Status badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="glass-card px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`}></div>
              <span className="text-white/90 text-sm font-medium">
                {isConnected ? '🟢 Live' : '🔴 Connecting...'}
              </span>
            </div>
            {userName && (
              <div className="glass-card px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center gap-2">
                <span className="text-white/80 text-sm">
                  👤 <span className="font-semibold text-white">{userName}</span>
                </span>
                <button
                  onClick={() => signOut()}
                  className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Sign out"
                >
                  🚪
                </button>
              </div>
            )}
            {totalVotes > 0 && (
              <div className="glass-card px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl">
                <span className="text-white/80 text-sm">
                  🗳️ <span className="font-semibold text-white">{totalVotes} total votes</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Vote options */}
        <div className="space-y-4 md:space-y-5 mb-8">
          {voteData?.options.map((option, index) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            const hasVoted = Boolean(userName && option.voters.includes(userName));
            const isLeading = voteData.options.every(opt => opt.votes <= option.votes) && option.votes > 0;

            return (
              <div
                key={option.id}
                className={`glass-card p-5 md:p-7 rounded-3xl backdrop-blur-xl bg-white/15 border transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden animate-fade-in-up ${
                  hasVoted 
                    ? 'border-green-400/50 shadow-[0_0_30px_rgba(74,222,128,0.3)]' 
                    : 'border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:border-white/40 hover:shadow-[0_8px_48px_rgba(0,0,0,0.15)]'
                } ${isLeading ? 'border-yellow-400/50' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Leading badge */}
                {isLeading && totalVotes > 0 && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold shadow-lg">
                    👑 Leading
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                      {option.text}
                      {hasVoted && <span className="text-green-400 text-xl">✓</span>}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-white/70 font-medium">{option.votes} {option.votes === 1 ? 'vote' : 'votes'}</span>
                        {option.voters.length > 0 && (
                          <span className="text-white/50">• {option.voters.length} {option.voters.length === 1 ? 'person' : 'people'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span>Created by <span className="text-white/70 font-semibold">{option.createdBy}</span></span>
                        {option.voters.length > 0 && (
                          <button
                            onClick={() => setExpandedOption(expandedOption === option.id ? null : option.id)}
                            className="text-white/60 hover:text-white/90 transition-colors underline"
                          >
                            {expandedOption === option.id ? 'Hide voters' : 'Show voters'}
                          </button>
                        )}
                      </div>
                      {expandedOption === option.id && option.voters.length > 0 && (
                        <div className="mt-2 p-3 rounded-xl bg-white/10 backdrop-blur">
                          <p className="text-xs text-white/60 mb-2 font-semibold">Voted by:</p>
                          <div className="flex flex-wrap gap-2">
                            {option.voters.map((voter, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur"
                              >
                                {voter}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {hasVoted ? (
                      <button
                        onClick={() => handleRemoveVote(option.id)}
                        className="px-6 md:px-8 py-3 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 relative overflow-hidden group/btn bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center gap-2">
                          <span className="text-xl">✗</span>
                          Remove Vote
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVoteClick(option.id)}
                        className="px-6 md:px-8 py-3 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 relative overflow-hidden group/btn bg-white text-purple-600 hover:text-purple-700 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center gap-2">
                          Vote
                          <span className="text-lg group-hover/btn:translate-x-1 transition-transform">→</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Enhanced progress bar */}
                <div className="relative">
                  <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                        hasVoted 
                          ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400' 
                          : 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 5 && (
                        <div className="absolute inset-0 animate-shimmer"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white/80 text-sm font-semibold">
                      {percentage.toFixed(1)}%
                    </span>
                    {percentage > 0 && (
                      <span className="text-white/60 text-xs">
                        {percentage >= 50 ? '🔥 Popular' : percentage >= 25 ? '📈 Rising' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Add option button */}
        {!showAddOption && (
          <button
            onClick={handleAddOptionClick}
            className="w-full p-6 md:p-8 rounded-3xl backdrop-blur-xl bg-white/5 border-2 border-white/30 border-dashed text-white text-lg md:text-xl font-semibold hover:bg-white/15 hover:border-white/50 transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/10 to-pink-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-3">
              <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">+</span>
              Add New Option
              <span className="text-sm opacity-70">Everyone can contribute!</span>
            </span>
          </button>
        )}

        {/* Add option form */}
        {showAddOption && (
          <div className="glass-card p-6 md:p-8 rounded-3xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-[0_8px_48px_rgba(0,0,0,0.2)] animate-scale-in">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-3xl">✨</span>
              Add New Option
            </h3>
            <p className="text-white/70 text-sm mb-5">Share your idea with everyone</p>
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="Enter your option here..."
              className="w-full p-4 md:p-5 rounded-2xl bg-white/95 text-gray-800 placeholder-gray-400 mb-5 focus:outline-none focus:ring-4 focus:ring-white/50 font-medium text-lg shadow-lg transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && submitAddOption()}
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={submitAddOption}
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
              >
                <span className="flex items-center justify-center gap-2">
                  Add Option
                  <span className="text-xl">→</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setShowAddOption(false);
                  setNewOptionText('');
                  setError('');
                }}
                className="px-6 py-4 rounded-2xl bg-white/20 text-white font-semibold text-lg hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-6 p-5 rounded-2xl glass-card bg-red-500/90 backdrop-blur-xl border border-red-400/50 text-white text-center animate-shake shadow-[0_0_30px_rgba(239,68,68,0.5)]">
            <span className="text-xl mr-2">⚠️</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}
        </div>

      </main>
  );
}
