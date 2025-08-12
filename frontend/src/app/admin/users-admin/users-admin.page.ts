import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-users-admin',
  templateUrl: './users-admin.page.html',
  styleUrls: ['./users-admin.page.scss'],
  standalone: false
})
export class UsersAdminPage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController
  ) { }

  token = "";
  administradores: any[] = [];

  async ngOnInit() {
    await this.storage.create();
    this.token = await this.storage.get('token');
    this.getAdmins();
  }

  async getAdmins() {
    this.administradores = [];
    await this.api.getUsersByRole(5)
      .then((res: any) => {
        if (res?.data?.data) {
          console.log('Administradores:', res.data.data);
          this.administradores = res.data.data;
        } else {
          console.warn('No se encontró .data.data en la respuesta:', res);
          this.administradores = [];
        }
      })
      .catch((err: any) => {
        console.error('Error al obtener administradores:', err);
        this.administradores = [];
        this.presentToast('Error al cargar administradores.', 'danger'); 
      });
    }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const t = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color
    });
    await t.present();
  }

}
