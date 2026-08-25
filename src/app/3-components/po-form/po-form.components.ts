import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialDetail, ProductCategory, ProductStyle, ShoeComponent } from '../../1-models/po.interface';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import * as Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.development';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DragDropModule],
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

  // ==========================================
  // VARIABLES DE AUTENTICACIÓN
  // ==========================================
  isLoginModalOpen = false;
  loginData = { username: '', password: '' };
  currentUser: any = null;
  currentRole: string = 'invitado'; // Por defecto, todos son invitados

  async ngOnInit() {
    console.log(
      "%c🚀 Cost Calculator Built with Angular by Rodrigo Ávila\n%cLet's connect: https://eldonchambas.github.io/PersonalWebsiteEnglishRodrigoAvila/",
      "font-size: 14px; font-weight: bold; color: #FFFFFF;",
      "font-size: 12px; color: gray;"
    );

    this.obtenerTasasDeCambio();
    
    await this.checkSession();
    await this.cargarColecciones();
    await this.cargarEstilosDesdeBD();
  }

  // ==========================================
  // MÉTODOS DE LOGIN Y ROLES
  // ==========================================

  // 1. Revisar si la sesión sigue activa
  async checkSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      this.currentUser = session.user;
      await this.fetchUserRole(session.user.id);
    }
  }

  // 2. Buscar qué rol tiene el usuario en nuestra tabla
  async fetchUserRole(userId: string) {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error de permisos al buscar rol:', error);
    }

    if (data) {
      this.currentRole = data.role;
    }
    this.cdr.detectChanges();
  }

  // 3. Iniciar sesión (Inteligente: Acepta correos reales y usernames)
  async iniciarSesion() {
    if (!this.loginData.username || !this.loginData.password) return;

    // Limpiamos espacios y pasamos a minúsculas por si acaso
    let finalEmail = this.loginData.username.trim().toLowerCase();

    // Si NO tiene un '@', le ponemos el dominio fantasma de Palomo
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@palomo.local`;
    }
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: finalEmail, // Usamos la variable que acabamos de procesar
        password: this.loginData.password
      });

      if (error) throw error;

      this.currentUser = data.user;
      await this.fetchUserRole(data.user.id);
      
      this.isLoginModalOpen = false; 
      this.loginData = { username: '', password: '' }; 

      await this.cargarEstilosDesdeBD();

      this.cdr.detectChanges();
      
      alert(`¡Bienvenido! Rol activo: ${this.currentRole.toUpperCase()}`);
      
    } catch (error) {
      console.error('Error de login:', error);
      alert('Credenciales incorrectas. Intenta de nuevo.');
    }
  }

// 4. Cerrar sesión
  async cerrarSesion() {
    this.todosLosEstilos = []; // <-- LIMPIEZA CORRECTA
    await this.supabase.auth.signOut();
    this.currentUser = null;
    this.currentRole = 'invitado';
    await this.cargarEstilosDesdeBD();
    this.cdr.detectChanges();
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

  //===========================================
  // VARIABLES GLOBALES Y COLECCIONES
  // ==========================================
  globalMargin: number = 15;
  globalCurrency: string = 'USD';
  
  colecciones: any[] = [];
  coleccionActiva: any = null;
  todosLosEstilos: ProductStyle[] = [];
  estilosMostrados: ProductStyle[] = [];

  getEstilosDeColeccionActiva() {
    if (!this.coleccionActiva) return [];
    return this.todosLosEstilos.filter(e => e.collection_id === this.coleccionActiva.id);
  }

  // ==========================================
  // NUEVOS CÁLCULOS FINANCIEROS (Sin usar 'category')
  // ==========================================
  getComponentCost(component: ShoeComponent): number {
    return component.materials.reduce((sum, mat) => sum + mat.cost, 0);
  }

  getDuramasCost(style: ProductStyle): number {
    return style.components.reduce((sum, comp) => sum + this.getComponentCost(comp), 0);
  }

  getFobPrice(style: ProductStyle): number {
    const duramasCost = this.getDuramasCost(style);
    return duramasCost * (1 + (this.globalMargin / 100));
  }

  getLandingPrice(style: ProductStyle): number {
    const fobPrice = this.getFobPrice(style);
    const taxesAmount = fobPrice * (style.taxesPercent / 100);
    return fobPrice + taxesAmount + style.freightCost;
  }

  // ==========================================
  // CRUD DE COLECCIONES
  // ==========================================
  async cargarColecciones() {
    const { data, error } = await this.supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      this.colecciones = data;
      // Seleccionar la primera colección por defecto al cargar
      if (this.colecciones.length > 0 && !this.coleccionActiva) {
        this.coleccionActiva = this.colecciones[0];
      }
    }
  }

  seleccionarColeccion(coleccion: any) {
    this.coleccionActiva = coleccion;
    if (coleccion) {
      this.estilosMostrados = this.todosLosEstilos
        .filter(e => e.collection_id === coleccion.id)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    } else {
      this.estilosMostrados = [];
    }
  }

  async agregarColeccion() {
    const nombre = prompt('Ingresa el nombre de la nueva colección (Ej. "Fall 27"):');
    if (!nombre || nombre.trim() === '') return;

    try {
      const { data, error } = await this.supabase
        .from('collections')
        .insert({ name: nombre })
        .select()
        .single();

      if (error) throw error;
      
      this.colecciones.push(data);
      this.seleccionarColeccion(data);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error agregando colección:', error);
    }
  }

  async editarColeccion(coleccion: any, event: Event) {
    event.stopPropagation();
    const nuevoNombre = prompt('Editar nombre de la colección:', coleccion.name);
    if (!nuevoNombre || nuevoNombre.trim() === '' || nuevoNombre === coleccion.name) return;

    try {
      const { error } = await this.supabase
        .from('collections')
        .update({ name: nuevoNombre })
        .eq('id', coleccion.id);

      if (error) throw error;
      coleccion.name = nuevoNombre;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error editando colección:', error);
    }
  }

  async eliminarColeccion(coleccion: any, event: Event) {
    event.stopPropagation();
    const confirmar = confirm(`¿Borrar la colección "${coleccion.name}"? Los zapatos no se borrarán, pero quedarán sin colección asignada.`);
    if (!confirmar) return;

    try {
      const { error } = await this.supabase.from('collections').delete().eq('id', coleccion.id);
      if (error) throw error;

      this.colecciones = this.colecciones.filter(c => c.id !== coleccion.id);
      if (this.coleccionActiva?.id === coleccion.id) {
        this.coleccionActiva = this.colecciones.length > 0 ? this.colecciones[0] : null;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error eliminando colección:', error);
    }
  }
  
  // ==========================================
  // DRAG AND DROP (REORDENAMIENTO)
  // ==========================================
  async drop(event: CdkDragDrop<ProductStyle[]>) {
    // 1. Angular hace la magia visual instantánea
    moveItemInArray(this.estilosMostrados, event.previousIndex, event.currentIndex);

    // 2. Asignamos el nuevo número de orden a cada zapato
    this.estilosMostrados.forEach((estilo, index) => {
      estilo.display_order = index;
    });

    // 3. Preparamos el paquete para Supabase (Solo los que ya existen en BD)
    try {
      const zapatosParaActualizar = this.estilosMostrados
        .filter(e => e.id) 
        .map(estilo => ({
          id: estilo.id,
          collection_id: estilo.collection_id,
          style_name: estilo.styleName,
          description: estilo.description,
          taxes_percent: estilo.taxesPercent,
          freight_cost: estilo.freightCost,
          gallery: estilo.gallery,
          components: estilo.components,
          display_order: estilo.display_order // ¡El nuevo orden!
        }));

      // Si hay zapatos para guardar, hacemos un "Batch Update" (Upsert masivo)
      if (zapatosParaActualizar.length > 0) {
        const { error } = await this.supabase.from('styles').upsert(zapatosParaActualizar);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error guardando el nuevo orden:", error);
    }
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
        header: false, // <-- IMPORTANTE: Cambiamos a false para que Angular pueda leer los Reportes de REP crudos
        skipEmptyLines: true,
        complete: (resultados) => {
          this.procesarArchivoInteligente(resultados.data as any [][]);
          event.target.value = ''; // Reseteamos el input para poder volver a subir archivos
        },
        error: (error) => {
          console.error("Error leyendo el CSV:", error);
          alert("Hubo un error leyendo el archivo CSV.");
        }
      });
    }
  }

// 3. Procesador Inteligente: Entiende tanto la Plantilla Original como los Reportes de REP
  procesarArchivoInteligente(filas: any[][]) {
    if (!filas || filas.length === 0) return;

    // SEGURO: Validar que exista una colección activa donde meter los zapatos
    if (!this.coleccionActiva) {
      this.seleccionarColeccion(this.coleccionActiva);
      alert('Por favor, selecciona o crea una Colección antes de importar estilos.');
      return;
    }

    // Leemos la primera celda del Excel para saber a qué nos enfrentamos
    const primeraCelda = filas[0][0]?.toString().trim() || "";

    // =========================================================
    // ESCENARIO 1: Es una Proyección de REP (El reporte bonito)
    // =========================================================
    if (primeraCelda.includes("REPORTE DE PROYECCION")) {
      
      const nombreZapato = filas.find(f => f[0] === 'Estilo:')?.[1]?.trim() || 'Proyección Importada';
      const filaTaxes = filas.find(f => f[0] === 'Impuestos (Taxes):');
      const filaFreight = filas.find(f => f[0] === 'Flete (Freight):');
      
      const taxes = filaTaxes && filaTaxes[1] ? parseFloat(filaTaxes[1].replace('%', '')) : 12;
      const freight = filaFreight && filaFreight[1] ? parseFloat(filaFreight[1].replace(/[^0-9.-]+/g, "")) : 15;

      const nuevoEstilo: ProductStyle = {
        styleName: nombreZapato + ' (IMPORTADO)', 
        description: 'Importado desde reporte de Proyección externa',
        hasChanges: true,
        collection_id: this.coleccionActiva.id, // <-- AHORA SE ANCLA A LA COLECCIÓN ACTUAL
        gallery: [],
        taxesPercent: taxes || 0,
        freightCost: freight || 0,
        components: [
          { id: 'comp-upper', componentName: 'A. Upper', materials: [] },
          { id: 'comp-linings', componentName: 'B. Linings / Sundries', materials: [] },
          { id: 'comp-bottom', componentName: 'C. Bottom Unit', materials: [] },
          { id: 'comp-packaging', componentName: 'D. Packaging', materials: [] },
          { id: 'comp-misc', componentName: 'E. Miscellaneous', materials: [] }
        ],
        presets: [],
        activePresetId: null,
      };

      const indexDesglose = filas.findIndex(f => f[0] === 'DESGLOSE DE MATERIALES');
      if (indexDesglose !== -1) {
        for (let i = indexDesglose + 2; i < filas.length; i++) {
           const compName = filas[i][0]?.trim();
           const matName = filas[i][1]?.trim();
           const matCostStr = filas[i][2]?.toString().trim();
           
           if (!compName || !matName) continue;
           const costo = parseFloat(matCostStr) || 0;
           
           const categoriaDestino = nuevoEstilo.components.find(c => c.componentName === compName);
           if (categoriaDestino) {
              categoriaDestino.materials.push({ name: matName, cost: costo });
           }
        }
      }

      // AHORA LO AGREGAMOS AL ARREGLO GLOBAL CORRECTO
      this.todosLosEstilos.push(nuevoEstilo);
      this.registrarEstadoMundo(nuevoEstilo);
      this.seleccionarColeccion(this.coleccionActiva);
      alert(`¡Proyección importada exitosamente como "${nuevoEstilo.styleName}"! Revísala y guárdala en BD si la apruebas.`);
      this.cdr.detectChanges();
    } 
    
    // =========================================================
    // ESCENARIO 2: Es la Plantilla Masiva Original (Múltiples Zapatos)
    // =========================================================
    else if (primeraCelda.includes("Shoe_Name")) {
      
      const zapatosAgrupados: { [nombre: string]: ProductStyle } = {};
      
      for (let i = 1; i < filas.length; i++) {
        const fila = filas[i];
        const nombreZapato = fila[0]?.trim();
        if (!nombreZapato) continue;

        if (!zapatosAgrupados[nombreZapato]) {
          zapatosAgrupados[nombreZapato] = {
            styleName: nombreZapato,
            description: 'Importado Masivamente desde Plantilla CSV',
            hasChanges: true,
            collection_id: this.coleccionActiva.id, // <-- AHORA SE ANCLA A LA COLECCIÓN ACTUAL
            gallery: [],
            taxesPercent: parseFloat(fila[1]) || 12,
            freightCost: parseFloat(fila[2]) || 15,
            components: [
              { id: 'comp-upper', componentName: 'A. Upper', materials: [] },
              { id: 'comp-linings', componentName: 'B. Linings / Sundries', materials: [] },
              { id: 'comp-bottom', componentName: 'C. Bottom Unit', materials: [] },
              { id: 'comp-packaging', componentName: 'D. Packaging', materials: [] },
              { id: 'comp-misc', componentName: 'E. Miscellaneous', materials: [] }
            ],
            presets: [],
            activePresetId: null,
          };
        }

        const categoriaDestino = zapatosAgrupados[nombreZapato].components.find(
          c => c.componentName === fila[3]?.trim()
        );

        if (categoriaDestino && fila[4]) {
          categoriaDestino.materials.push({
            name: fila[4].trim(),
            cost: parseFloat(fila[5]) || 0
          });
        }
      }

      const nuevosZapatos = Object.values(zapatosAgrupados);
      if (nuevosZapatos.length > 0) {
        // AHORA LO AGREGAMOS AL ARREGLO GLOBAL CORRECTO
        this.todosLosEstilos = [...nuevosZapatos, ...this.todosLosEstilos];
        alert(`¡Se importaron ${nuevosZapatos.length} estilos desde la plantilla masiva original a la colección "${this.coleccionActiva.name}"!`);
        this.cdr.detectChanges();
      }
    } 
    
    // =========================================================
    // ESCENARIO 3: Archivo Equivocado
    // =========================================================
    else {
      alert('Formato de CSV no reconocido. Por favor, usa la plantilla de carga masiva o un reporte de proyección exportado de la plataforma.');
    }
  }
  // ==========================================
  // UNDO & REDO (HISTORIAL DE MATERIALES)
  // ==========================================
  registrarEstadoMundo(estilo: any) {
    if (!estilo.history) {
      estilo.history = [];
      estilo.historyIndex = -1;
    }
    const estadoActual = JSON.stringify(estilo.components);
    
    // Evitamos duplicados si no ha cambiado nada
    if (estilo.historyIndex >= 0 && estilo.history[estilo.historyIndex] === estadoActual) return;

    // Si deshicimos pasos y ahora hacemos un cambio nuevo, borramos el futuro alterno
    if (estilo.historyIndex < estilo.history.length - 1) {
      estilo.history = estilo.history.slice(0, estilo.historyIndex + 1);
    }

    estilo.history.push(estadoActual);
    estilo.historyIndex++;
  }

  deshacer(estilo: any) {
    if (estilo.history && estilo.historyIndex > 0) {
      estilo.historyIndex--;
      estilo.components = JSON.parse(estilo.history[estilo.historyIndex]);
      estilo.hasChanges = true;
      this.cdr.detectChanges();
    }
  }

  rehacer(estilo: any) {
    if (estilo.history && estilo.historyIndex < estilo.history.length - 1) {
      estilo.historyIndex++;
      estilo.components = JSON.parse(estilo.history[estilo.historyIndex]);
      estilo.hasChanges = true;
      this.cdr.detectChanges();
    }
  }
  
  // ==========================================
  // AGREGAR Y ELIMINAR MATERIALES
  // ==========================================

  agregarMaterial(componente: ShoeComponent, estilo: ProductStyle) {
    componente.materials.push({ name: 'Nuevo Material', cost: 0 });
    this.registrarEstadoMundo(estilo); // Guardamos historial
  }

  eliminarMaterial(componente: ShoeComponent, index: number, estilo: ProductStyle) {
    const confirmar = confirm('¿Borrar este material del desglose?');
    if (!confirmar) return;
    
    componente.materials.splice(index, 1);
    estilo.hasChanges = true; 
    this.registrarEstadoMundo(estilo); // Guardamos historial
    this.cdr.detectChanges();
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

  async onImagenSeleccionada(event: any, variante: any) {
      const file = event.target.files[0];
      if (!file) return;

      // 1. Magia local: Creamos una URL temporal que solo existe en este navegador
      variante.imageUrl = URL.createObjectURL(file);
      
      // 2. Guardamos el archivo físico temporalmente para subirlo después
      variante.fileToUpload = file; 

      if (this.activeStyleForVariants) {
        this.activeStyleForVariants.hasChanges = true;
      }
      
      this.cdr.detectChanges(); // Actualizamos la vista inmediatamente
    }

  // Inicializar Supabase
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

// ==========================================
  // AGREGAR PRODUCTOS
  // ==========================================
  
// ==========================================
  // AGREGAR PRODUCTOS
  // ==========================================
  
  agregarEstilo() {
      if (!this.coleccionActiva) {
        alert("Selecciona o crea una colección primero.");
        return;
      }

      // Calculamos el último orden para asegurarnos de que nazca estrictamente al final
      const ultimoOrden = this.estilosMostrados.length > 0 
        ? Math.max(...this.estilosMostrados.map(e => e.display_order || 0)) 
        : -1;

      const nuevoEstilo: ProductStyle = {
        styleName: 'Nuevo Estilo',
        description: 'Descripción del zapato...',
        hasChanges: true,
        collection_id: this.coleccionActiva.id,
        display_order: ultimoOrden + 1, // <-- EL SEGURO ANTI-DESORDEN
        taxesPercent: 12,
        freightCost: 15,
        gallery: [],
        components: [
          { id: 'comp-upper', componentName: 'A. Upper', materials: [] },
          { id: 'comp-linings', componentName: 'B. Linings / Sundries', materials: [] },
          { id: 'comp-bottom', componentName: 'C. Bottom Unit', materials: [] },
          { id: 'comp-packaging', componentName: 'D. Packaging', materials: [] },
          { id: 'comp-misc', componentName: 'E. Miscellaneous', materials: [] }
        ],
        presets: [],
        activePresetId: null
      };
      
      this.todosLosEstilos.push(nuevoEstilo);
      this.registrarEstadoMundo(nuevoEstilo); 
      this.seleccionarColeccion(this.coleccionActiva); 

      // Pequeña animación para seguir el botón hacia abajo
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);

      this.cdr.detectChanges(); 
    }
    
  // ==========================================
  // GUARDAR PRODUCTOS EN SUPABASE
  // ==========================================
  async guardarEstilo(estilo: ProductStyle) {
    try {
      if (!estilo.id) {
        estilo.id = estilo.styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      
      // ... (Mantén tu código de subida de imágenes diferida intacto aquí) ...

      const { data, error } = await this.supabase
        .from('styles')
        .upsert({
          id: estilo.id, 
          collection_id: this.coleccionActiva.id, // <-- Ahora guardamos el ID de la colección
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
      
      estilo.originalData = JSON.stringify({
        taxesPercent: estilo.taxesPercent,
        freightCost: estilo.freightCost,
        components: estilo.components
      });
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
        let query = this.supabase.from('styles').select('*');

        if (!['admin', 'operador'].includes(this.currentRole)) {
          query = query.eq('is_hidden', false);
        }

        const { data, error } = await query;
        if (error) throw error;

        // CORRECCIÓN: Quitamos el "&& data.length > 0" para que actualice la vista
        // incluso si la base de datos devuelve un arreglo vacío.
        if (data) {
          const estilosRecuperados: ProductStyle[] = data.map((item: any) => ({
            id: item.id,
            hasChanges: false,
            isHidden: item.is_hidden, 
            styleName: item.style_name,
            collection_id: item.collection_id,
            description: item.description,
            taxesPercent: item.taxes_percent,
            freightCost: item.freight_cost,
            gallery: item.gallery,
            components: item.components,
            presets: [],               
            activePresetId: null,
            originalData: JSON.stringify({
              taxesPercent: item.taxes_percent,
              freightCost: item.freight_cost,
              components: item.components
            })
          }));

          this.todosLosEstilos = estilosRecuperados;
          

          // Reemplaza el bloque de presets por este:
          const { data: presetsData, error: presetsError } = await this.supabase
            .from('presets')
            .select('*');
          
          if (!presetsError && presetsData) {
            this.todosLosEstilos.forEach(estilo => {
              estilo.presets = presetsData.filter((p: any) => p.style_id === estilo.id);
            });
          }

          // <-- NUEVO: Actualizamos los estilos mostrados con la colección actual
          this.seleccionarColeccion(this.coleccionActiva); 

          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error('Error cargando estilos:', error);
      }
    }

  // Función exclusiva para el rol 'cliente' (REP)
// ==========================================
  // SISTEMA DE PROYECCIONES (PRESETS)
  // ==========================================
  // 1. Guardar Proyección (Mejorado con nombre)
  async guardarPreset(estilo: ProductStyle) {
    if (!this.currentUser) return;
    
    const nombreProyeccion = prompt('Dale un nombre corto a esta proyección (Ej. "Ideas, Cambio en packaging"):');
    if (!nombreProyeccion) return; // Si el usuario cancela, detenemos el proceso
    
    try {
      // Solo guardamos los datos numéricos y de componentes para no duplicar imágenes/títulos
      const datosClave = {
        taxesPercent: estilo.taxesPercent,
        freightCost: estilo.freightCost,
        components: estilo.components
      };

      const { data, error } = await this.supabase
        .from('presets')
        .insert({
          style_id: estilo.id,
          nombre_preset: nombreProyeccion,
          creado_por: this.currentUser.id,
          datos_modificados: datosClave 
        })
        .select() // Pedimos que nos devuelva el registro para pintarlo de inmediato
        .single();

      if (error) throw error;
      
      // Lo agregamos a la interfaz visual sin tener que recargar la página
      if (!estilo.presets) estilo.presets = [];
      estilo.presets.push(data);
      
      estilo.activePresetId = data.id; // Marcamos su nueva píldora como activa
      estilo.hasChanges = false;
      this.cdr.detectChanges();
      alert('¡Proyección guardada con éxito!');
      
    } catch (error) {
      console.error('Error guardando la proyección:', error);
      alert('Hubo un error al guardar la proyección.');
    }
  }

// 2. Intercambiar entre Oficial y Proyecciones
  seleccionarVersion(estilo: ProductStyle, preset: any | null) {
    if (preset === null) {
      // VOLVER A LA VERSIÓN OFICIAL
      if (estilo.originalData) {
        const backup = JSON.parse(estilo.originalData);
        estilo.taxesPercent = backup.taxesPercent;
        estilo.freightCost = backup.freightCost;
        // Al parsear el string, JavaScript crea objetos 100% nuevos e independientes
        estilo.components = backup.components; 
      }
      estilo.activePresetId = null;
    } else {
      // APLICAR UNA PROYECCIÓN
      const modificados = preset.datos_modificados;
      estilo.taxesPercent = modificados.taxesPercent;
      estilo.freightCost = modificados.freightCost;
      // TRUCO CLAVE: Clonar los componentes del preset. Así, si el usuario sigue escribiendo, no muta la memoria
      estilo.components = JSON.parse(JSON.stringify(modificados.components));
      estilo.activePresetId = preset.id;
    }
    
    estilo.hasChanges = false; 
    this.cdr.detectChanges();
  }

  // 3. Eliminar una Proyección (Solo Admin/Operadores)
  async eliminarPreset(estilo: ProductStyle, presetId: string, event: Event) {
    event.stopPropagation(); // Evitar que seleccione la píldora al presionar la X
    const confirmar = confirm('¿Estás seguro de que quieres borrar esta proyección?');
    if (!confirmar) return;

    try {
      const { error } = await this.supabase.from('presets').delete().eq('id', presetId);
      if (error) throw error;

      // La quitamos visualmente
      estilo.presets = estilo.presets?.filter(p => p.id !== presetId);
      
      // Si justo estábamos viendo la que borramos, nos regresamos a la Oficial
      if (estilo.activePresetId === presetId) {
        this.seleccionarVersion(estilo, null);
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error borrando proyección:', error);
    }
  }

  // 4. Actualizar una Proyección existente
  async actualizarPreset(estilo: ProductStyle) {
    if (!this.currentUser || !estilo.activePresetId) return;

    try {
      const datosClave = {
        taxesPercent: estilo.taxesPercent,
        freightCost: estilo.freightCost,
        components: estilo.components
      };

      const { error } = await this.supabase
        .from('presets')
        .update({ datos_modificados: datosClave })
        .eq('id', estilo.activePresetId);

      if (error) throw error;

      // Actualizamos la memoria local para que no haya que recargar la página
      const preset = estilo.presets?.find(p => p.id === estilo.activePresetId);
      if (preset) {
        preset.datos_modificados = JSON.parse(JSON.stringify(datosClave));
      }

      estilo.hasChanges = false;
      this.cdr.detectChanges();
      alert('¡Proyección actualizada con éxito!');
    } catch (error) {
      console.error('Error actualizando:', error);
      alert('Hubo un error al actualizar la proyección.');
    }
  }

  // 5. Renombrar un Preset
  async renombrarPreset(preset: any, event: Event) {
    event.stopPropagation(); // Evitamos que al dar clic al lápiz, se cambie de pestaña
    
    const nuevoNombre = prompt('Ingresa el nuevo nombre para esta proyección:', preset.nombre_preset);
    // Si cancela, lo deja en blanco, o pone el mismo nombre, no hacemos nada
    if (!nuevoNombre || nuevoNombre.trim() === '' || nuevoNombre === preset.nombre_preset) return;

    try {
      const { error } = await this.supabase
        .from('presets')
        .update({ nombre_preset: nuevoNombre })
        .eq('id', preset.id);

      if (error) throw error;

      preset.nombre_preset = nuevoNombre;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error renombrando:', error);
      alert('Error al cambiar el nombre.');
    }
  }

  // 7. Exportar Proyección Local (Para Invitados)
  exportarProyeccionLocalCSV(estilo: ProductStyle) {
    const moneda = this.globalCurrency; // <-- Usa la variable global
    const simbolo = this.getCurrencySymbol(moneda);
    
    // Generamos el contenido del archivo con encabezados limpios
    let csvContent = "REPORTE DE PROYECCION DE COSTOS - PALOMO 1953\n\n";
    csvContent += `Estilo:,${estilo.styleName}\n`;
    csvContent += `Moneda:,${moneda}\n\n`;
    
    // Resumen Financiero
    csvContent += "RESUMEN FINANCIERO\n";
    csvContent += `Costo Fab. Duramas:,${simbolo}${this.getConvertedValue(this.getDuramasCost(estilo), moneda).toFixed(2)}\n`;
    csvContent += `Precio C/Margen:,${simbolo}${this.getConvertedValue(this.getFobPrice(estilo), moneda).toFixed(2)}\n`;
    csvContent += `Impuestos (Taxes):,${estilo.taxesPercent}%\n`;
    csvContent += `Flete (Freight):,${simbolo}${this.getConvertedValue(estilo.freightCost, moneda).toFixed(2)}\n`;
    csvContent += `Precio Final (Landing Price):,${simbolo}${this.getConvertedValue(this.getLandingPrice(estilo), moneda).toFixed(2)}\n\n`;
    
    // Desglose de Materiales
    csvContent += "DESGLOSE DE MATERIALES\n";
    csvContent += "Componente,Material,Costo\n";

    estilo.components.forEach(comp => {
      comp.materials.forEach(mat => {
        const costoConvertido = this.getConvertedValue(mat.cost, moneda).toFixed(2);
        // Envolvemos los nombres en comillas por si el usuario les puso una coma al escribir
        csvContent += `"${comp.componentName}","${mat.name}",${costoConvertido}\n`;
      });
    });

    // Crear el archivo y forzar la descarga en el navegador
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Proyeccion_${estilo.styleName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Como el invitado no tiene nube, al descargar le apagamos el botón de guardar 
    // para indicarle que su trabajo ya está a salvo en su computadora.
    estilo.hasChanges = false;
    this.cdr.detectChanges();
  }

  // ==========================================
  // FUNCIONES DE ELIMINACIÓN Y OCULTAMIENTO
  // ==========================================

  // 1. Soft Delete (Ocultar)
  async ocultarEstilo(estilo: ProductStyle) {
      const verbo = ['admin', 'operador'].includes(this.currentRole) ? 'archivar/ocultar' : 'eliminar';
      const confirmar = confirm(`¿Estás seguro de que quieres ${verbo} "${estilo.styleName}"?`);
      if (!confirmar) return;

      try {
        if (!estilo.id) {
          this.todosLosEstilos = this.todosLosEstilos.filter(e => e !== estilo); 
          this.seleccionarColeccion(this.coleccionActiva); // Recarga vista
          return;
        }
        const { error } = await this.supabase.from('styles').update({ is_hidden: true }).eq('id', estilo.id);
        if (error) throw error;

        if (['admin', 'operador'].includes(this.currentRole)) {
          estilo.isHidden = true; // El admin ve la etiqueta roja
        } else {
          this.todosLosEstilos = this.todosLosEstilos.filter(e => e.id !== estilo.id); // REP ya no lo ve
          this.seleccionarColeccion(this.coleccionActiva); // Recarga vista
        }
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error al ocultar:', error);
      }
    }  

  // 2. Hard Delete (Borrado definitivo - Solo Admin)
  async eliminarDefinitivo(estilo: ProductStyle) {
    const confirmar = confirm(`🛑 CUIDADO: ¿Borrar DEFINITIVAMENTE "${estilo.styleName}"?`);
    if (!confirmar) return;
    try {
      const { error } = await this.supabase.from('styles').delete().eq('id', estilo.id);
      if (error) throw error;
      
      this.todosLosEstilos = this.todosLosEstilos.filter(e => e.id !== estilo.id); // Lo borramos de la lista global
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al borrar definitivamente:', error);
    }
  }

  // 3. Restaurar / Volver a mostrar (Admin y Operadores)
  async restaurarEstilo(estilo: ProductStyle) {
    try {
      const { error } = await this.supabase
        .from('styles')
        .update({ is_hidden: false })
        .eq('id', estilo.id);

      if (error) throw error;

      // Quitamos la etiqueta roja visualmente
      estilo.isHidden = false;
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('Error al restaurar:', error);
      alert('Hubo un error al intentar restaurar el producto.');
    }
  }
  
  // ==========================================
  // CANDADOS Y MATERIALES
  // ==========================================

  // Cambiar el estado del candado de un material
  toggleLock(material: MaterialDetail, estilo: ProductStyle) {
    // Invertimos el valor (si era true pasa a false, y viceversa)
    material.isLocked = !material.isLocked;
    
    // Le avisamos a Angular que hubo un cambio para que muestre el botón de Guardar
    estilo.hasChanges = true;
    this.cdr.detectChanges();
  }
}