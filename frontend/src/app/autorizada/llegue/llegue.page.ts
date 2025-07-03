import { Component, OnInit } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-llegue',
  templateUrl: './llegue.page.html',
  styleUrls: ['./llegue.page.scss'],
  standalone: false,
})
export class LleguePage implements OnInit {

  isModalOpen = false;
  userLogged: any;
  seleccionados: any[] = [];

  constructor(
    private api: ApiService,
    private storage: Storage,
  ) { }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (isOpen) {
      this.seleccionados = [];
      if (this.userLogged?.alumnos) {
        // Limpiar selección previa
        this.userLogged.alumnos.forEach((a: any) => a.seleccionado = false);
      }
    }
  }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.isModalOpen = false;
  }

  ngOnInit() {
    this.getMe();
  }

  getMe() {
    this.api.getUserByMe().then((res: any) => {
      this.userLogged = res.data;
      console.log('Usuario cargado:', this.userLogged);
    }).catch((err: any) => {
      console.error(err);
    });
  }

  toggleSeleccion(alumno: any) {
    if (alumno.seleccionado) {
      this.seleccionados.push(alumno);
    } else {
      this.seleccionados = this.seleccionados.filter(a => a.id !== alumno.id);
    }
  }

  async marcarLlegada() {
    const token = await this.storage.get('token');
    if (this.seleccionados.length === 0) {
      return; // Nada seleccionado, no hacer nada
    }

    try {
      // Espera que la API acepte un arreglo, si no, haz un loop (a continuación dejo ambas formas)
      // Forma 1 (API acepta arreglo):
      /*
      const ids = this.seleccionados.map(a => a.id);
      await this.api.llegueMultiple(ids, this.userLogged.id, token);
      */

      // Forma 2 (API solo para uno, hacer varios llamados):
      for (const alumno of this.seleccionados) {
        await this.api.llegue(alumno.id, this.userLogged.id, token);
      }

      console.log('Llegada marcada para:', this.seleccionados.map(a => a.nombre));
      this.setOpen(false);
      this.getMe(); // refresca datos

    } catch (error) {
      console.error('Error marcando llegada:', error);
    }
  }

}
