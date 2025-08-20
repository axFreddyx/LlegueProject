import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonAlert, IonModal, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment'; // ✅ NUEVO
import { Router } from '@angular/router';

interface Salon {
  aula: string;
  grado: number;
  grupo: string;
  alumnos?: any[]; // opcional si quieres totalAlumnos
}

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false
})
export class VerPage implements OnInit {

  constructor(){}
  isMobile: boolean = false;
  ngOnInit(): void {
    this.changeResolution();
  }
  // Para cambiar vista
  changeResolution() {
    // Variable que detecta el cambio de resolución
    const resolution = window.matchMedia('(max-width: 768px)');
    // Si la resolución cambia, se actualiza la variable isMobile
    resolution.addEventListener('change', (event) => {
      this.isMobile = event.matches;
    });
    return resolution.matches;
  }
}