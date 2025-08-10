import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuController } from '@ionic/angular';
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
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.toggleMenu();
      });
  }

  toggleMenu() {
    const hideMenuRoutes = ['/login', 'llegue', 'alumnos'];
    const isHiddenPage = hideMenuRoutes.includes(this.router.url);

    this.menuCtrl.enable(!isHiddenPage);
  }

  logout() {
    console.log("Has cerrado sesión");

    // Primero borra el token
    this.storage.remove("token").then(() => {
      // Después redirige con un pequeño delay si deseas
      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1000);
    });
  }
}
