import { Component, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCategory, ProductStyle, ShoeComponent } from '../../1-models/po.interface';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './po-form.component.html'
})
export class PoFormComponent implements OnInit {
  
  private http = inject(HttpClient);

  exchangeRates: { [key: string]: number } = {
    USD: 1,
    EUR: 0.874771,
    JPY: 162.3815
  };
  
  isModalOpen = false;
  modalData: { categoryName: string, style: ProductStyle | null, currentIndex: number } = { categoryName: '', style: null, currentIndex: 0 };
  activeImageIndices: { [key: string]: number } = {};
  activeTabIndices: { [key: string]: number } = {};

  ngOnInit() {
    console.log(
      "%c🚀 Cost Calculator Built with Angular by Rodrigo Ávila\n%cLet's connect: https://eldonchambas.github.io/PersonalWebsiteEnglishRodrigoAvila/",
      "font-size: 14px; font-weight: bold; color: #FFFFFF;",
      "font-size: 12px; color: gray;"
    );

    this.obtenerTasasDeCambio();
  }
  
  obtenerTasasDeCambio() {
    // La nueva URL de la API: dominio .dev, versión /v1, y parámetros oficiales
    const apiUrl = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,JPY';

    this.http.get<any>(apiUrl).subscribe({
      next: (respuesta: any) => {
        // La API responde exitosamente, actualizamos nuestros valores
        this.exchangeRates['EUR'] = respuesta.rates.EUR;
        this.exchangeRates['JPY'] = respuesta.rates.JPY;
        console.log('✅ Tasas de cambio actualizadas en vivo:', this.exchangeRates);
      },
      error: (error: any) => {
        // Si hay un error (ej. sin internet), usamos los valores reales que configuraste
        console.warn('⚠️ No se pudieron obtener las tasas en vivo, usando valores por defecto.', error.message);
      }
    });
  }

  categories: ProductCategory[] = [
    {
      categoryName: 'Calculadora de Costos',
      description: 'Prototipo MVP para desglose de manufactura',
      isExpanded: true,
      marginPercent: 15,
      selectedCurrency: 'USD',
      styles: [
        // --- ZAPATO 1 ---
        {
          styleName: 'Edmund Plain Toe Boot',
          description: 'Construcción Goodyear Welt',
          gallery: [
            { colorName: 'Black', imageUrl: '/productos/gold-edmund/gold-edmund-black.webp' },
            { colorName: 'Brown', imageUrl: '/productos/gold-edmund/gold-edmund-brown.webp' },
            { colorName: 'Whiskey', imageUrl: '/productos/gold-edmund/gold-edmund-whiskey.webp' },
            { colorName: 'Polo', imageUrl: '/productos/gold-edmund/gold-edmund-polo.webp' },
            { colorName: 'Cola', imageUrl: '/productos/gold-edmund/gold-edmund-cola.webp' }
          ],
          taxesPercent: 12, // Porcentaje inicial
          freightCost: 15,  // Flete inicial
          components: [
            {
              id: 'comp-suela',
              componentName: 'Fondo y Suela',
              materials: [
                { name: 'Vibram Outsole', cost: 12.50 },
                { name: 'Entresuela de Cuero', cost: 8.00 },
                { name: 'Hilo Goodyear', cost: 1.50 },
                { name: 'Cerco (Welt)', cost: 3.00 }
              ]
            },
            {
              id: 'comp-corte',
              componentName: 'Corte (Piel)',
              materials: [
                { name: 'Horween Chromexcel', cost: 22.00 },
                { name: 'Hilo de costura', cost: 0.80 },
                { name: 'Ojetes metálicos', cost: 1.20 },
                { name: 'Agujetas enceradas', cost: 0.85 }
              ]
            },
            {
              id: 'comp-empaque',
              componentName: 'Forro y Empaque',
              materials: [
                { name: 'Forro de Res', cost: 4.50 },
                { name: 'Caja Palomo', cost: 3.50 },
                { name: 'Dust bags', cost: 1.50 }
              ]
            }
          ]
        },
        // --- ZAPATO 2 ---
        {
          styleName: 'Sherman Chelsea Boot',
          description: 'Construcción 360° Flat Leather',
          gallery: [
            { colorName: 'Black', imageUrl: '/productos/gold-sherman/gold-chelsea-Black.webp' },
            { colorName: 'Brown', imageUrl: '/productos/gold-sherman/gold-chelsea-brown.webp' }
          ],
          taxesPercent: 12,
          freightCost: 15,
          components: [
            {
              id: 'comp-suela-sherman',
              componentName: 'Fondo y Suela',
              materials: [
                { name: 'Vibram Outsole', cost: 12.50 },
                { name: 'Entresuela', cost: 7.50 },
                { name: 'Welt', cost: 3.00 }
              ]
            },
            {
              id: 'comp-corte-sherman',
              componentName: 'Corte (Piel)',
              materials: [
                { name: 'C.F. Stead Repello Suede', cost: 24.00 },
                { name: 'Elásticos laterales', cost: 3.00 },
                { name: 'Tiradores', cost: 1.00 }
              ]
            }
          ]
        },
        // --- ZAPATO 3 ---
        {
          styleName: 'James Slipper',
          description: 'Slipper de casa premium',
          gallery: [
            { colorName: 'Suede Toast', imageUrl: '/productos/gold-james/gold-james-suedetoast.webp' },
            { colorName: 'Waxy Brown', imageUrl: '/productos/gold-james/gold-james-waxy.webp' }
          ],
          taxesPercent: 12,
          freightCost: 10,
          components: [
            {
              id: 'comp-suela-james',
              componentName: 'Fondo y Suela',
              materials: [
                { name: 'Suela de gamuza', cost: 5.00 },
                { name: 'Acolchado interno', cost: 2.50 }
              ]
            },
            {
              id: 'comp-corte-james',
              componentName: 'Corte (Piel)',
              materials: [
                { name: 'Waxy Pull-up Leather', cost: 15.00 },
                { name: 'Ribete', cost: 1.50 }
              ]
            }
          ]
        }
      ]
    }
  ];

