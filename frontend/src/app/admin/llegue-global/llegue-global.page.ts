import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';
// import { set } from 'date-fns';

@Component({
  selector: 'app-llegue-global',
  templateUrl: './llegue-global.page.html',
  styleUrls: ['./llegue-global.page.scss'],
  standalone: false
})
export class LlegueGlobalPage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController
  ) { }

  fechaHoy = new Date().toISOString().split('T')[0];

  llegadas: any[] = [];
  token = "";
  salon: any = {};

  async ngOnInit() {
    this.storage.create();
    this.token = await this.storage.get('token');
    setTimeout(() => {
      this.getLlegadas();
    }, 5000); 

  }

  // helper toast
  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success',
    duration = 1500
  ) {
    const t = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color
    });
    await t.present();
  }

  async getLlegadas() {
    this.api.getLLegueGlobal(this.token).then(res => {
      const data: any = res.data;
      const todasLlegadas = data.data;

      // Filtrar solo llegadas del día actual
      this.llegadas = todasLlegadas.filter((l: any) => {
        if (!l.createdAt) return false;

        const fechaLlegada = new Date(l.createdAt);
        return (
          fechaLlegada.getFullYear() === new Date().getFullYear() &&
          fechaLlegada.getMonth() === new Date().getMonth() &&
          fechaLlegada.getDate() === new Date().getDate()
        );
      });

      console.log('Llegadas del día:', this.llegadas);

      this.getLLegada();
    }).catch(err => {
      console.log(err);
      this.presentToast('Error al cargar llegadas.', 'danger');
    });
  }

  getSalonByAlumno(llegada: any) {
    console.log(llegada.alumno.salon)
    const salon = llegada;
    console.log(salon)
    this.salon = salon;

  }

  getLLegada() {
    this.llegadas.forEach((l: any) => {
      this.getSalonByAlumno(l);
    })
  }
}
