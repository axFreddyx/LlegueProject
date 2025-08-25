import { Component } from '@angular/core';
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



export class AppComponent {
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
      // Obtener usuario actual
      const user: any = await this.api.getUserByMe();
      const userId = user?.data?.id;

      // Limpiar token_push en backend si existe
      if (userId) {
        await this.api.clearPushToken(userId);
        console.log('token_push eliminado en backend');
      }

      // Borrar token local
      await this.storage.remove("token");

      // Mensaje y redirección
      this.presentToast('Has cerrado sesión correctamente', 'success');
      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1500);

    } catch (err) {
      console.error('Error en logout:', err);
      this.presentToast('Error al cerrar sesión', 'error');
    }
  }


}
