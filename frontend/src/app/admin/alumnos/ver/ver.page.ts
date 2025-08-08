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
    await this.getSalones();
    this.filtrarPorSalon(); // Inicializa la lista
  }

  async getSalones() {
    const token = await this.storage.get('token');
    this.api.getSalones(token).then((res: any) => {
      this.salones = res.data;

      // Aplana los alumnos de todos los salones y les agrega su info de salón
      this.alumnos = [].concat(...this.salones.map((salon: any) => {
        return salon.alumnos.map((a: any) => ({ ...a, salon }));
      }));

      this.filtrarPorSalon(); // Aplica filtro inicial
    }).catch((err: any) => {
      console.error(err);
    });
  }

  filtrarPorSalon() {
    if (this.salonSeleccionado) {
      this.alumnosFiltrados = this.alumnos.filter(a => a.salon.id === this.salonSeleccionado);
    } else {
      this.alumnosFiltrados = this.alumnos;
    }
  }

}
