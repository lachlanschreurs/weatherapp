import { useState, useEffect, useMemo, useRef } from 'react';
import { FlaskConical, Bug, Leaf, X, Database, Lock, Sprout, Camera, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AgronomyDisclaimer, DISCLAIMER_FULL } from '../AgronomyDisclaimer';
import type { Chemical, Disease, Pest, Weed, Fertiliser, AgronomyTab } from './types';
import { AgronomySearch } from './AgronomySearch';
import { ChemicalCard } from './ChemicalCard';
import { DiseaseCard } from './DiseaseCard';
import { PestCard } from './PestCard';
import { WeedCard } from './WeedCard';
import { FertiliserCard } from './FertiliserCard';

const TABS: { id: AgronomyTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'chemicals',   label: 'Chemicals',   icon: <FlaskConical className="w-4 h-4" />, color: 'text-emerald-400' },
  { id: 'diseases',    label: 'Diseases',    icon: <Bug className="w-4 h-4" />,          color: 'text-red-400' },
  { id: 'pests',       label: 'Pests',       icon: <Bug className="w-4 h-4" />,          color: 'text-amber-400' },
  { id: 'weeds',       label: 'Weeds',       icon: <Leaf className="w-4 h-4" />,         color: 'text-orange-400' },
  { id: 'fertilisers', label: 'Fertilisers', icon: <Sprout className="w-4 h-4" />,       color: 'text-lime-400' },
];

const FREE_PREVIEW_COUNT = 3;

const SCAN_LABELS = ['Pest ID', 'Disease ID', 'Weed ID', 'Crop ID'];

