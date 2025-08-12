import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular'; 

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

  llegadas: any[] = [];
  token = "";

  async ngOnInit() {
    this.storage.create();
    this.token = await this.storage.get('token');
    this.getLlegadas();
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
    this.llegadas = [];
    this.api.getLLegueGlobal(this.token).then(res => {
      const data = res.data as any;
      this.llegadas = data.data;
      console.log(this.llegadas);
    }).catch(err => {
      console.log(err);
      this.presentToast('Error al cargar llegadas.', 'danger'); 
    });
  }

}
