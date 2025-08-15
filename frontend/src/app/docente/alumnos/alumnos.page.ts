import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { Router, NavigationEnd } from '@angular/router';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

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
    private storage: Storage,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.token = await this.storage.get("token");
    this.changeResolution();
    this.detectDevice();
    await this.getMe();
    await this.getLlegada();
    this.notification()
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

  notification(){
     console.log('Initializing Ver por cuales alumnos han llegado');

    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration',
      (token: Token) => {
        alert('Push registration success, token: ' + token.value);
      }
    );

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
        alert('Error on registration: ' + JSON.stringify(error));
      }
    );

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        alert('Push received: ' + JSON.stringify(notification));
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        alert('Push action performed: ' + JSON.stringify(notification));
      }
    );
  }
}
