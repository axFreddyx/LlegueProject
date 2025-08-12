import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular'; // <-- NUEVO

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: false,
})
export class CreatePage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage,
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController // <-- NUEVO
  ) { }

  // token = "";
  user = {
    nombre: "",
    email: "",
    password: "",
    apellidos: "",
    username: "",
    role: 0,
    confirmed: true,
    blocked: false
  }
  roles: any[] = [];
  token: any;

  roleParameter: any;

  async ngOnInit() {
    await this.getRoles();            // Espera a que carguen los roles
    this.getRoleByParameter();        // Luego procesa el parámetro y asigna el role

    const currentUrl = this.router.url.toLowerCase();

    if (currentUrl.includes('/ver/admins')) {
      this.user.role = 3; // Admin
    } else if (currentUrl.includes('/ver/padres')) {
      this.user.role = 4; // Persona Autorizada
    } else if (currentUrl.includes('/ver/docentes')) {
      this.user.role = 5; // Docente
    }
  }

  previewImg: string | null = null;

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImg = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async crearPersona() {
    const token = await this.storage.get('token');

    this.api.register(this.user, token).then(res => {
      console.log(res);
      // this.presentToast('Usuario creado correctamente.', 'success');
      // Puedes redirigir si quieres:
      // this.router.navigateByUrl('/ver/usuarios');
    }).catch(err => {
      console.error(err);
      const msg = err?.error?.error?.message || err?.error?.message || 'No se pudo crear el usuario.';
      this.presentToast(msg, 'danger');
    });

  }

  async getRoles() {
    const token = await this.storage.get('token');
    try {
      const res: any = await this.api.getRoles(token);
      const roles = res.data.roles;
      roles.forEach((role: any) => {
        if (role.type !== 'public' && role.type !== 'authenticated') {
          this.roles.push(role);
        }
      });
      console.log('Roles cargados:', this.roles);

    } catch (err) {
      console.error(err);
      this.presentToast('Error al cargar roles.', 'danger'); 
    }
  }

  getRoleByParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    this.roleParameter = urlParams.get('role');
    console.log('roleParameter:', this.roleParameter);

    if (this.roleParameter) {
      const matchedRole = this.roles.find(r =>
        r.id === this.roleParameter || r.type.toLowerCase() === this.roleParameter.toLowerCase()
      );
      if (matchedRole) {
        this.user.role = matchedRole.id;
        console.log('Role asignado:', this.user.role);
      } else {
        console.warn('No se encontró un rol que coincida con:', this.roleParameter);
      }
    }
  }

  // helper de toast (verde/rojo/amarillo) 
  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success',
    duration = 1500
  ) {
    const t = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color
    });
    await t.present();
  }
}
