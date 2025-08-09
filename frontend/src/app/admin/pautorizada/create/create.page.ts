import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: false,
})
export class CreatePage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage
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
    }).catch(err => {
      console.error(err);
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
    }
  }

  getRoleByParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    this.roleParameter = urlParams.get('role');
    console.log('roleParameter:', this.roleParameter);

    if (this.roleParameter) {
      // Busca el rol dentro de los roles cargados (puedes buscar por id o name)
      const matchedRole = this.roles.find(r => r.id === this.roleParameter || r.type.toLowerCase() === this.roleParameter.toLowerCase());
      if (matchedRole) {
        this.user.role = matchedRole.id;  // Asigna el id para que se seleccione en el ion-select
        console.log('Role asignado:', this.user.role);
      } else {
        console.warn('No se encontró un rol que coincida con:', this.roleParameter);
      }
    }
  }
}
