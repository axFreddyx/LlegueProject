import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';

interface Alumno {
  id: number;
  nombre: string;
  grupo: string;
  foto: string;
  seleccionado?: boolean;
}

@Component({
  selector: 'app-alumnos',
  templateUrl: './alumnos.page.html',
  styleUrls: ['./alumnos.page.scss'],
  standalone: false
})
export class AlumnosPage implements OnInit {

  fechaHoy = new Date().toISOString().split('T')[0];

  salon: any = [];

  isMobile: boolean = false;
  token = ""

  idSalon: any;
  idMe: any;

  alumnosConLlegada: any[] = [];
  alumnosSinLlegada: any[] = [];

  constructor(
    private toastCtrl: ToastController,
    private api: ApiService,
    private storage: Storage
  ) { }

  async ngOnInit() {
    this.token = await this.storage.get("token");
    this.changeResolution();
    this.detectDevice();
    await this.getMe();
    await this.getLlegada();
  }

  changeResolution() {
    // Variable que detecta el cambio de resolución
    const resolution = window.matchMedia('(max-width: 768px)');
    // Si la resolución cambia, se actualiza la variable isMobile
    resolution.addEventListener('change', (event) => {
      this.isMobile = event.matches;
    });
    return resolution.matches;
  }

  detectDevice() {
    if (window.innerWidth <= 768) {
      this.isMobile = true;
    }
  }

  async getMe() {
    await this.api.getUserByMe().then((res: any) => {
      console.log('Usuario cargado:', res.data);
      this.salon = res.data.salon;
      this.idSalon = res.data.salon.documentId;
      this.idMe = res.data.documentId;

      // res.data.alumnos.forEach((alumno:any) => {
      //   // console.log('Alumno:', alumno.publishedAt);
      //   if (alumno.publishedAt !== null) {
      //     // res.data.alumnos = alumno
      //     console.log('Alumno:', alumno);
      //   }
      // })

    }).catch((err: any) => {
      console.error(err);
      this.presentToast('Error al cargar usuario', "error");
    });
  }

  async getLlegada() {

    this.api.getLlegadasBySalon(this.idSalon, this.token).then((res: any) => {
      const data = res.data.data;

      this.reset(); // Limpiar antes de llenar de nuevo

      data.forEach((llegada: any) => {
        // Asegúrate de que la fecha esté bien formateada para comparar
        const fechaLlegada = new Date(llegada.createdAt).toISOString().split('T')[0];

        if (fechaLlegada === this.fechaHoy) {
          if (llegada.llegada) {
            this.alumnosConLlegada.push(llegada);
          } else {
            this.alumnosSinLlegada.push(llegada);
          }
        }
      });

    }).catch((err: any) => {
      console.error('Error al obtener llegadas:', err);
      this.presentToast('Error al obtener llegadas', "error");
    });
  }
  // Reiniciar las listas de alumnos
  reset() {
    this.alumnosConLlegada = [];
    this.alumnosSinLlegada = [];
  }

  async dejarSalir(llegada: any) {
    const data = {
      llegada: true,
      docente: this.idMe,
    }
    this.api.gestionarSalida(llegada.documentId, data, this.token).then((res: any) => {
      this.presentToast(`Alumno ${llegada.alumno.nombre} se ha entregado a su conocido.`, "success");
      // Actualizar las listas de alumnos
      this.reset();
      this.getLlegada();
    }).catch((err: any) => {
      console.error('Error al autorizar salida:', err);
      this.presentToast('Error al autorizar salida', "error");
    });
  }

  noDejarSalir(llegada: any) {
    const data = {
      llegada: false,
    }
    this.api.gestionarSalida(llegada.documentId, data, this.token).then((res: any) => {
      console.log(res)
      this.getLlegada();

      this.presentToast("Se ha cancelado la salida", "success");
    }).catch((err) => {
      console.error(err);
      this.presentToast("Ha ocurrido un error", "error");
    });
  }

  presentToast(message: string, type: 'success' | 'error') {
    this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: type,
    }).then(toast => toast.present());
  }
}
