export type ChemicalCategory = 'fungicide' | 'insecticide' | 'herbicide' | 'miticide' | 'nematicide' | 'other';
export type EfficacyRating = 'high' | 'moderate' | 'low' | '';

export interface Chemical {
  id: string;
  product_name: string;
  active_ingredient: string;
  chemical_group: string;
  mode_of_action: string;
  formulation_type: string;
  category: ChemicalCategory;
  manufacturer: string;
  registered_crops: string[];
  target_issues: string[];
  application_rate: string;
  withholding_period: string;
  reentry_period: string;
  label_notes: string;
  resistance_notes: string;
}

export interface Disease {
  id: string;
  disease_name: string;
  common_name: string;
  pathogen_type: string;
  affected_crops: string[];
  symptoms: string;
  conditions_favouring: string;
  management_options: string;
  prevention_notes: string;
  chemicals?: Array<{ chemical: Chemical; application_notes: string; efficacy_rating: EfficacyRating }>;
}

export interface Pest {
  id: string;
  pest_name: string;
  common_name: string;
  pest_type: string;
  affected_crops: string[];
  identification_details: string;
  damage_caused: string;
  lifecycle_notes: string;
  monitoring_notes: string;
  treatment_options: string;
  chemicals?: Array<{ chemical: Chemical; application_notes: string; efficacy_rating: EfficacyRating }>;
}

export interface Weed {
  id: string;
  weed_name: string;
  common_name: string;
  weed_family: string;
  affected_environments: string[];
  identification_details: string;
  growth_habit: string;
  control_methods: string;
  resistance_notes: string;
  chemicals?: Array<{ chemical: Chemical; application_notes: string; efficacy_rating: EfficacyRating }>;
}

export type AgronomyTab = 'chemicals' | 'diseases' | 'pests' | 'weeds';

export interface SearchState {
  query: string;
  crop: string;
  category: string;
}
