export interface MaterialDetail {
  name: string;      // Ej: "Hilo encerado", "Tacón de hule"
  cost: number;      // El costo individual de este material
}

export interface ShoeComponent {
  id: string;
  componentName: string; // Ej: "Suela", "Corte", "Forro"
  materials: MaterialDetail[];
  selected?: boolean;    // Para saber qué pestaña estamos viendo
}

export interface ProductStyle {
  id?: string;
  hasChanges?: boolean;
  isHidden?: boolean;
  styleName: string;
  description?: string;
  taxesPercent: number;  // % de impuestos (editable)
  freightCost: number;   // $ de flete (editable)
  gallery: { colorName: string, imageUrl: string }[];
  components: ShoeComponent[];
}

export interface ProductCategory {
  categoryName: string;
  description: string;
  styles: ProductStyle[];
  isExpanded?: boolean;
  marginPercent?: number;
  selectedCurrency?: 'USD' | 'EUR' | 'JPY';
}