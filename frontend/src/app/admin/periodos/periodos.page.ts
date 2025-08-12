import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-periodos',
  templateUrl: './periodos.page.html',
  styleUrls: ['./periodos.page.scss'],
  standalone: false
})
export class PeriodosPage implements OnInit {

  constructor(
    private storage: Storage,
    private api: ApiService,
    private router: Router,
    private toastController: ToastController
  ) { }

  token = "";
  periodos: any[] = [];

  async ngOnInit() {
    await this.storage.create();
    this.token = await this.storage.get('token');
    this.getPeriodo();
  }

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

  async getPeriodo() {
    this.periodos = [];
    this.api.getPeriodos(this.token).then(res => {
      const data = res.data as any;
      this.periodos = data.data;
      console.log(this.periodos);

      if (!this.periodos || this.periodos.length === 0) {
        this.presentToast('No hay periodos registrados.', 'warning');
      }
    }).catch(err => {
      console.log(err);
      this.presentToast('Error al cargar periodos.', 'danger');
    });
  }

  //   async getLlegadas(){
  //   this.llegadas = [];
  //   this.api.getLLegueGlobal(this.token).then(res =>{
  //   const data = res.data as any;
  //   this.llegadas = data.data;
  //   console.log(this.llegadas);
  //   }).catch(err=>{
  //     console.log(err);
  //   })
  // }
}



