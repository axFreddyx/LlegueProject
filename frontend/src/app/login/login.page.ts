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
      duration: 2500,
      position: 'top',
      color: 'light', 
      cssClass: type === 'success' ? 'toast-success' : 'toast-error'
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

      // Guardar token
      await this.db.set('token', `Bearer ${data.jwt}`);

      // Obtener rol
      await this.api.getUserByMe().then((userWithRole: any) => {
        console.log("Usuario con rol:", userWithRole);
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

      // Mensaje de éxito
      this.presentToast('Inicio de sesión exitoso', 'success');

    }).catch((error: any) => {
      console.error("Error en login:", error);

      // Mensaje de error
      this.presentToast('Ocurrió un error al iniciar sesión', 'error');
    });
  }
}
