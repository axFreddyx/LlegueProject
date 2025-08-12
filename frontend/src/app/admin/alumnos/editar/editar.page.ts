import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.page.html',
  styleUrls: ['./editar.page.scss'],
  standalone: false
})
export class EditarPage implements OnInit {

  previewImg: string | null = null;
  isIngresado = false;
  token = "";
  idAlumno!: string;
  alumno: any = {};
  data = { nombre: "", apellidos: "" };

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.token = await this.storage.get('token');
    this.getAlumno();
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.previewImg = reader.result as string;
    reader.readAsDataURL(file);
  }

  async update() {
    try {
      await this.api.updateAlumno(this.idAlumno, this.data, this.token);
      this.presentToast("El alumno se ha actualizado correctamente.", "success");
      this.getAlumno();
    } catch (err: any) {
      console.error('Error updating alumno:', err.response?.data || err);
      this.presentToast("Ocurrió un error al actualizar el alumno.", "error");
    }
  }

  async getAlumno() {
    try {
      const id = window.location.href.split('/').pop();
      const res: any = await this.api.getAlumno(id);
      this.alumno = res.data.data;
      this.data = {
        nombre: this.alumno.nombre,
        apellidos: this.alumno.apellidos
      };
      this.idAlumno = this.alumno.documentId;
    } catch (err: any) {
      console.error('Error fetching alumno:', err.response?.data || err);
      this.presentToast("No se pudo obtener la información del alumno.", "error");
    }
  }

  reset() {
    this.data = { nombre: "", apellidos: "" };
    this.previewImg = null;
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
