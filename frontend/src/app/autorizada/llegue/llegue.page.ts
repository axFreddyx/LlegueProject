import { Component, OnInit } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

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
  token = "";
  private timeoutId: any = null; // Guardamos la referencia del timeout

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router,
    private toastController: ToastController
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

  async ngOnInit() {
    await this.getMe();
    this.token = await this.storage.get("token");
  }

  async getMe() {
    try {
      const res: any = await this.api.getUserByMe();
      this.userLogged = res.data;
      this.alumnos = [];  // Limpiar antes de llenar
      res.data.alumnos.forEach((alumno: any) => {
        if (alumno.publishedAt !== null) {
          alumno.seleccionado = false; // Inicializar la propiedad seleccionado
          this.alumnos.push(alumno);
        }
      });
      // console.log('Usuario cargado:', this.userLogged);
      console.log(this.alumnos)
    } catch (err) {
      console.error(err);
    }
  }

  toggleSeleccion(alumno: any) {
    alumno.seleccionado = !alumno.seleccionado;

    if (alumno.seleccionado) {
      this.seleccionados.push(alumno);
    } else {
      this.seleccionados = this.seleccionados.filter(a => a.id !== alumno.id);
    }
  }

  toggleSeleccionConRetardo(alumno: any) {
    alumno.seleccionado = !alumno.seleccionado;

    if (alumno.seleccionado) {
      if (!this.seleccionados.some(a => a.id === alumno.id)) {
        this.seleccionados.push(alumno);
      }

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.presentToast(
        "En un plazo máximo de 5 segundos se notificará al docente sobre su llegada. Si cometió un error al seleccionar al alumno, haga clic nuevamente sobre él.",
        'medium',
        2500
      );

      this.timeoutId = setTimeout(() => {
        this.enviarSeleccionados();
        this.timeoutId = null;
      }, 5000);

    } else {
      this.seleccionados = this.seleccionados.filter(a => a.id !== alumno.id);

      // Opcional: si quieres cancelar el timeout cuando ya no hay seleccionados
      if (this.seleccionados.length === 0 && this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  private async enviarSeleccionados() {
    if (this.seleccionados.length === 0) return; // nada que enviar

    const token = await this.storage.get('token');
    try {
      for (const alumno of this.seleccionados) {
        await this.api.llegue(alumno.id, this.userLogged.id, token);
      }
      console.log('Llegada marcada para:', this.seleccionados.map(a => a.nombre));
      this.presentToast('Llegada marcada correctamente', 'success');
      this.setOpen(false);
      await this.getMe();
      this.seleccionados = [];
    } catch (error) {
      console.error('Error marcando llegada:', error);
      this.presentToast('Error marcando llegada', 'error');
    }
  }

  async presentToast(message: string, type: 'success' | 'error' | 'medium', duration = 1500) {
    const toast = await this.toastController.create({
      message,
      duration: duration,
      position: 'top',
      color: type
    });
    await toast.present();
  }

  logout() {
    console.log("Has cerrado sesión");

    this.storage.remove("token").then(() => {
      // Mostrar mensaje antes de redirigir
      this.presentToast('Has cerrado sesión correctamente', 'success');

      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1500);
    });
  }

  
}