import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  constructor(
    private storage: Storage,
    private router: Router
  ) {

  }
  ngOnInit() {
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
