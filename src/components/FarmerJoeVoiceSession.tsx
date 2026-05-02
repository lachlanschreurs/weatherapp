import { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Square, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

type VoiceStatus = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface FarmerJoeVoiceSessionProps {
  onClose: () => void;
  weatherContext?: any;
}

export default function FarmerJoeVoiceSession({ onClose, weatherContext }: FarmerJoeVoiceSessionProps) {
  const [status, setStatus] = useState<VoiceStatus>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const sessionActiveRef = useRef(false);
  const hasTrackRef = useRef(false);
  const isRespondingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;
    hasTrackRef.current = false;
    isRespondingRef.current = false;

    window.speechSynthesis?.cancel();

    if (dcRef.current) {
      try { dcRef.current.close(); } catch (_) {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      try { pcRef.current.close(); } catch (_) {}
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      streamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    audioTrackRef.current = null;
  }, []);

  const initSession = useCallback(async () => {
    if (sessionActiveRef.current) return;
    sessionActiveRef.current = true;
    hasTrackRef.current = false;
    isRespondingRef.current = false;

    window.speechSynthesis?.cancel();

    try {
      setStatus('connecting');
      setErrorMessage('');

      const { data: { session } } = await supabase.auth.getSession();
      const tokenUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-session`;
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token
            ? `Bearer ${session.access_token}`
            : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ weatherContext }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Failed to create session: ${errText}`);
      }

      if (!sessionActiveRef.current) return;

      const sessionData = await tokenResponse.json();
      const ephemeralKey = sessionData.client_secret?.value;

      if (!ephemeralKey) {
        throw new Error('No ephemeral key returned from server');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!sessionActiveRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      const audioTrack = stream.getTracks()[0];
      audioTrackRef.current = audioTrack;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Single audio element -- created once, never duplicated
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      // Only accept the FIRST remote track -- ignore duplicates
      pc.ontrack = (e) => {
        if (hasTrackRef.current) return;
        hasTrackRef.current = true;
        audioEl.srcObject = e.streams[0];
        audioEl.play().catch(() => {});
      };

      pc.addTrack(audioTrack);

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('open', () => {
        if (sessionActiveRef.current) {
          setStatus('listening');
        }
      });

      dc.addEventListener('message', (e) => {
        if (!sessionActiveRef.current) return;
        try {
          const event = JSON.parse(e.data);
          handleServerEvent(event);
        } catch (_) {}
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (!sessionActiveRef.current) return;

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errText = await sdpResponse.text();
        throw new Error(`WebRTC connection failed: ${sdpResponse.status} ${errText}`);
      }

      if (!sessionActiveRef.current) return;

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (error: any) {
      if (!sessionActiveRef.current) return;
      console.error('Voice session init error:', error);
      setErrorMessage(error.message || 'Failed to start voice session');
      setStatus('error');
    }
  }, [weatherContext]);

  const handleServerEvent = (event: any) => {
    switch (event.type) {
      case 'response.audio.delta':
        if (!isRespondingRef.current) {
          isRespondingRef.current = true;
          setStatus('speaking');
        }
        break;
      case 'response.done':
        isRespondingRef.current = false;
        setStatus('listening');
        break;
      case 'input_audio_buffer.speech_started':
        // User started speaking -- cancel any in-progress response to prevent overlap
        if (isRespondingRef.current) {
          isRespondingRef.current = false;
          if (dcRef.current && dcRef.current.readyState === 'open') {
            dcRef.current.send(JSON.stringify({ type: 'response.cancel' }));
          }
        }
        setStatus('listening');
        break;
      case 'input_audio_buffer.committed':
        setStatus('thinking');
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          setTranscript(prev => [...prev, { role: 'user', text: event.transcript }]);
        }
        break;
      case 'response.audio_transcript.done':
        if (event.transcript) {
          setTranscript(prev => [...prev, { role: 'assistant', text: event.transcript }]);
        }
        break;
      case 'error':
        console.error('Realtime API error:', event.error);
        break;
    }
  };

  const toggleMute = () => {
    if (audioTrackRef.current) {
      const newMuted = !isMuted;
      audioTrackRef.current.enabled = !newMuted;
      setIsMuted(newMuted);
    }
  };

  const interruptSpeaking = () => {
    isRespondingRef.current = false;
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify({ type: 'response.cancel' }));
    }
    setStatus('listening');
  };

  const endSession = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  useEffect(() => {
    initSession();
    return cleanup;
  }, []);

  const statusText: Record<VoiceStatus, string> = {
    connecting: 'Connecting...',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Farmer Joe is speaking...',
    error: errorMessage || 'Connection error',
  };

  const statusColor: Record<VoiceStatus, string> = {
    connecting: 'text-yellow-400',
    listening: 'text-green-400',
    thinking: 'text-blue-400',
    speaking: 'text-green-300',
    error: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden flex flex-col items-center py-10 px-6"
        style={{ background: 'linear-gradient(to bottom, #0d2117, #081510, #050d09)' }}
      >
        {/* Avatar */}
        <div className="relative mb-6">
          <div
            className={`absolute inset-0 rounded-full ${status === 'listening' || status === 'speaking' ? 'animate-pulse' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)',
              transform: 'scale(2)',
            }}
          />
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-green-500/60 shadow-2xl">
            <svg viewBox="0 0 100 100" width={112} height={112}>
              <defs>
                <linearGradient id="vBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a3a2a" />
                  <stop offset="100%" stopColor="#0f2419" />
                </linearGradient>
                <linearGradient id="vSkinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f5cba7" />
                  <stop offset="100%" stopColor="#e8a87c" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="50" fill="url(#vBgGrad)" />
              <circle cx="50" cy="44" r="26" fill="url(#vSkinGrad)" />
              <path d="M 28 42 Q 29 28 50 27 Q 71 28 72 42" fill="#6b3a1f" />
              <rect x="24" y="30" width="52" height="10" rx="5" fill="#8B4513" />
              <rect x="20" y="37" width="60" height="6" rx="3" fill="#A0522D" />
              <ellipse cx="39" cy="44" rx="4" ry="4.5" fill="#2C1810" />
              <ellipse cx="61" cy="44" rx="4" ry="4.5" fill="#2C1810" />
              <ellipse cx="40" cy="43" rx="1.5" ry="1.5" fill="#fff" opacity="0.6" />
              <ellipse cx="62" cy="43" rx="1.5" ry="1.5" fill="#fff" opacity="0.6" />
              <path d="M 42 54 Q 50 60 58 54" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 37 38 Q 40 35 43 38" stroke="#5C3D2E" strokeWidth="1.5" fill="none" />
              <path d="M 57 38 Q 60 35 63 38" stroke="#5C3D2E" strokeWidth="1.5" fill="none" />
              <ellipse cx="50" cy="76" rx="20" ry="16" fill="#1e4d30" />
              <rect x="43" y="74" width="6" height="14" rx="3" fill="#2d6b42" />
              <rect x="51" y="74" width="6" height="14" rx="3" fill="#2d6b42" />
            </svg>
          </div>
        </div>

        {/* Sound wave animation */}
        <div className="flex items-center gap-1 h-8 mb-4">
          {(status === 'listening' || status === 'speaking') && (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${status === 'speaking' ? 'bg-green-400' : 'bg-green-500/60'}`}
                style={{
                  animation: 'soundWave 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                  height: '4px',
                }}
              />
            ))
          )}
          {status === 'thinking' && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {status === 'connecting' && (
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Status text */}
        <p className={`text-sm font-medium mb-8 ${statusColor[status]}`}>
          {statusText[status]}
        </p>

        {/* Transcript panel */}
        {showTranscript && transcript.length > 0 && (
          <div className="w-full max-h-40 overflow-y-auto mb-6 rounded-xl bg-slate-900/70 border border-slate-700/50 p-3 space-y-2">
            {transcript.map((t, i) => (
              <p key={i} className={`text-xs ${t.role === 'user' ? 'text-slate-400' : 'text-green-300'}`}>
                <span className="font-semibold">{t.role === 'user' ? 'You' : 'Joe'}:</span> {t.text}
              </p>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-600/80 border-2 border-red-500/60 text-white'
                : 'bg-slate-800/80 border-2 border-slate-600/50 text-slate-300 hover:border-slate-500/70'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={endSession}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 border-2 border-red-500/60 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
            title="End voice chat"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {status === 'speaking' ? (
            <button
              onClick={interruptSpeaking}
              className="w-14 h-14 rounded-full bg-slate-800/80 border-2 border-slate-600/50 text-slate-300 hover:border-yellow-500/60 hover:text-yellow-400 flex items-center justify-center transition-all"
              title="Stop Farmer Joe speaking"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowTranscript(t => !t)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                showTranscript
                  ? 'bg-green-900/50 border-2 border-green-600/50 text-green-400'
                  : 'bg-slate-800/80 border-2 border-slate-600/50 text-slate-300 hover:border-slate-500/70'
              }`}
              title={showTranscript ? 'Hide transcript' : 'Show transcript'}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error retry */}
        {status === 'error' && (
          <button
            onClick={() => {
              sessionActiveRef.current = false;
              initSession();
            }}
            className="mt-6 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Try Again
          </button>
        )}
      </div>

      <style>{`
        @keyframes soundWave {
          0%, 100% { height: 4px; }
          50% { height: 24px; }
        }
      `}</style>
    </div>
  );
}
