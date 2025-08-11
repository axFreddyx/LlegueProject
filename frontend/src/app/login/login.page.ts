import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  constructor(
    private api: ApiService,
    private router: Router,
    private db: Storage,
    private toastController: ToastController
  ) { }

  identifier = '';
  password = '';

  ngOnInit() {
    this.db.create();
  }

  async presentToast(message: string, type: 'success' | 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger' 
    });
    await toast.present();
  }

  async login() {
    const data = {
      identifier: this.identifier,
      password: this.password
    };

    await this.api.login(data).then(async (data: any) => {
      console.log("Login correcto:", data);

      await this.db.set('token', `Bearer ${data.jwt}`);

      await this.api.getUserByMe().then((userWithRole: any) => {
        const rol = userWithRole?.data?.role?.type;

        switch (rol) {
          case 'admin':
            this.router.navigateByUrl('/home');
            break;
          case 'docente':
            this.router.navigateByUrl('/alumnos');
            break;
          case 'persona_autorizada':
            this.router.navigateByUrl('/llegue');
            break;
          default:
            this.router.navigateByUrl('/login');
            break;
        }
      });

      this.presentToast('Inicio de sesión exitoso', 'success');

    }).catch((error: any) => {
      console.error("Error en login:", error);
      this.presentToast('Ocurrió un error al iniciar sesión', 'error');
    });
  }
}
