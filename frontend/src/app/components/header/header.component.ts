import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  // schemas:[CUSTOM_ELEMENTS_SCHEMA],
  standalone: false,
})
export class HeaderComponent implements OnInit {

  constructor(
    private storage: Storage,
    private router: Router
  ) {

  }

  ngOnInit() {
    // this.protectedRoute();
  }

  logout() {
    console.log("has cerrado sesion")
    setTimeout(() => {
      this.redirect("/login");
    }, 3000)
    this.storage.remove("token")
  }

  redirect(path: any) {
    return this.router.navigateByUrl(`${path}`);
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