import { Component, OnInit } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

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
  isLlego: boolean = false;
  token = "";
  fechaHoy = new Date().toISOString().split('T')[0];
  private readonly assetsBase = environment.apiUrl.replace(/\/api\/?$/, ''); // ✅ NUEVO

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
    this.token = await this.storage.get("token");
    await this.getMe();
    // await this.getLlegadasByAlumno();
  }

  async getMe() {
    try {
      const res: any = await this.api.getUserByMe();
      this.userLogged = res.data;
      this.alumnos = [];  // Limpiar antes de llenar
      // console.log('Usuario cargado:', this.userLogged);
      res.data.alumnos.forEach(async (alumno: any) => {
        if (alumno.publishedAt !== null) {
          // console.log('Alumno:', alumno);
          const llegadaAlumno = await this.getLlegadasByAlumno(alumno.documentId);
          const llegoHoy = llegadaAlumno.some((l: any) => {
            const fechaLlegada = new Date(l.createdAt).toISOString().split('T')[0];
            return fechaLlegada === this.fechaHoy;
          });

          alumno.isLlego = llegoHoy;

          alumno.seleccionado = false; // Inicializar la propiedad seleccionado
          this.alumnos.push(alumno);
          // console.log('Alumnos:', this.alumnos);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  // toggleSeleccion(alumno: any) {
  //   alumno.seleccionado = !alumno.seleccionado;

  //   if (alumno.seleccionado) {
  //     this.seleccionados.push(alumno);
  //   } else {
  //     this.seleccionados = this.seleccionados.filter(a => a.id !== alumno.id);
  //   }
  // }

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

  async getLlegadasByAlumno(id: any) {
    try {
      const res: any = await this.api.getLlegadasByAlumno(id, this.token);
      // console.log('Llegadas por alumno:', res.data.data);
      const llegadas = res.data.data;
      return llegadas
    } catch (err) {
      console.error(err);
    }
  }

  getFotoUrl(a: any): string | null { // ✅ NUEVO
    try {
      const f = a?.foto ?? a?.attributes?.foto;
      if (!f) return null;

      // Puede venir como {data:{attributes:{url, formats}}} o directo con {url, formats}
      const node = f?.data?.attributes ?? f?.attributes ?? f;
      if (!node) return null;

      // Prioriza thumbnail si existe; si no, usa url
      const url: string | undefined = node?.formats?.thumbnail?.url || node?.url;
      if (!url) return null;

      // Si es relativa (/uploads/...), anteponer host; si ya es absoluta, devolverla tal cual
      return url.startsWith('http') ? url : `${this.assetsBase}${url}`;
    } catch {
      return null;
    }
  }


}