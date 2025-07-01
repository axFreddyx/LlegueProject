import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent implements OnInit {
  menuType: string = 'overlay';

  constructor(
    private storage: Storage,
    private router: Router,
    public menu: MenuController
  ) {}

  ngOnInit() {}

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

redirect(path: string) {
  this.router.navigateByUrl(path).then(() => {
    this.menu.close(); // ✅ Cierra el menú tras la redirección
  });

}


  // protectedRoute() {
  //   const checkInterval = setInterval(() => {
  //     this.storage.get("token").then(token => {
  //       if (!token) {
  //         clearInterval(checkInterval); // Detenemos el chequeo
  //         this.redirect("/login");
  //       }
  //     });
  //   }, 1000); // Verifica cada 1 segundo, puedes ajustar el tiempo
  // }


}