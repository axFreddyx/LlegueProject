import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
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
  llegadasCargadas: any[] = [];
  token = "";
  salon: any = {};
  private readonly assetsBase = environment.apiUrl.replace(/\/api\/?$/, ''); // ✅ NUEVO

  async ngOnInit() {
    this.storage.create();
    this.token = await this.storage.get('token');
    this.getLlegadas();

    // Llegadas en tiempo real
    setInterval(() => {
      this.getLlegadas();
    }, 1000); // cada 5 segundos, por ejemplo
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

      // Filtrar solo llegadas del día actual y que no estén ya cargadas
      this.llegadas = todasLlegadas.filter((l: any) => {
        if (!l.createdAt) return false;

        const fechaLlegada = new Date(l.createdAt);
        // yaExiste verifica si ya existe un elemento en el array
        const yaExiste = this.llegadasCargadas.some(c => c.documentId === l.documentId); // some tiene como funcion verificar si ya existe un elemento en el array

        if (yaExiste) {
          return false; // ya estaba cargada, no la incluimos
        }

        // si es del día actual y no estaba cargada, la agregamos a llegadasCargadas
        const esDeHoy =
          fechaLlegada.getFullYear() === new Date().getFullYear() &&
          fechaLlegada.getMonth() === new Date().getMonth() &&
          fechaLlegada.getDate() === new Date().getDate();

        if (esDeHoy) {
          this.llegadasCargadas.push(l);
        }

        return esDeHoy;
      });

      // console.log('Llegadas del día:', this.llegadas);

      this.getLLegada();
    }).catch(err => {
      console.log(err);
      this.presentToast('Error al cargar llegadas.', 'danger');
    });
  }

  getSalonByAlumno(llegada: any) {
    const salon = llegada;
    // console.log(salon)
    this.salon = salon;
  }

  getLLegada() {
    this.llegadas.forEach((l: any) => {
      this.getSalonByAlumno(l);
      // console.log(l);
    })
  }

  getFotoUrl(a: any): string | null { // ✅ NUEVO
    try {
      // console.log(a)
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
