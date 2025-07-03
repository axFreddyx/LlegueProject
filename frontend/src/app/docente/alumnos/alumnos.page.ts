import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

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

  alumnosConLlegada: any[] = [];
  alumnosSinLlegada: any[] = [];

  constructor(
    private toastCtrl: ToastController,
    private api: ApiService,
  ) { }

  ngOnInit() {
    this.getMe();
  }

  // Quiero que muestre los alumnos que la llegada sea false y en otra true. que las almacene en alumnosSinLlegada y alumnosConLlegada respectivamente
  getMe() {
    this.api.getUserByMe().then((res: any) => {
      console.log('Usuario cargado:', res.data);
      this.salon = res.data.salon;

     

    }).catch((err: any) => {
      console.error(err);
      this.presentToast('Error al cargar usuario');
    });
  }

  getLlegada() {
    this.api.getLlegadasBySalon(1, '').then((res: any) => {
      console.log('Llegadas:', res.data);
    }).catch((err: any) => {
      console.error('Error al obtener llegadas:', err);
      this.presentToast('Error al obtener llegadas');
    });
  }

  presentToast(message: string) {
    this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    }).then(toast => toast.present());
  }
}
