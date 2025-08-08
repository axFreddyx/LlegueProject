import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false
})
export class VerPage implements OnInit {

  alumnos: any[] = [];
  salones: any[] = [];
  alumnosFiltrados: any[] = [];
  salonSeleccionado: string = ''; // ID o nombre del salón seleccionado

  constructor(
    private api: ApiService,
    private storage: Storage
  ) { }

  async ngOnInit() {
    
  }
}
