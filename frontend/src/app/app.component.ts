import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})

export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private storage: Storage,
    private toastController: ToastController,
    private api: ApiService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.toggleMenu();
      });
  }
  token_push = '';
  token = ''
  idUser: number = 0;

  async ngOnInit() {
    this.token = await this.storage.get("token");
    await this.getMe(); // obtener info del usuario y su ID
    this.toggleMenu();
  }

  async getMe() {
    try {
      const res: any = await this.api.getUserByMe();
      this.idUser = res.data.id; // guardamos el id del usuario
      console.log("ID de usuario:", this.idUser);
    } catch (err) {
      console.error("Error obteniendo info de usuario:", err);
    }
  }


  toggleMenu() {
    const hideMenuRoutes = ['/login', '/register', '/llegue', '/alumnos', '/perfil', '/llegue-global', '/password-forgotten'];
    const isHiddenPage = hideMenuRoutes.includes(this.router.url);

    this.menuCtrl.enable(!isHiddenPage);
  }

  private async presentToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const color = type === 'success' ? 'success' : type === 'error' ? 'danger' : 'warning';
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color
    });
    await toast.present();
  }


  async logout() {
    try {
      const jwt = await this.storage.get("token"); // obtener token
      const userId = this.idUser;

      if (userId && jwt) {
        await this.api.gestionarToken(userId, '', jwt); // vaciar token_push en backend
        console.log("Token_push eliminado en backend");
      }

      await this.storage.remove("token"); // borrar token local
      await this.presentToast('Has cerrado sesión correctamente', 'success');

      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1500);

    } catch (err) {
      console.error('Error en logout:', err);
      await this.presentToast('Error al cerrar sesión: ' + err, 'error');
    }
  }




}
