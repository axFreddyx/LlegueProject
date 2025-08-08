import { Component, OnInit } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { Route, Router } from '@angular/router';

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
  alumnos: any[] = [];

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router
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
      res.data.alumnos.forEach((alumno: any) => {
        if (alumno.publishedAt !== null) {
          this.alumnos.push(alumno);
          console.log('Alumno añadido:', alumno);
          // console.log('Alumno cargado:', this.alumnos);
        }
      });
      console.log('Usuario cargado:', this.userLogged);
    }).catch((err: any) => {
      console.error(err);
    });
  }

  toggleSeleccion(alumno: any) {
    alumno.seleccionado = !alumno.seleccionado;

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
      for (const alumno of this.seleccionados) {
        await this.api.llegue(alumno.id, this.userLogged.id, token);
      }

      console.log('Llegada marcada para:', this.seleccionados.map(a => a.nombre));
      this.setOpen(false);
      this.getMe(); // refresca datos
      this.alumnos = []


    } catch (error) {
      console.error('Error marcando llegada:', error);
    }
  }

  logout() {
    // console.log("Has cerrado sesión");

    // Primero borra el token
    this.storage.remove("token").then(() => {
      // Después redirige con un pequeño delay si deseas
      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1000);
    });
  }

}
