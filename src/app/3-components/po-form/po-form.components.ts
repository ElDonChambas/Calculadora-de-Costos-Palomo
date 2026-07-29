import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCategory, ProductStyle, ShoeComponent } from '../../1-models/po.interface';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import * as Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './po-form.component.html'
})
export class PoFormComponent implements OnInit {
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  exchangeRates: { [key: string]: number } = {
    USD: 1,
    EUR: 0.874771,
    JPY: 162.3815
  };
  
  isModalOpen = false;
  modalData: { categoryName: string, style: ProductStyle | null, currentIndex: number } = { categoryName: '', style: null, currentIndex: 0 };
  activeImageIndices: { [key: string]: number } = {};
  activeTabIndices: { [key: string]: number } = {};

  async ngOnInit() {
    console.log(
      "%c🚀 Cost Calculator Built with Angular by Rodrigo Ávila\n%cLet's connect: https://eldonchambas.github.io/PersonalWebsiteEnglishRodrigoAvila/",
      "font-size: 14px; font-weight: bold; color: #FFFFFF;",
      "font-size: 12px; color: gray;"
    );

    this.obtenerTasasDeCambio();
    await this.cargarEstilosDesdeBD();
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
              id: 'comp-upper',
              componentName: 'A. Upper',
              materials: [
                { name: 'Portland Black 1.1-1.3', cost: 11.22 },
                { name: 'Kip Lining Negro 0.8-1.0', cost: 0.35 }
              ]
            },
            {
              id: 'comp-linings',
              componentName: 'B. Linings / Sundries',
              materials: [
                { name: 'Footbed Kip Lining', cost: 0.90 },
                { name: 'Linings Cathay Tan', cost: 3.15 },
                { name: 'Threads', cost: 0.25 },
                { name: 'Invisible Eyelets', cost: 0.96 },
                { name: 'Cotton Laces', cost: 0.55 },
                { name: 'Reinforcements', cost: 1.26 }
              ]
            },
            {
              id: 'comp-bottom',
              componentName: 'C. Bottom Unit',
              materials: [
                { name: 'Leather Sole H-Verde', cost: 5.10 },
                { name: 'Heel MCaffee/Leather', cost: 5.50 },
                { name: 'Welt Cerco Strong Negro', cost: 4.35 },
                { name: 'Footbed & Cushions', cost: 4.00 }
              ]
            },
            {
              id: 'comp-packaging',
              componentName: 'D. Packaging',
              materials: [
                { name: 'Unit Box Small Palomo', cost: 1.50 },
                { name: 'Master Box Small', cost: 0.60 },
                { name: 'Tissue Paper', cost: 0.75 },
                { name: 'Labeling', cost: 0.65 },
                { name: 'Shoes Bag', cost: 2.50 }
              ]
            },
            {
              id: 'comp-misc',
              componentName: 'E. Miscellaneous',
              materials: [
                { name: 'Costos Varios', cost: 1.95 }
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
              id: 'comp-upper-sherman',
              componentName: 'A. Upper',
              materials: [
                { name: 'C.F. Stead Repello Suede', cost: 24.00 }
              ]
            },
            {
              id: 'comp-linings-sherman',
              componentName: 'B. Linings / Sundries',
              materials: [
                { name: 'Elásticos laterales', cost: 3.00 },
                { name: 'Tiradores', cost: 1.00 },
                { name: 'Linings', cost: 2.50 }
              ]
            },
            {
              id: 'comp-bottom-sherman',
              componentName: 'C. Bottom Unit',
              materials: [
                { name: 'Vibram Outsole', cost: 12.50 },
                { name: 'Entresuela', cost: 7.50 },
                { name: 'Welt', cost: 3.00 }
              ]
            },
            {
              id: 'comp-packaging-sherman',
              componentName: 'D. Packaging',
              materials: [
                { name: 'Unit Box', cost: 1.50 },
                { name: 'Tissue Paper', cost: 0.75 }
              ]
            },
            {
              id: 'comp-misc-sherman',
              componentName: 'E. Miscellaneous',
              materials: [
                { name: 'Costos Varios', cost: 1.95 }
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
              id: 'comp-upper-sherman',
              componentName: 'A. Upper',
              materials: [
                { name: 'C.F. Stead Repello Suede', cost: 24.00 }
              ]
            },
            {
              id: 'comp-linings-sherman',
              componentName: 'B. Linings / Sundries',
              materials: [
                { name: 'Elásticos laterales', cost: 3.00 },
                { name: 'Tiradores', cost: 1.00 },
                { name: 'Linings', cost: 2.50 }
              ]
            },
            {
              id: 'comp-bottom-sherman',
              componentName: 'C. Bottom Unit',
              materials: [
                { name: 'Vibram Outsole', cost: 12.50 },
                { name: 'Entresuela', cost: 7.50 },
                { name: 'Welt', cost: 3.00 }
              ]
            },
            {
              id: 'comp-packaging-sherman',
              componentName: 'D. Packaging',
              materials: [
                { name: 'Unit Box', cost: 1.50 },
                { name: 'Tissue Paper', cost: 0.75 }
              ]
            },
            {
              id: 'comp-misc-sherman',
              componentName: 'E. Miscellaneous',
              materials: [
                { name: 'Costos Varios', cost: 1.95 }
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
  // CONVERTIDOR DE DIVISAS GLOBAL
  // ==========================================

  // 1. Convierte de USD a la moneda seleccionada (Para MOSTRAR en pantalla)
  getConvertedValue(usdValue: number, currency?: string): number {
    const rate = this.exchangeRates[currency || 'USD'] || 1;
    return usdValue * rate;
  }

  // 2. Convierte la moneda seleccionada de vuelta a USD (Para GUARDAR cuando el usuario edita)
  setUsdFromConverted(convertedValue: number, currency?: string): number {
    if (convertedValue === null || convertedValue === undefined) return 0;
    const rate = this.exchangeRates[currency || 'USD'] || 1;
    return convertedValue / rate;
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

  // ==========================================
  // IMPORTACIÓN Y EXPORTACIÓN DE CSV
  // ==========================================

  // 1. Generar y descargar la plantilla de ejemplo
  descargarPlantillaCSV() {
    const encabezados = "Shoe_Name,Taxes_%,Freight_$,Component_Category,Material_Name,Material_Cost\n";
    const filaEjemplo1 = "Ernest Cap Toe Boot,12,15,A. Upper,Portland Black 1.1-1.3,11.22\n";
    const filaEjemplo2 = "Ernest Cap Toe Boot,12,15,B. Linings / Sundries,Footbed,0.90\n";
    const filaEjemplo3 = "Ernest Cap Toe Boot,12,15,C. Bottom Unit,Leather Sole H-Verde,5.10\n";
    const filaEjemplo4 = "Ernest Cap Toe Boot,12,15,D. Packaging,Unit box,1.50\n";
    const filaEjemplo5 = "Ernest Cap Toe Boot,12,15,E. Miscellaneous,Otros,1.20\n";

    const filaEjemplo6 = "Palomo Loafer,12,15,A. Upper,Portland Black 1.1-1.3,11.22\n";
    const filaEjemplo7 = "Palomo Loafer,12,15,B. Linings / Sundries,Footbed,0.90\n";
    const filaEjemplo8 = "Palomo Loafer,12,15,C. Bottom Unit,Leather Sole H-Verde,5.10\n";
    const filaEjemplo9 = "Palomo Loafer,12,15,D. Packaging,Unit box,1.50\n";
    const filaEjemplo10 = "Palomo Loafer,12,15,E. Miscellaneous,Otros,1.20\n";

    const contenidoCSV = encabezados + filaEjemplo1 + filaEjemplo2 + filaEjemplo3 + filaEjemplo4 + filaEjemplo5 + filaEjemplo6 + filaEjemplo7 + filaEjemplo8 + filaEjemplo9 + filaEjemplo10;

    // Crear un Blob y forzar la descarga en el navegador
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Plantilla_Costos_Palomo.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 2. Leer el archivo cuando el usuario lo selecciona
  onArchivoSeleccionado(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      Papa.parse(archivo, {
        header: true,
        skipEmptyLines: true,
        complete: (resultados) => {
          this.procesarDatosCSV(resultados.data);
          // Opcional: Resetear el input para poder subir el mismo archivo modificado
          event.target.value = '';
        },
        error: (error) => {
          console.error("Error leyendo el CSV:", error);
          alert("Hubo un error leyendo el archivo CSV.");
        }
      });
    }
  }

  // 3. Transformar las filas planas del Excel a la estructura anidada de Angular
  procesarDatosCSV(filas: any[]) {
    const zapatosAgrupados: { [nombre: string]: ProductStyle } = {};

    filas.forEach(fila => {
      const nombreZapato = fila['Shoe_Name']?.trim();
      if (!nombreZapato) return;

      // Si el zapato no existe aún, lo creamos con las 5 categorías por defecto
      if (!zapatosAgrupados[nombreZapato]) {
        zapatosAgrupados[nombreZapato] = {
          styleName: nombreZapato,
          description: 'Importado desde CSV',
          gallery: [], // Sin fotos por defecto al importar
          taxesPercent: parseFloat(fila['Taxes_%']) || 12,
          freightCost: parseFloat(fila['Freight_$']) || 15,
          components: [
            { id: 'comp-upper', componentName: 'A. Upper', materials: [] },
            { id: 'comp-linings', componentName: 'B. Linings / Sundries', materials: [] },
            { id: 'comp-bottom', componentName: 'C. Bottom Unit', materials: [] },
            { id: 'comp-packaging', componentName: 'D. Packaging', materials: [] },
            { id: 'comp-misc', componentName: 'E. Miscellaneous', materials: [] }
          ]
        };
      }

      // Buscar en qué pestaña (categoría) va este material
      const categoriaDestino = zapatosAgrupados[nombreZapato].components.find(
        c => c.componentName === fila['Component_Category']?.trim()
      );

      // Inyectar el material si existe
      if (categoriaDestino && fila['Material_Name']) {
        categoriaDestino.materials.push({
          name: fila['Material_Name'].trim(),
          cost: parseFloat(fila['Material_Cost']) || 0
        });
      }
    });

    // Extraer los zapatos creados y empujarlos a la categoría principal "Calculadora de Costos"
    const nuevosZapatos = Object.values(zapatosAgrupados);
    
    // Suponiendo que la calculadora es la primera categoría (índice 0)
    if (this.categories.length > 0) {
      this.categories[0].styles = [...this.categories[0].styles, ...nuevosZapatos];
      alert(`¡Se importaron ${nuevosZapatos.length} estilos correctamente!`);
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // AGREGAR MATERIALES
  // ==========================================

  agregarMaterial(componente: ShoeComponent) {
    componente.materials.push({ name: 'Nuevo Material', cost: 0 });
  }

  // ==========================================
  // MODAL DE VARIANTES (FOTOS Y COLORES)
  // ==========================================

  isVariantsModalOpen = false;
  activeStyleForVariants: ProductStyle | null = null;

  abrirModalVariantes(style: ProductStyle) {
    this.activeStyleForVariants = style;
    this.isVariantsModalOpen = true;
  }

  cerrarModalVariantes() {
    this.isVariantsModalOpen = false;
    this.activeStyleForVariants = null;
  }

  agregarVariante() {
    if (this.activeStyleForVariants) {
      this.activeStyleForVariants.gallery.push({ colorName: 'Nuevo Color', imageUrl: '' });
    }
  }

  eliminarVariante(index: number) {
    if (this.activeStyleForVariants) {
      this.activeStyleForVariants.gallery.splice(index, 1);
      
      // Ajustar el índice del carrusel por si eliminamos la foto que estamos viendo
      if (this.activeStyleForVariants.gallery.length === 0) {
        // No hacer nada, se queda vacío
      } else if (index === 0) {
        // Se resetea al primer elemento
      }
    }
  }

  onImagenSeleccionada(event: any, variante: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // e.target.result contiene la imagen convertida a texto Base64
        variante.imageUrl = e.target.result;
        this.cdr.detectChanges(); 
      };
      reader.readAsDataURL(file);
    }
  }

  // Inicializar Supabase
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  // ==========================================
  // AGREGAR PRODUCTOS
  // ==========================================
  
  agregarEstilo(categoria: ProductCategory) {
    const nuevoEstilo: ProductStyle = {
      styleName: 'Nuevo Estilo',
      description: 'Descripción del zapato...',
      taxesPercent: 12,
      freightCost: 15,
      gallery: [],
      components: [
        { id: 'comp-upper', componentName: 'A. Upper', materials: [] },
        { id: 'comp-linings', componentName: 'B. Linings / Sundries', materials: [] },
        { id: 'comp-bottom', componentName: 'C. Bottom Unit', materials: [] },
        { id: 'comp-packaging', componentName: 'D. Packaging', materials: [] },
        { id: 'comp-misc', componentName: 'E. Miscellaneous', materials: [] }
      ]
    };
    categoria.styles.push(nuevoEstilo);
    this.cdr.detectChanges(); // Forzamos actualización visual
  }

  // ==========================================
  // GUARDAR PRODUCTOS EN SUPABASE
  // ==========================================
    async guardarEstilo(categoria: ProductCategory, estilo: ProductStyle) {
    try {
      // Si no tiene ID, lo creamos basándonos en el nombre (ej: "Edmund Plain Toe" -> "edmund-plain-toe")
      if (!estilo.id) {
        estilo.id = estilo.styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }

      const { data, error } = await this.supabase
        .from('styles')
        .upsert({
          id: estilo.id, 
          category_name: categoria.categoryName,
          style_name: estilo.styleName,
          description: estilo.description,
          taxes_percent: estilo.taxesPercent,
          freight_cost: estilo.freightCost,
          gallery: estilo.gallery,
          components: estilo.components
        })
        .select()
        .single();

      if (error) throw error;
      
      // Apagamos el botón porque ya se guardó
      estilo.hasChanges = false;
      this.cdr.detectChanges();
      alert(`¡Estilo "${estilo.styleName}" guardado con éxito!`);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  }

    // ==========================================
    // CARGAR PRODUCTOS DE SUPABASE
    // ==========================================
    async cargarEstilosDesdeBD() {
    try {
      const { data, error } = await this.supabase
        .from('styles')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        // Mapeamos los datos de la BD (snake_case) a tu Interfaz (camelCase)
        const estilosRecuperados: ProductStyle[] = data.map((item: any) => ({
          id: item.id,
          hasChanges: false,
          styleName: item.style_name,
          description: item.description,
          taxesPercent: item.taxes_percent,
          freightCost: item.freight_cost,
          gallery: item.gallery,
          components: item.components
        }));

        // Asignamos los estilos a la primera categoría (puedes ajustar esto luego si hay más categorías)
        if (this.categories.length > 0) {
          this.categories[0].styles = estilosRecuperados;
        }
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error cargando estilos:', error);
    }
  }
}