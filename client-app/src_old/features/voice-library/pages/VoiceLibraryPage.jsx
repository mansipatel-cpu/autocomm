import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Play,
  Pause,
  Mic,
  Volume2,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, versatile voice suitable for a wide range of applications', gender: 'Neutral', style: 'Balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm, engaging voice with a friendly tone', gender: 'Male', style: 'Warm' },
  { id: 'shimmer', name: 'Shimmer', description: 'Expressive, dynamic voice with clear articulation', gender: 'Female', style: 'Expressive' },
  { id: 'ash', name: 'Ash', description: 'Calm, professional voice ideal for business contexts', gender: 'Male', style: 'Professional' },
  { id: 'ballad', name: 'Ballad', description: 'Smooth, melodic voice with a soothing quality', gender: 'Female', style: 'Melodic' },
  { id: 'coral', name: 'Coral', description: 'Bright, energetic voice with an upbeat tone', gender: 'Female', style: 'Energetic' },
  { id: 'sage', name: 'Sage', description: 'Wise, authoritative voice conveying expertise', gender: 'Male', style: 'Authoritative' },
  { id: 'verse', name: 'Verse', description: 'Articulate, clear voice perfect for narration', gender: 'Neutral', style: 'Narrative' },
  { id: 'cedar', name: 'Cedar', description: 'Deep, resonant voice with a grounded presence', gender: 'Male', style: 'Deep' },
  { id: 'marin', name: 'Marin', description: 'Fresh, youthful voice with modern appeal', gender: 'Female', style: 'Youthful' },
];

export const VoiceLibraryPage = () => {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/voice-library');
      setVoices(res.data.data || []);
    } catch (err) {
      console.error('Failed to load voices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const togglePlay = (voiceId) => {
    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(voiceId);
      setTimeout(() => {
        setPlayingVoiceId((prev) => (prev === voiceId ? null : prev));
      }, 4000);
    }
  };

  const pill = 'rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 font-medium';
  const accentPill = 'rounded-md bg-blue-50 px-2.5 py-1 text-xs text-[#007BFF] font-medium';

  const filteredVoices = voices.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name?.toLowerCase().includes(q);
      const matchAccent = v.accent?.toLowerCase().includes(q);
      const matchTone = v.tone?.toLowerCase().includes(q);
      const matchCategory = v.category?.toLowerCase().includes(q);
      if (!matchName && !matchAccent && !matchTone && !matchCategory) return false;
    }
    return true;
  });

  const filteredOpenAIVoices = OPENAI_VOICES.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.gender.toLowerCase().includes(q) ||
        v.style.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCount = voices.length + OPENAI_VOICES.length;
  const filteredCount = filteredVoices.length + filteredOpenAIVoices.length;

  return (
    <div className="space-y-4 pb-8">
      {/* Search Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search voices by name, accent, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 h-10 rounded-xl border border-slate-200 bg-white text-sm placeholder-slate-400 focus:outline-none focus:border-[#007BFF]"
        />
      </div>

      {/* Summary Row */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Total Voices</span>
        <span>Showing {filteredCount} of {totalCount} voices</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 h-[132px] animate-pulse">
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="flex gap-2">
                <div className="h-5 bg-slate-100 rounded w-16" />
                <div className="h-5 bg-slate-100 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ElevenLabs Studio Voices Grid */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              ElevenLabs Studio Ultra-Realistic Voices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredVoices.map((voice) => (
                <div
                  key={voice._id || voice.voiceId}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 min-h-[132px] flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 truncate text-sm">
                        {voice.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => togglePlay(voice.voiceId || voice._id)}
                        className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors shrink-0"
                      >
                        {playingVoiceId === (voice.voiceId || voice._id) ? (
                          <Pause className="h-3.5 w-3.5 text-[#007BFF]" />
                        ) : (
                          <Play className="h-3.5 w-3.5 ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={pill}>English</span>
                      <span className={pill}>{voice.gender}</span>
                      <span className={pill}>{voice.accent}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mt-4">
                    <span className={accentPill}>{voice.category || 'Conversational'}</span>
                    <span className={pill}>Adult</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OpenAI Realtime Voices Grid */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              OpenAI Realtime Voice Models
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredOpenAIVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 min-h-[132px] flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 truncate text-sm">
                        {voice.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => togglePlay(voice.id)}
                        className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors shrink-0"
                      >
                        {playingVoiceId === voice.id ? (
                          <Pause className="h-3.5 w-3.5 text-[#007BFF]" />
                        ) : (
                          <Play className="h-3.5 w-3.5 ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={pill}>English</span>
                      <span className={pill}>{voice.gender}</span>
                      <span className={pill}>{voice.style}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mt-4">
                    <span className={accentPill}>OpenAI Realtime</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
