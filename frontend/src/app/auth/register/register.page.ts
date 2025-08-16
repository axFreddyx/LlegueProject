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
  if (this.password === '') {
    const toast = await this.toastController.create({
      message: 'Por favor, complete todos los campos',
      duration: 2000,
      color: 'danger'
    });
    toast.present();
    return;
  }

  // 1️⃣ Subimos los archivos primero
  const archivos = await this.subirArchivos(); // este método sube a /api/upload
  // archivos = [{id:12, name:"foto.png", ...}, {id:13, name:"ine.pdf", ...}]

  // 2️⃣ Identificamos cada archivo por tipo
  const fotoArchivo = archivos.find(f => f.ext === '.png' || f.ext === '.jpg' || f.ext === '.jpeg');
  const ineArchivo = archivos.find(f => f.ext === '.pdf');

  // 3️⃣ Creamos el usuario y asociamos los archivos usando sus ids
  const data = {
    nombre: this.nombre,
    apellidos: this.apellidos,
    username: this.username,
    email: this.email,
    password: this.password,
    role: this.role,
    confirmed: this.confirmed,
    foto: fotoArchivo ? fotoArchivo.id : null,
    ine: ineArchivo ? ineArchivo.id : null
  };

  try {
    const response = await this.api.crear_cuenta(data); // aquí va solo JSON
    console.log(response);
    this.router.navigate(['/home']);
  } catch (error) {
    console.error(error);
  }
}




}


