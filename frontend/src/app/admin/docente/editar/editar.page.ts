import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.page.html',
  styleUrls: ['./editar.page.scss'],
  standalone: false
})
export class EditarPage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController,
    private router: Router
  ) { }

  user = {
    nombre: "",
    apellidos: "",
    username: "",
    email: "",
    role: 0
  }

  idDocente!: string;

  token = "";

  docente:any = {};

  roles: any[] = [];
  roleParameter: any;

  async ngOnInit() {
    this.token = await this.storage.get("token");
    this.idDocente = window.location.href.split('/').pop() || "";

    // Primero carga los roles
    await this.getRoles();

    // Luego carga el usuario
    await this.getDocente();

    // Ahora que roles están cargados, asigna el role desde el parámetro
    this.getRoleByParameter();

    const currentUrl = this.router.url.toLowerCase();

    if (currentUrl.includes('/ver/admins')) {
      this.user.role = 3; // Admin
    } else if (currentUrl.includes('/ver/padres')) {
      this.user.role = 4; // Persona Autorizada
    } else if (currentUrl.includes('/ver/docentes')) {
      this.user.role = 5; // Docente
    }
  }

  async update() {
    await this.api.updateUser(this.user, this.idDocente).then((res:any)=>{
      this.presentToast("Se ha actualizado el docente de manera exitosa", "success")
    }).catch((err:any) => {
      this.presentToast("Ha ocurrido un error", "error")
      console.error(err);
    })
  }

  getDocente() {
    return this.api.getUserById(this.idDocente, this.token).then((res: any) => {
      const data = res.data;
      this.docente = data;
      this.user = {
        nombre: data.nombre,
        apellidos: data.apellidos,
        username: data.username,
        email: data.email,
        role: data.type,
      };
    }).catch((err: any) => {
      console.error(err);
    });
  }

  async getRoles() {
    try {
      const res: any = await this.api.getRoles(this.token);
      const roles = res.data.roles;
      this.roles = []; // limpiar para evitar duplicados

      roles.forEach((role: any) => {
        if (role.type !== 'public' && role.type !== 'authenticated') {
          this.roles.push(role);
        }
      });
      console.log('Roles cargados:', this.roles);
    } catch (err) {
      console.error(err);
      this.presentToast('Error al cargar roles.', 'error');
    }
  }

  async presentToast(message: string, type: 'success' | 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
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

}