function ScanAIButton({ onClick }: { onClick: () => void }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % SCAN_LABELS.length);
        setVisible(true);
      }, 220);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes scan-fade-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scan-label-in { animation: scan-fade-in 0.22s ease-out forwards; }
      `}</style>
      <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl border border-green-600/50 bg-green-950/50 text-green-300 hover:bg-green-900/50 hover:border-green-500/70 transition-all duration-200 shadow-lg"
        title="Upload a photo for AI identification"
        style={{ minWidth: '7.5rem' }}
      >
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-bold whitespace-nowrap">Photo Identifier AI</span>
          <span className="flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 uppercase tracking-wider flex-shrink-0">
            <Sparkles className="w-2 h-2" />
            AI
          </span>
        </div>
        <div className="h-3.5 flex items-center justify-center overflow-hidden">
          <span
            key={index}
            className={`text-[10px] font-semibold text-green-400/70 tracking-wide whitespace-nowrap transition-opacity duration-200 ${visible ? 'scan-label-in opacity-100' : 'opacity-0'}`}
          >
            {SCAN_LABELS[index]}
          </span>
        </div>
      </button>
    </>
  );
}

interface Props {
  onClose: () => void;
  isPremium?: boolean;
  onSignUp?: () => void;
  initialQuery?: string;
}

interface AIAnalysisResult {
  identification: string;
  details: string;
  recommendations: string[];
}

export function AgronomyDatabase({ onClose, isPremium = false, onSignUp, initialQuery = '' }: Props) {
  const [activeTab, setActiveTab] = useState<AgronomyTab>('chemicals');
  const [query, setQuery] = useState(initialQuery);
  const [cropFilter, setCropFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [loading, setLoading] = useState(true);

  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [pests, setPests] = useState<Pest[]>([]);
  const [weeds, setWeeds] = useState<Weed[]>([]);
  const [fertilisers, setFertilisers] = useState<Fertiliser[]>([]);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [chemRes, disRes, pestRes, weedRes, fertRes] = await Promise.all([
        supabase.from('agro_chemicals').select('*').order('product_name').limit(10000),
        supabase.from('agro_diseases').select(`
          *,
          chemicals:agro_disease_chemicals(
            application_notes,
            efficacy_rating,
            chemical:agro_chemicals(*)
          )
        `).order('disease_name').limit(10000),
        supabase.from('agro_pests').select(`
          *,
          chemicals:agro_pest_chemicals(
            application_notes,
            efficacy_rating,
            chemical:agro_chemicals(*)
          )
        `).order('pest_name').limit(10000),
        supabase.from('agro_weeds').select(`
          *,
          chemicals:agro_weed_chemicals(
            application_notes,
            efficacy_rating,
            chemical:agro_chemicals(*)
          )
        `).order('weed_name').limit(10000),
        supabase.from('agro_fertilisers').select('*').order('product_name').limit(10000),
      ]);

      if (chemRes.error) console.error('Chemicals load error:', chemRes.error);
      if (disRes.error) console.error('Diseases load error:', disRes.error);
      if (pestRes.error) console.error('Pests load error:', pestRes.error);
      if (weedRes.error) console.error('Weeds load error:', weedRes.error);
      if (fertRes.error) console.error('Fertilisers load error:', fertRes.error);

      if (chemRes.data) setChemicals(chemRes.data);
      if (disRes.data) setDiseases(disRes.data as unknown as Disease[]);
      if (pestRes.data) setPests(pestRes.data as unknown as Pest[]);
      if (weedRes.data) setWeeds(weedRes.data as unknown as Weed[]);
      if (fertRes.data) setFertilisers(fertRes.data as unknown as Fertiliser[]);
    } catch (err) {
      console.error('Error loading agronomy data:', err);
    } finally {
      setLoading(false);
    }
  }

  const allCrops = useMemo(() => {
    const crops = new Set<string>();
    chemicals.forEach(c => c.registered_crops.forEach(crop => crops.add(crop)));
    diseases.forEach(d => d.affected_crops.forEach(crop => crops.add(crop)));
    pests.forEach(p => p.affected_crops.forEach(crop => crops.add(crop)));
    weeds.forEach(w => w.affected_environments.forEach(env => crops.add(env)));
    fertilisers.forEach(f => f.suitable_crops.forEach(crop => crops.add(crop)));
    return Array.from(crops).sort();
  }, [chemicals, diseases, pests, weeds, fertilisers]);

  const allActiveIngredients = useMemo(() => {
    const ais = new Set<string>();
    chemicals.forEach(c => { if (c.active_ingredient) ais.add(c.active_ingredient); });
    return Array.from(ais).sort();
  }, [chemicals]);

  const filteredChemicals = useMemo(() => chemicals.filter(c => {
    const q = query.toLowerCase();
    return (!q || c.product_name.toLowerCase().includes(q) || c.active_ingredient.toLowerCase().includes(q) || c.chemical_group.toLowerCase().includes(q) || c.target_issues.some(t => t.toLowerCase().includes(q)))
      && (!cropFilter || c.registered_crops.includes(cropFilter))
      && (!categoryFilter || c.category === categoryFilter)
      && (!activeIngredient || c.active_ingredient === activeIngredient);
  }), [chemicals, query, cropFilter, categoryFilter, activeIngredient]);

  const filteredDiseases = useMemo(() => diseases.filter(d => {
    const q = query.toLowerCase();
    return (!q || d.disease_name.toLowerCase().includes(q) || d.common_name.toLowerCase().includes(q) || d.pathogen_type.toLowerCase().includes(q) || d.symptoms.toLowerCase().includes(q))
      && (!cropFilter || d.affected_crops.includes(cropFilter));
  }), [diseases, query, cropFilter]);

  const filteredPests = useMemo(() => pests.filter(p => {
    const q = query.toLowerCase();
    return (!q || p.pest_name.toLowerCase().includes(q) || p.common_name.toLowerCase().includes(q) || p.pest_type.toLowerCase().includes(q) || p.damage_caused.toLowerCase().includes(q))
      && (!cropFilter || p.affected_crops.includes(cropFilter));
  }), [pests, query, cropFilter]);

  const filteredWeeds = useMemo(() => weeds.filter(w => {
    const q = query.toLowerCase();
    return (!q || w.weed_name.toLowerCase().includes(q) || w.common_name.toLowerCase().includes(q) || w.weed_family.toLowerCase().includes(q) || w.growth_habit.toLowerCase().includes(q))
      && (!cropFilter || w.affected_environments.includes(cropFilter));
  }), [weeds, query, cropFilter]);

  const filteredFertilisers = useMemo(() => fertilisers.filter(f => {
    const q = query.toLowerCase();
    return (!q || f.product_name.toLowerCase().includes(q) || f.fertiliser_type.toLowerCase().includes(q) || f.notes.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q))
      && (!cropFilter || f.suitable_crops.includes(cropFilter));
  }), [fertilisers, query, cropFilter]);

  const counts = {
    chemicals: filteredChemicals.length,
    diseases: filteredDiseases.length,
    pests: filteredPests.length,
    weeds: filteredWeeds.length,
    fertilisers: filteredFertilisers.length,
  };

  const currentCount = counts[activeTab];
  const lockedCount = isPremium ? 0 : Math.max(0, currentCount - FREE_PREVIEW_COUNT);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
      setAnalysisResult(null);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  }

  async function analysePhoto() {
    if (!photoPreview) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const base64 = photoPreview.split('base64,')[1] || photoPreview;

      const res = await fetch(`${supabaseUrl}/functions/v1/farmer-joe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: `You are an Australian agricultural expert. Analyse this photo and:
1. Identify what you see (crop, pest, disease, weed, nutrient deficiency, etc.)
2. Provide a brief description
3. Give 2-4 specific recommendations

Respond ONLY with this exact JSON format (no other text):
{
  "identification": "What this is (e.g. Aphid infestation on wheat)",
  "details": "2-3 sentence description of what you see and why it matters",
  "recommendations": ["First recommendation", "Second recommendation", "Third recommendation"]
}`,
          imageData: base64,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const raw = (json.response || '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse AI response');

      const parsed: AIAnalysisResult = JSON.parse(match[0]);
      setAnalysisResult(parsed);
    } catch (err: any) {
      setAnalysisError(err?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  function clearPhoto() {
    setPhotoPreview(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">Agronomy Database</h1>
                  {!isPremium && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Preview
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">Australian agricultural reference — chemicals, diseases, pests, weeds & fertilisers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <AgronomySearch
                query={query}
                onQueryChange={setQuery}
                cropFilter={cropFilter}
                onCropChange={setCropFilter}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                activeIngredient={activeIngredient}
                onActiveIngredientChange={setActiveIngredient}
                activeTab={activeTab}
                allCrops={allCrops}
                allActiveIngredients={allActiveIngredients}
              />
            </div>

            <div className="flex-shrink-0 pt-0.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <ScanAIButton onClick={() => fileInputRef.current?.click()} />
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'
                }`}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-5">
          {photoPreview && (
            <PhotoAnalysisPanel
              photoPreview={photoPreview}
              analyzing={analyzing}
              analysisResult={analysisResult}
              analysisError={analysisError}
              onAnalyse={analysePhoto}
              onClear={clearPhoto}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-slate-700 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading database...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'chemicals' && (
                <ResultsWithPaywall
                  items={filteredChemicals}
                  isPremium={isPremium}
                  onSignUp={onSignUp}
                  renderItem={(c) => <ChemicalCard key={c.id} chemical={c} />}
                  tab="chemicals"
                  lockedCount={lockedCount}
                />
              )}
              {activeTab === 'diseases' && (
                <ResultsWithPaywall
                  items={filteredDiseases}
                  isPremium={isPremium}
                  onSignUp={onSignUp}
                  renderItem={(d) => <DiseaseCard key={d.id} disease={d} />}
                  tab="diseases"
                  lockedCount={lockedCount}
                />
              )}
              {activeTab === 'pests' && (
                <ResultsWithPaywall
                  items={filteredPests}
                  isPremium={isPremium}
                  onSignUp={onSignUp}
                  renderItem={(p) => <PestCard key={p.id} pest={p} />}
                  tab="pests"
                  lockedCount={lockedCount}
                />
              )}
              {activeTab === 'weeds' && (
                <ResultsWithPaywall
                  items={filteredWeeds}
                  isPremium={isPremium}
                  onSignUp={onSignUp}
                  renderItem={(w) => <WeedCard key={w.id} weed={w} />}
                  tab="weeds"
                  lockedCount={lockedCount}
                />
              )}
              {activeTab === 'fertilisers' && (
                <ResultsWithPaywall
                  items={filteredFertilisers}
                  isPremium={isPremium}
                  onSignUp={onSignUp}
                  renderItem={(f) => <FertiliserCard key={f.id} fertiliser={f} />}
                  tab="fertilisers"
                  lockedCount={lockedCount}
                />
              )}

              <div className="mt-8 py-5 border-t border-slate-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-600" />
                  <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">FarmCast Agronomy Reference Database</p>
                </div>
                <p className="text-[10px] text-slate-600 max-w-2xl mx-auto text-center leading-relaxed">
                  {DISCLAIMER_FULL}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface PhotoAnalysisPanelProps {
  photoPreview: string;
  analyzing: boolean;
  analysisResult: AIAnalysisResult | null;
  analysisError: string | null;
  onAnalyse: () => void;
  onClear: () => void;
}

function PhotoAnalysisPanel({ photoPreview, analyzing, analysisResult, analysisError, onAnalyse, onClear }: PhotoAnalysisPanelProps) {
  return (
    <div className="mb-6 rounded-2xl border border-green-600/30 bg-green-950/20 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-green-700/20">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-green-300">Photo Identification</span>
          <span className="flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 uppercase tracking-wider">
            <Sparkles className="w-2 h-2" />
            AI
          </span>
        </div>
        <button onClick={onClear} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-shrink-0">
            <img
              src={photoPreview}
              alt="Uploaded for analysis"
              className="w-full sm:w-48 h-36 object-cover rounded-xl border border-slate-700/60 shadow-lg"
            />
            <div className="flex gap-2 mt-3">
              {!analysisResult && !analyzing && (
                <button
                  onClick={onAnalyse}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-green-900/40"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyse
                </button>
              )}
              {analyzing && (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-400 text-sm font-bold rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysing...
                </div>
              )}
              <button
                onClick={onClear}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-sm rounded-xl transition-colors border border-slate-700/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {!analysisResult && !analyzing && !analysisError && (
              <div className="flex flex-col items-start justify-center h-full gap-2 py-2">
                <p className="text-sm font-semibold text-slate-300">Ready to identify</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload a clear photo of a pest, disease, weed, crop deficiency, or damage and AI will identify it and provide actionable recommendations.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['Pest', 'Disease', 'Weed', 'Deficiency', 'Damage'].map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-start justify-center h-full gap-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-green-700 border-t-green-400 rounded-full animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-slate-200">Analysing your photo...</p>
                    <p className="text-xs text-slate-500 mt-0.5">Identifying species, conditions, and recommendations</p>
                  </div>
                </div>
              </div>
            )}

            {analysisError && (
              <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-4">
                <p className="text-sm font-bold text-red-400 mb-1">Analysis failed</p>
                <p className="text-xs text-red-300/70">{analysisError}</p>
                <button
                  onClick={onAnalyse}
                  className="mt-3 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Identified</span>
                  </div>
                  <h3 className="text-base font-black text-white">{analysisResult.identification}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{analysisResult.details}</p>
                </div>

                {analysisResult.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Possible Recommendations</div>
                    <ul className="space-y-1.5">
                      {analysisResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-900/50 border border-green-600/30 text-green-400 text-[10px] font-black flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <AgronomyDisclaimer variant="inline" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResultsWithPaywallProps<T> {
  items: T[];
  isPremium: boolean;
  onSignUp?: () => void;
  renderItem: (item: T) => React.ReactNode;
  tab: string;
  lockedCount: number;
}

function ResultsWithPaywall<T>({ items, isPremium, onSignUp, renderItem, tab, lockedCount }: ResultsWithPaywallProps<T>) {
  if (items.length === 0) {
    return <EmptyState tab={tab} />;
  }

  if (isPremium) {
    return <div className="space-y-3">{items.map(renderItem)}</div>;
  }

  const visibleItems = items.slice(0, FREE_PREVIEW_COUNT);
  const hiddenItems = items.slice(FREE_PREVIEW_COUNT);

  return (
    <div className="space-y-3">
      {visibleItems.map(renderItem)}

      {hiddenItems.length > 0 && (
        <div className="relative mt-1">
          <div className="space-y-3 pointer-events-none select-none" aria-hidden="true">
            {hiddenItems.slice(0, 3).map((item, i) => (
              <div key={i} className="blur-sm opacity-40">
                {renderItem(item)}
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent absolute inset-0 rounded-xl" />
            <div className="relative z-10 text-center px-6 py-8 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-1">
                {lockedCount} more {tab} locked
              </h3>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                Subscribe to unlock the full agronomy database — chemicals, diseases, pests, weeds and fertilisers.
              </p>
              {onSignUp && (
                <button
                  onClick={onSignUp}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-900/40 hover:scale-[1.02]"
                >
                  Start Free Trial — Unlock Full Access
                </button>
              )}
              <p className="text-xs text-slate-600 mt-3">$2.99/mo after free trial</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
        <Database className="w-6 h-6 text-slate-600" />
      </div>
      <h3 className="text-slate-400 font-semibold mb-1">No {tab} found</h3>
      <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
    </div>
  );
}
