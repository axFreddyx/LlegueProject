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
  token = "";

  docentesIngresados: any[] = [];
  isIngresado: boolean = false;

  roleParameter: any;

  async ngOnInit() {
    await this.getRoles();            // Espera a que carguen los roles
    this.getRoleByParameter();        // Luego procesa el parámetro y asigna el role

    this.token = await this.storage.get("token");

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

  async save() {
    try {
      if (this.docentesIngresados.length > 0) {
        await this.saveMultiple(this.docentesIngresados);
        this.docentesIngresados = [];
      } else {
        await this.saveOne(this.user);
        this.reset();
      }
      this.isIngresado = false;
    } catch (err: any) {
      console.error('Error creating user:', err.response?.data || err);
      this.presentToast("Ocurrió un error al guardar el usuario.", "error");
    }
  }

  private async saveMultiple(docentes: any[]) {
    await Promise.all(docentes.map(a => this.api.register(a, this.token)));
    this.presentToast(`Se han ingresado ${docentes.length} usuarios de manera exitosa.`, "success");
  }

  private async saveOne(docente: any) {
    await this.api.register(docente, this.token);
    this.presentToast("El usuario se ha ingresado de manera exitosa.", "success");
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
      this.presentToast('Error al cargar roles.', 'error');
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
  async presentToast(message: string, type: 'success' | 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
  }
  ingresarOtroDocente() {
    this.isIngresado = true;
    this.docentesIngresados.push({ ...this.user });
    this.reset();

  }
  reset() {
    this.user = {
      nombre: "",
      email: "",
      password: "",
      apellidos: "",
      username: "",
      role: this.roleParameter,
      confirmed: true,
      blocked: false
    }
    this.previewImg = null;
  }

  isFullCampos(): boolean {
    const u = this.user;

    // Validar que cada campo requerido no esté vacío o null o undefined
    if (
      !u.nombre?.trim() ||
      !u.email?.trim() ||
      !u.password?.trim() ||
      !u.apellidos?.trim() ||
      !u.username?.trim() ||
      u.role === null || u.role === undefined
    ) {
      return false; // Algún campo está vacío o inválido
    }

    return true; // Todos los campos están llenos correctamente
  }

}
