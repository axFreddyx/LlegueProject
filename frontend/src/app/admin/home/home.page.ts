import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  constructor(
    private storage: Storage,
    private router: Router,
    private toastController: ToastController,
    private api: ApiService
  ) { }

  token = '';
  idUser:number = 0;

  async ngOnInit() {
    this.token = await this.storage.get("token");
    this.getMe();
  }

  private async presentToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const color = type === 'success' ? 'success' : type === 'error' ? 'danger' : 'warning';
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }

  async getMe(){
    await this.api.getUserByMe().then((res:any) => {
      console.log(res.data);
      this.idUser = res.data.id;
    }).catch((err:any) => {
      console.log(err);
    });
  }

  logout() {
    console.log("Has cerrado sesión");

    // Borrar token
    this.storage.remove("token").then(() => {
      // Mostrar mensaje
      this.presentToast('Has cerrado sesión correctamente', 'success');

      this.api.gestionarToken(this.idUser, '', this.token).then(() => {
        console.log("Token gestionado correctamente");
      }).catch((err) => {
        console.log("Error al gestionar el token", err);
      });

      // Redirigir
      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1500);
    });
  }
}
