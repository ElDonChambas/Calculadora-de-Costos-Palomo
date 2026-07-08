import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// 1. Importamos tu nuevo componente
import { PoFormComponent } from './3-components/po-form/po-form.components';

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. Lo agregamos al arreglo de imports aquí abajo
  imports: [PoFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'PoFormPalomo1953';
}