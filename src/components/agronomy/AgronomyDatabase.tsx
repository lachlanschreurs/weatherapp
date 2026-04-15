import { useState, useEffect, useMemo } from 'react';
import { FlaskConical, Bug, Leaf, X, BookOpen, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Chemical, Disease, Pest, Weed, AgronomyTab } from './types';
import { AgronomySearch } from './AgronomySearch';
import { ChemicalCard } from './ChemicalCard';
import { DiseaseCard } from './DiseaseCard';
import { PestCard } from './PestCard';
import { WeedCard } from './WeedCard';

const TABS: { id: AgronomyTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'chemicals', label: 'Chemicals', icon: <FlaskConical className="w-4 h-4" />, color: 'text-emerald-400' },
  { id: 'diseases', label: 'Diseases', icon: <Bug className="w-4 h-4" />, color: 'text-red-400' },
  { id: 'pests', label: 'Pests', icon: <Bug className="w-4 h-4" />, color: 'text-amber-400' },
  { id: 'weeds', label: 'Weeds', icon: <Leaf className="w-4 h-4" />, color: 'text-orange-400' },
];

interface Props {
  onClose: () => void;
}

export function AgronomyDatabase({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<AgronomyTab>('chemicals');
  const [query, setQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [loading, setLoading] = useState(true);

  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [pests, setPests] = useState<Pest[]>([]);
  const [weeds, setWeeds] = useState<Weed[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [chemRes, disRes, pestRes, weedRes] = await Promise.all([
        supabase.from('agro_chemicals').select('*').order('product_name'),
        supabase.from('agro_diseases').select(`
          *,
          chemicals:agro_disease_chemicals(
            application_notes,
            efficacy_rating,
            chemical:agro_chemicals(*)
          )
        `).order('disease_name'),
        supabase.from('agro_pests').select(`
          *,
          chemicals:agro_pest_chemicals(
            application_notes,
            efficacy_rating,
            chemical:agro_chemicals(*)
          )
        `).order('pest_name'),
        supabase.from('agro_weeds').select(`
          *,
          chemicals:agro_weed_chemicals(
            application_notes,
            efficacy_rating,
            chemical:agro_chemicals(*)
          )
        `).order('weed_name'),
      ]);

      if (chemRes.data) setChemicals(chemRes.data);
      if (disRes.data) setDiseases(disRes.data as unknown as Disease[]);
      if (pestRes.data) setPests(pestRes.data as unknown as Pest[]);
      if (weedRes.data) setWeeds(weedRes.data as unknown as Weed[]);
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
    return Array.from(crops).sort();
  }, [chemicals, diseases, pests, weeds]);

  const allActiveIngredients = useMemo(() => {
    const ais = new Set<string>();
    chemicals.forEach(c => { if (c.active_ingredient) ais.add(c.active_ingredient); });
    return Array.from(ais).sort();
  }, [chemicals]);

  const filteredChemicals = useMemo(() => {
    return chemicals.filter(c => {
      const q = query.toLowerCase();
      const matchQuery = !q ||
        c.product_name.toLowerCase().includes(q) ||
        c.active_ingredient.toLowerCase().includes(q) ||
        c.chemical_group.toLowerCase().includes(q) ||
        c.target_issues.some(t => t.toLowerCase().includes(q));
      const matchCrop = !cropFilter || c.registered_crops.includes(cropFilter);
      const matchCat = !categoryFilter || c.category === categoryFilter;
      const matchAI = !activeIngredient || c.active_ingredient === activeIngredient;
      return matchQuery && matchCrop && matchCat && matchAI;
    });
  }, [chemicals, query, cropFilter, categoryFilter, activeIngredient]);

  const filteredDiseases = useMemo(() => {
    return diseases.filter(d => {
      const q = query.toLowerCase();
      const matchQuery = !q ||
        d.disease_name.toLowerCase().includes(q) ||
        d.common_name.toLowerCase().includes(q) ||
        d.pathogen_type.toLowerCase().includes(q) ||
        d.symptoms.toLowerCase().includes(q);
      const matchCrop = !cropFilter || d.affected_crops.includes(cropFilter);
      return matchQuery && matchCrop;
    });
  }, [diseases, query, cropFilter]);

  const filteredPests = useMemo(() => {
    return pests.filter(p => {
      const q = query.toLowerCase();
      const matchQuery = !q ||
        p.pest_name.toLowerCase().includes(q) ||
        p.common_name.toLowerCase().includes(q) ||
        p.pest_type.toLowerCase().includes(q) ||
        p.damage_caused.toLowerCase().includes(q);
      const matchCrop = !cropFilter || p.affected_crops.includes(cropFilter);
      return matchQuery && matchCrop;
    });
  }, [pests, query, cropFilter]);

  const filteredWeeds = useMemo(() => {
    return weeds.filter(w => {
      const q = query.toLowerCase();
      const matchQuery = !q ||
        w.weed_name.toLowerCase().includes(q) ||
        w.common_name.toLowerCase().includes(q) ||
        w.weed_family.toLowerCase().includes(q) ||
        w.growth_habit.toLowerCase().includes(q);
      const matchCrop = !cropFilter || w.affected_environments.includes(cropFilter);
      return matchQuery && matchCrop;
    });
  }, [weeds, query, cropFilter]);

  const counts = {
    chemicals: filteredChemicals.length,
    diseases: filteredDiseases.length,
    pests: filteredPests.length,
    weeds: filteredWeeds.length,
  };

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
                <h1 className="text-xl font-black text-white tracking-tight">Agronomy Database</h1>
                <p className="text-xs text-slate-500 font-medium">Australian agricultural reference — diseases, chemicals, pests & weeds</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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

          <div className="flex gap-1 mt-4 overflow-x-auto pb-0.5">
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
                <div className="space-y-3">
                  {filteredChemicals.length === 0 ? (
                    <EmptyState tab="chemicals" />
                  ) : (
                    filteredChemicals.map(c => <ChemicalCard key={c.id} chemical={c} />)
                  )}
                </div>
              )}

              {activeTab === 'diseases' && (
                <div className="space-y-3">
                  {filteredDiseases.length === 0 ? (
                    <EmptyState tab="diseases" />
                  ) : (
                    filteredDiseases.map(d => <DiseaseCard key={d.id} disease={d} />)
                  )}
                </div>
              )}

              {activeTab === 'pests' && (
                <div className="space-y-3">
                  {filteredPests.length === 0 ? (
                    <EmptyState tab="pests" />
                  ) : (
                    filteredPests.map(p => <PestCard key={p.id} pest={p} />)
                  )}
                </div>
              )}

              {activeTab === 'weeds' && (
                <div className="space-y-3">
                  {filteredWeeds.length === 0 ? (
                    <EmptyState tab="weeds" />
                  ) : (
                    filteredWeeds.map(w => <WeedCard key={w.id} weed={w} />)
                  )}
                </div>
              )}

              <div className="mt-8 py-5 border-t border-slate-800 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">FarmCast Agronomy Reference Database</p>
                </div>
                <p className="text-xs text-slate-700 max-w-lg mx-auto">
                  Data is for reference and educational purposes. Always read and follow product labels. Consult an agronomist for site-specific advice. Registrations may vary by state — confirm with APVMA.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
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
