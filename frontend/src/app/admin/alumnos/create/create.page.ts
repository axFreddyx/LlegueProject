import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: false
})
export class CreatePage implements OnInit {

  previewImg: string | null = null;
  alumnosIngresados: any[] = [];
  isIngresado = false;
  token = "";
  data = { nombre: "", apellidos: "" };

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.token = await this.storage.get('token');
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.previewImg = reader.result as string;
    reader.readAsDataURL(file);
  }

  async save() {
    try {
      if (this.alumnosIngresados.length > 0) {
        await this.saveMultiple(this.alumnosIngresados);
        this.alumnosIngresados = [];
      } else {
        await this.saveOne(this.data);
        this.reset();
      }
      this.isIngresado = false;
    } catch (err: any) {
      console.error('Error creating alumno:', err.response?.data || err);
      this.presentToast("Ocurrió un error al guardar el alumno.", "error");
    }
  }

  private async saveMultiple(alumnos: any[]) {
    await Promise.all(alumnos.map(a => this.api.createAlumno(a, this.token)));
    this.presentToast(`Se han ingresado ${alumnos.length} alumnos de manera exitosa.`, "success");
  }

  private async saveOne(alumno: any) {
    await this.api.createAlumno(alumno, this.token);
    this.presentToast("El alumno se ha ingresado de manera exitosa.", "success");
  }

  reset() {
    this.data = { nombre: "", apellidos: "" };
    this.previewImg = null;
  }

  ingresarOtroAlumno() {
    this.isIngresado = true;
    this.alumnosIngresados.push({ ...this.data });
    this.reset();
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
}
