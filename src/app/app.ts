import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment.development';
import { PoFormComponent } from './3-components/po-form/po-form.components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PoFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'PoFormPalomo1953';
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  async ngOnInit() {
    console.log('Variables de entorno:', environment);
    
    const { data, error } = await this.supabase
      .from('test_connection')
      .select('*');

    if (error) {
      console.error('Error al conectar con Supabase:', error);
    } else {
      console.log('¡Conexión exitosa! Aquí están tus productos:', data);
    }
  }
}