import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

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
    private toastController: ToastController
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.toggleMenu();
      });
  }

  toggleMenu() {
    const hideMenuRoutes = ['/login', '/llegue', '/alumnos', '/perfil', '/llegue-global'];
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

  logout() {
    console.log("Has cerrado sesión");

    this.storage.remove("token").then(() => {
      // Mostrar mensaje antes de redirigir
      this.presentToast('Has cerrado sesión correctamente', 'success');

      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1500);
    });
  }
}
