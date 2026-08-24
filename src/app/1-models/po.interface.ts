export interface MaterialDetail {
  name: string;      // Ej: "Hilo encerado", "Tacón de hule"
  cost: number;      // El costo individual de este material
  isLocked?: boolean;
}

export interface ShoeComponent {
  id: string;
  componentName: string; // Ej: "Suela", "Corte", "Forro"
  materials: MaterialDetail[];
  selected?: boolean;    // Para saber qué pestaña estamos viendo
}

export interface ProductStyle {
  id?: string;
  collection_id?: string;
  display_order?: number;
  hasChanges?: boolean;
  isHidden?: boolean;
  styleName: string;
  description?: string;
  taxesPercent: number;  
  freightCost: number;   
  gallery: { colorName: string, imageUrl: string }[];
  components: ShoeComponent[];
  
  // NUEVAS VARIABLES PARA EL SISTEMA DE PROYECCIONES (PRESETS)
  presets?: any[];               // Aquí guardaremos las proyecciones descargadas
  activePresetId?: string | null;// Para saber qué píldora está pintada (null = Oficial)
  originalData?: string;         // Backup invisible de la versión oficial
}

export interface ProductCategory {
  categoryName: string;
  description: string;
  styles: ProductStyle[];
  isExpanded?: boolean;
  marginPercent?: number;
  selectedCurrency?: 'USD' | 'EUR' | 'JPY';
}