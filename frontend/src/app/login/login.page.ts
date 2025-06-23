import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';


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
    private db: Storage
  ) { }

  identifier = '';
  password = '';
  message = ''; // Para mostrar el mensaje
  messageType = ''; // Tipo de mensaje ('success', 'error')

  ngOnInit() { 
    this.db.create();
  }

  login() {
    let data = {
      identifier: this.identifier,
      password: this.password
    };

    this.api.login(data).subscribe({
      next: (data: any) => {
        console.log(data);
        this.db.set('token',data.jwt);
        
        this.message = 'Inicio de sesión exitoso';
        this.messageType = 'success';
        
        setTimeout(() => {
          this.message = '';
          this.messageType = '';
        }, 3000);
        this.router.navigateByUrl("/home");
      },
      error: (error: any) => {
        console.log("Algo que no debería pasar pasó");
        console.log(error);
        this.message = 'Ocurrió un error desconocido';
        this.messageType = 'error';

        setTimeout(() => {
          this.message = '';
          this.messageType = '';
        }, 3000);
      }
    });
  }
}
