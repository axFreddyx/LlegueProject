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

  async login() {
    const data = {
      identifier: this.identifier,
      password: this.password
    };

    await this.api.login(data).then(async (data: any) => {
      const datos = data;
      console.log("Login correcto:", datos);


      // Guardar usuario básico
      await this.db.set('token', `Bearer ${datos.jwt}`);

      // Obtener rol desde /api/users/me
      await this.api.getUserByMe().then((userWithRole: any) => {
        console.log("Usuario con rol:", userWithRole);
        const rol = userWithRole?.data?.role?.type;

        console.log("Rol del usuario:", rol);

        // Redirigir según rol
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

      this.message = 'Inicio de sesión exitoso';
      this.messageType = 'success';

      setTimeout(() => {
        this.message = '';
        this.messageType = '';
      }, 3000);
    }).catch((error: any) => {
      console.error("Error en login:", error);

      this.message = 'Ocurrió un error al iniciar sesión';
      this.messageType = 'error';

      setTimeout(() => {
        this.message = '';
        this.messageType = '';
      }, 3000);
    });
  }


}