  // ==========================================
  // NUEVOS MÉTODOS DE CÁLCULO FINANCIERO
  // ==========================================

  getComponentCost(component: ShoeComponent): number {
    return component.materials.reduce((sum, mat) => sum + mat.cost, 0);
  }

  // 1. Costo puro de los materiales (Lo que cobra Duramas)
  getDuramasCost(style: ProductStyle): number {
    return style.components.reduce((sum, comp) => sum + this.getComponentCost(comp), 0);
  }

  // 2. Costo Duramas + El Porcentaje global de la categoría (Precio FOB)
  getFobPrice(category: ProductCategory, style: ProductStyle): number {
    const duramasCost = this.getDuramasCost(style);
    const margin = category.marginPercent || 0; 
    return duramasCost * (1 + (margin / 100));
  }

  // 3. Precio Final (FOB + Taxes + Freight)
  getLandingPrice(category: ProductCategory, style: ProductStyle): number {
    const fobPrice = this.getFobPrice(category, style);
    const taxesAmount = fobPrice * (style.taxesPercent / 100);
    return fobPrice + taxesAmount + style.freightCost;
  }
  
  // ==========================================
  // CONTROLES DEL CARRUSEL PEQUEÑO
  // ==========================================

  // ==========================================
  // CONTROLES DE IMAGEN Y PESTAÑAS (INDEPENDIENTES)
  // ==========================================

  // Para el carrusel de imágenes
  getImageIndex(categoryName: string, styleName: string): number {
    return this.activeImageIndices[categoryName + '-' + styleName] || 0;
  }

  nextImage(categoryName: string, styleName: string, length: number, event: Event) {
    event.stopPropagation();
    const key = categoryName + '-' + styleName;
    const current = this.getImageIndex(categoryName, styleName);
    this.activeImageIndices[key] = (current + 1) % length;
  }

  prevImage(categoryName: string, styleName: string, length: number, event: Event) {
    event.stopPropagation();
    const key = categoryName + '-' + styleName;
    const current = this.getImageIndex(categoryName, styleName);
    this.activeImageIndices[key] = (current - 1 + length) % length;
  }

  // Para las pestañas de componentes
  getTabIndex(categoryName: string, styleName: string): number {
    return this.activeTabIndices[categoryName + '-' + styleName] || 0;
  }

  setTabIndex(categoryName: string, styleName: string, index: number) {
    this.activeTabIndices[categoryName + '-' + styleName] = index;
  }

  // ==========================================
  // CONVERTIDOR DE DIVISAS (Solo Landing Price)
  // ==========================================

  

  // Calcula el Landing Price y lo multiplica por la tasa de cambio
  getConvertedLandingPrice(category: ProductCategory, style: ProductStyle): number {
    const usdPrice = this.getLandingPrice(category, style);
    const currency = category.selectedCurrency || 'USD';
    return usdPrice * this.exchangeRates[currency];
  }

  // Devuelve el símbolo correcto para la vista
  getCurrencySymbol(currency?: string): string {
    switch (currency) {
      case 'EUR': return '€';
      case 'JPY': return '¥';
      default: return '$';
    }
  }

  // ==========================================
  // CONTROLES DEL MODAL GIGANTE DE IMÁGENES
  // ==========================================

  openModal(categoryName: string, style: ProductStyle, startIndex: number) {
    this.modalData = { categoryName, style, currentIndex: startIndex };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  modalNext(event: Event) {
    event.stopPropagation();
    if (this.modalData.style && this.modalData.style.gallery) {
      const len = this.modalData.style.gallery.length; // <-- AQUÍ
      this.modalData.currentIndex = (this.modalData.currentIndex + 1) % len;
      const key = this.modalData.categoryName + '-' + this.modalData.style.styleName;
      this.activeImageIndices[key] = this.modalData.currentIndex;
    }
  }

  modalPrev(event: Event) {
    event.stopPropagation();
    if (this.modalData.style && this.modalData.style.gallery) {
      const len = this.modalData.style.gallery.length; // <-- Y AQUÍ
      this.modalData.currentIndex = (this.modalData.currentIndex - 1 + len) % len;
      const key = this.modalData.categoryName + '-' + this.modalData.style.styleName;
      this.activeImageIndices[key] = this.modalData.currentIndex;
    }
  }
}