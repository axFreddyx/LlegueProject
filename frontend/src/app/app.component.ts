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
    // this.getMe();
    this.toggleMenu();
  }

  // async getMe() {
  //   await this.api.getUserByMe().then((res: any) => {
  //     console.log("Yo => ",res.data.id);
  //     this.idUser = res.data.id;
  //   }).catch((err: any) => {
  //     console.log(err);
  //   });
  // }

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
      const user: any = await this.api.getUserByMe();
      const userId = user?.data?.id;
      const jwt = await this.storage.get("token"); // asegurar que tienes el token válido

      if (userId && user.data.token_push) {
        await this.api.gestionarToken(userId, '', jwt);
        console.log("Token_push eliminado en backend");
      }

      await this.storage.remove("token"); // borrar token local después de éxito
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
