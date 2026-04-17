export type LocationTier = 'premium' | 'standard_plus' | 'standard' | 'economic';

export const LOCATION_MULTIPLIERS: Record<LocationTier, number> = {
  premium: 1.20,
  standard_plus: 1.10,
  standard: 1.00,
  economic: 0.85,
};

export interface Neighborhood {
  id: string;
  name: string;
  nameAr: string;
  city: 'rabat' | 'sale' | 'temara';
  tier: LocationTier;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: 'souissi', name: 'Souissi', nameAr: 'السويسي', city: 'rabat', tier: 'premium' },
  { id: 'hay_riad', name: 'Hay Riad', nameAr: 'حي الرياض', city: 'rabat', tier: 'premium' },
  { id: 'les_orangers', name: 'Les Orangers', nameAr: 'البرتقاليات', city: 'rabat', tier: 'premium' },
  { id: 'ambassadeurs', name: 'Ambassadeurs', nameAr: 'السفراء', city: 'rabat', tier: 'premium' },
  { id: 'agdal', name: 'Agdal', nameAr: 'أكدال', city: 'rabat', tier: 'standard_plus' },
  { id: 'hassan', name: 'Hassan', nameAr: 'حسان', city: 'rabat', tier: 'standard_plus' },
  { id: 'tour_hassan', name: 'Tour Hassan', nameAr: 'صومعة حسان', city: 'rabat', tier: 'standard_plus' },
  { id: 'quartier_ministeres', name: 'Quartier des Ministères', nameAr: 'حي الوزارات', city: 'rabat', tier: 'standard_plus' },
  { id: 'aviation', name: 'Aviation', nameAr: 'أفياسيون', city: 'rabat', tier: 'standard_plus' },
  { id: 'mabella', name: 'Mabella', nameAr: 'مابيلا', city: 'rabat', tier: 'standard_plus' },
  { id: 'carrousel', name: 'Carrousel', nameAr: 'كاروسيل', city: 'rabat', tier: 'standard_plus' },
  { id: 'ocean', name: "L'Océan", nameAr: 'المحيط', city: 'rabat', tier: 'standard' },
  { id: 'hay_el_fath', name: 'Hay El Fath', nameAr: 'حي الفتح', city: 'rabat', tier: 'standard' },
  { id: 'les_oudayas', name: 'Les Oudayas', nameAr: 'الأوداية', city: 'rabat', tier: 'standard' },
  { id: 'youssoufia', name: 'Youssoufia', nameAr: 'اليوسفية', city: 'rabat', tier: 'standard' },
  { id: 'diour_jamaa', name: 'Diour Jamaa', nameAr: 'ديور الجامع', city: 'rabat', tier: 'standard' },
  { id: 'akkari', name: 'Akkari', nameAr: 'العكاري', city: 'rabat', tier: 'standard' },
  { id: 'medina_rabat', name: 'Médina', nameAr: 'المدينة', city: 'rabat', tier: 'standard' },
  { id: 'hay_ennahda', name: 'Hay Ennahda', nameAr: 'حي النهضة', city: 'rabat', tier: 'standard' },
  { id: 'massira', name: 'Massira', nameAr: 'المسيرة', city: 'rabat', tier: 'standard' },
  { id: 'cite_olm', name: 'Cité OLM', nameAr: 'حي أولم', city: 'rabat', tier: 'standard' },
  { id: 'takaddoum', name: 'Takaddoum', nameAr: 'التقدم', city: 'rabat', tier: 'economic' },
  { id: 'yacoub_el_mansour', name: 'Yacoub El Mansour', nameAr: 'يعقوب المنصور', city: 'rabat', tier: 'economic' },
  { id: 'douar_el_hajja', name: 'Douar El Hajja', nameAr: 'دوار الحاجة', city: 'rabat', tier: 'economic' },
  { id: 'kamra', name: 'Kamra', nameAr: 'كمرة', city: 'rabat', tier: 'economic' },
  { id: 'sala_al_jadida', name: 'Sala Al Jadida', nameAr: 'سلا الجديدة', city: 'sale', tier: 'standard_plus' },
  { id: 'hay_salam', name: 'Hay Salam', nameAr: 'حي السلام', city: 'sale', tier: 'standard_plus' },
  { id: 'tabriquet', name: 'Tabriquet', nameAr: 'تابريكت', city: 'sale', tier: 'standard' },
  { id: 'bettana', name: 'Bettana', nameAr: 'بطانة', city: 'sale', tier: 'standard' },
  { id: 'sale_medina', name: 'Salé Médina', nameAr: 'مدينة سلا', city: 'sale', tier: 'economic' },
  { id: 'hay_moulay_ismail', name: 'Hay Moulay Ismail', nameAr: 'حي مولاي إسماعيل', city: 'sale', tier: 'economic' },
  { id: 'hssaine', name: 'Hssaine', nameAr: 'حصين', city: 'sale', tier: 'economic' },
  { id: 'kariat', name: 'Kariat', nameAr: 'القرية', city: 'sale', tier: 'economic' },
  { id: 'laayoune_sale', name: 'Laâyoune', nameAr: 'العيون', city: 'sale', tier: 'economic' },
  { id: 'harhoura', name: 'Harhoura', nameAr: 'الهرهورة', city: 'temara', tier: 'premium' },
  { id: 'oulad_mtaa', name: 'Oulad Mtaa', nameAr: 'أولاد امطاع', city: 'temara', tier: 'standard_plus' },
  { id: 'guich_oudaya', name: 'Guich Oudaya', nameAr: 'كيش الوداية', city: 'temara', tier: 'standard_plus' },
  { id: 'temara_centre', name: 'Témara Centre', nameAr: 'تمارة المركز', city: 'temara', tier: 'standard' },
  { id: 'ain_atiq', name: 'Ain Atiq', nameAr: 'عين عتيق', city: 'temara', tier: 'economic' },
  { id: 'skhirat', name: 'Skhirat', nameAr: 'الصخيرات', city: 'temara', tier: 'economic' },
];

export function getNeighborhoodTier(neighborhoodId: string): LocationTier {
  const neighborhood = NEIGHBORHOODS.find((item) => item.id === neighborhoodId);
  return neighborhood?.tier ?? 'standard';
}

export function getLocationMultiplier(neighborhoodId: string): number {
  return LOCATION_MULTIPLIERS[getNeighborhoodTier(neighborhoodId)];
}
