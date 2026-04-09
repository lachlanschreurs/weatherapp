import { useState } from 'react';
import { ClipboardList, X, Plus, Check, Droplets, Wind, Sprout, FlaskConical, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FieldNote {
  id: string;
  type: string;
  paddock: string;
  notes: string;
  created_at: string;
}

interface FieldNotesProps {
  userId?: string;
  locationName: string;
  paddocks?: string[];
}

const NOTE_TYPES = [
  { value: 'spray', label: 'Spray Event', icon: <Wind className="w-4 h-4" />, color: 'text-blue-300' },
  { value: 'fertiliser', label: 'Fertiliser', icon: <Droplets className="w-4 h-4" />, color: 'text-green-300' },
  { value: 'planting', label: 'Planting', icon: <Sprout className="w-4 h-4" />, color: 'text-emerald-300' },
  { value: 'chemical', label: 'Chemical / Pest', icon: <FlaskConical className="w-4 h-4" />, color: 'text-amber-300' },
  { value: 'observation', label: 'Observation', icon: <ClipboardList className="w-4 h-4" />, color: 'text-slate-300' },
];

export function FieldNotes({ userId, locationName, paddocks = ['Home Paddock', 'Paddock A', 'Paddock B', 'Paddock C', 'All Paddocks'] }: FieldNotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [noteType, setNoteType] = useState('spray');
  const [paddock, setPaddock] = useState(paddocks[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedType = NOTE_TYPES.find(t => t.value === noteType) || NOTE_TYPES[0];

  const handleSave = async () => {
    if (!notes.trim()) return;
    setSaving(true);

    try {
      if (userId) {
        await supabase.from('field_notes').insert({
          user_id: userId,
          location: locationName,
          type: noteType,
          paddock,
          notes: notes.trim(),
        });
      }
      setSaved(true);
      setNotes('');
      setTimeout(() => {
        setSaved(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save field note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:text-white hover:border-slate-500/60 transition-all duration-200 text-sm font-semibold shadow-lg group"
        title="Log a field activity"
      >
        <ClipboardList className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
        Field Notes
        <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-600/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 via-transparent to-slate-900/20 pointer-events-none" />

            <div className="relative px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Log Field Activity</h3>
                  <p className="text-xs text-slate-500">{locationName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Activity Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTE_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNoteType(type.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${noteType === type.value
                        ? 'border-green-500/50 bg-green-500/10 text-green-200'
                        : 'border-slate-600/40 bg-slate-800/50 text-slate-400 hover:border-slate-500/50 hover:text-slate-300'
                      }`}
                    >
                      <span className={noteType === type.value ? 'text-green-400' : type.color}>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Paddock</label>
                <div className="relative">
                  <select
                    value={paddock}
                    onChange={e => setPaddock(e.target.value)}
                    className="w-full appearance-none bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50 focus:bg-slate-800/90 transition-colors pr-10"
                  >
                    {paddocks.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={`e.g. Applied ${selectedType.label.toLowerCase()} at 4pm, 5 L/ha, low-drift nozzles...`}
                  rows={4}
                  className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 focus:bg-slate-800/90 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600/50 bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:border-slate-500/60 transition-all text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!notes.trim() || saving || saved}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${saved
                    ? 'bg-green-600 text-white border border-green-500'
                    : 'bg-green-600 hover:bg-green-500 text-white border border-green-500/60 shadow-lg shadow-green-900/30 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {saved ? (
                    <><Check className="w-4 h-4" /> Saved!</>
                  ) : saving ? (
                    'Saving...'
                  ) : (
                    <><Plus className="w-4 h-4" /> Save Note</>
                  )}
                </button>
              </div>

              {!userId && (
                <p className="text-xs text-slate-600 text-center">Sign in to save notes to your account</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
