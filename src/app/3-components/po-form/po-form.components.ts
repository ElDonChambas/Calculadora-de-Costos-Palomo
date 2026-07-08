import { Component, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Asegúrate de que estas interfaces coincidan con tu nuevo archivo po.interface.ts
import { ProductCategory, ProductStyle, ShoeComponent } from '../../1-models/po.interface';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './po-form.component.html'
})
export class PoFormComponent implements OnInit {
  
  isModalOpen = false;
  modalData: { categoryName: string, style: ProductStyle | null, currentIndex: number } = { categoryName: '', style: null, currentIndex: 0 };
  activeVariantIndices: { [styleName: string]: number } = {};

  ngOnInit() {
    console.log(
      "%c🚀 Cost Calculator Built with Angular by Rodrigo Ávila\n%cLet's connect: https://eldonchambas.github.io/PersonalWebsiteEnglishRodrigoAvila/",
      "font-size: 14px; font-weight: bold; color: #FFFFFF;",
      "font-size: 12px; color: gray;"
    );
  }

  categories: ProductCategory[] = [
    {
      categoryName: 'Calculadora de Costos',
      description: 'Prototipo MVP para desglose de manufactura',
      isExpanded: true,
      styles: [
        // --- ZAPATO 1 ---
        {
          styleName: 'Edmund Plain Toe Boot',
          description: 'Construcción Goodyear Welt',
          taxesPercent: 12, // Porcentaje inicial
          freightCost: 15,  // Flete inicial
          components: [
            {
              id: 'comp-suela',
              componentName: 'Fondo y Suela',
              imageUrl: '/productos/gold-edmund/gold-edmund-black.webp',
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
              imageUrl: '/productos/gold-edmund/gold-edmund-brown.webp',
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
              imageUrl: '/productos/gold-edmund/gold-edmund-whiskey.webp',
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
          taxesPercent: 12,
          freightCost: 15,
          components: [
            {
              id: 'comp-suela-sherman',
              componentName: 'Fondo y Suela',
              imageUrl: '/productos/gold-sherman/gold-chelsea-Black.webp',
              materials: [
                { name: 'Vibram Outsole', cost: 12.50 },
                { name: 'Entresuela', cost: 7.50 },
                { name: 'Welt', cost: 3.00 }
              ]
            },
            {
              id: 'comp-corte-sherman',
              componentName: 'Corte (Piel)',
              imageUrl: '/productos/gold-sherman/gold-chelsea-brown.webp',
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
          taxesPercent: 12,
          freightCost: 10,
          components: [
            {
              id: 'comp-suela-james',
              componentName: 'Fondo y Suela',
              imageUrl: '/productos/gold-james/gold-james-suedetoast.webp',
              materials: [
                { name: 'Suela de gamuza', cost: 5.00 },
                { name: 'Acolchado interno', cost: 2.50 }
              ]
            },
            {
              id: 'comp-corte-james',
              componentName: 'Corte (Piel)',
              imageUrl: '/productos/gold-james/gold-james-waxy.webp',
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
  // MÉTODOS DE CÁLCULO FINANCIERO
  // ==========================================

  getComponentCost(component: ShoeComponent): number {
    return component.materials.reduce((sum, mat) => sum + mat.cost, 0);
  }

  getManufacturingCost(style: ProductStyle): number {
    return style.components.reduce((sum, comp) => sum + this.getComponentCost(comp), 0);
  }

  getLandingPrice(style: ProductStyle): number {
    const mfgCost = this.getManufacturingCost(style);
    const taxesAmount = mfgCost * (style.taxesPercent / 100);
    return mfgCost + taxesAmount + style.freightCost;
  }

  // ==========================================
  // CONTROLES DEL CARRUSEL PEQUEÑO
  // ==========================================

  getVariantIndex(categoryName: string, styleName: string): number {
    const key = categoryName + '-' + styleName;
    return this.activeVariantIndices[key] || 0;
  }

  nextVariant(categoryName: string, styleName: string, length: number, event: Event) {
    event.stopPropagation();
    const key = categoryName + '-' + styleName;
    const current = this.getVariantIndex(categoryName, styleName);
    this.activeVariantIndices[key] = (current + 1) % length;
  }

  prevVariant(categoryName: string, styleName: string, length: number, event: Event) {
    event.stopPropagation();
    const key = categoryName + '-' + styleName;
    const current = this.getVariantIndex(categoryName, styleName);
    this.activeVariantIndices[key] = (current - 1 + length) % length;
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
    if (this.modalData.style) {
      const len = this.modalData.style.components.length;
      this.modalData.currentIndex = (this.modalData.currentIndex + 1) % len;
      // Sincroniza el índice del carrusel de fondo
      const key = this.modalData.categoryName + '-' + this.modalData.style.styleName;
      this.activeVariantIndices[key] = this.modalData.currentIndex;
    }
  }

  modalPrev(event: Event) {
    event.stopPropagation();
    if (this.modalData.style) {
      const len = this.modalData.style.components.length;
      this.modalData.currentIndex = (this.modalData.currentIndex - 1 + len) % len;
      // Sincroniza el índice del carrusel de fondo
      const key = this.modalData.categoryName + '-' + this.modalData.style.styleName;
      this.activeVariantIndices[key] = this.modalData.currentIndex;
    }
  }
}