import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {

  fotoPreview: string | ArrayBuffer | null = null;
  nombreINE: string | null = null;


  confirmed: boolean = false;
  nombre = '';
  apellidos = '';
  username = '';
  email = '';
  password = '';
  role = 3;
  ine = '';
  foto = '';
  token = ""

  constructor(
    private api: ApiService,
    private router: Router,
    private db: Storage,
    private toastController: ToastController
  ) { }

  ngOnInit() {
  }

  async subirArchivos(): Promise<any[]> {
    const formData = new FormData();

    const fotoInput = document.getElementById('foto-input') as HTMLInputElement;
    if (fotoInput.files && fotoInput.files[0]) {
      formData.append('files', fotoInput.files[0]);
    }

    const ineInput = document.getElementById('ine-input') as HTMLInputElement;
    if (ineInput.files && ineInput.files[0]) {
      formData.append('files', ineInput.files[0]);
    }

    return await this.api.subirArchivos(formData);
  }

  previewFoto(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  seleccionarINE(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nombreINE = file.name;
    }
  }

  async Register() {
    try {
      // 1. Subir archivos
      const archivos = await this.subirArchivos(); // Devuelve IDs de Strapi

      // 2. Crear usuario
      const usuario = {
        nombre: this.nombre,
        apellidos: this.apellidos,
        username: this.username,
        email: this.email,
        password: this.password,
        confirmed: false,
        role: this.role,
        foto: archivos[0]?.id || null,  // ID de la foto en Strapi
        ine: archivos[1]?.id || null    // ID del INE en Strapi
      };

      await this.api.register(usuario, this.token);
      // console.log(respuesta);
      this.presentToast('Te has registrado de manera exitosa, Espera a que un administrador te active', 3000, 'success');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
      this.presentToast('Error al registrarse. Inténtalo de nuevo.', 3000, 'danger');
    }
  }

  presentToast(message: string, duration: number = 2000, color: string = 'success') {
    this.toastController.create({
      message,
      duration,
      color
    }).then(toast => toast.present());
  } 
}


