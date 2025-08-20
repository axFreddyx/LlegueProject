// create.page.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: false
})
export class CreatePage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  previewImg: string | null = null;
  fotoFile: File | null = null;

  alumnosIngresados: Array<{ nombre: string; apellidos: string; fotoFile: File }> = [];
  isIngresado = false;
  token = '';
  data = { nombre: '', apellidos: '' };

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController,
    private router: Router
  ) { }

  async ngOnInit() {
    this.token = await this.storage.get('token');
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.fotoFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewImg = reader.result as string);
    reader.readAsDataURL(file);
  }

  async save() {
    console.log('Datos a guardar:', this.alumnosIngresados);
    try {
      if (this.alumnosIngresados.length > 0) {
        // guardar múltiples
        await Promise.all(
          this.alumnosIngresados.map(a =>
            this.api.createAlumnoConFoto(
              { nombre: a.nombre, apellidos: a.apellidos },
              a.fotoFile,
              this.token
            )
          )
        );
        this.presentToast('Se han ingresado los alumnos exitosamente.', 'success');

        await this.router.navigate(['/ver/alumnos'], {
          replaceUrl: true,
        });

      } else {
        // guardar uno
        if (!this.data.nombre || !this.data.apellidos) {
          return this.presentToast('Faltan nombre y apellidos.', 'error');
        }
        if (!this.fotoFile) {
          return this.presentToast('Debes seleccionar una foto del alumno.', 'error');
        }

        await this.api.createAlumnoConFoto(this.data, this.fotoFile, this.token);
        this.presentToast('El alumno se ha ingresado de manera exitosa.', 'success');

      }

      this.resetAll();
      this.isIngresado = false;
    } catch (err: any) {
      console.error('Error creando alumno:', err.response?.data || err);
      this.presentToast('Ocurrió un error al guardar el alumno.', 'error');
    }
  }

  ingresarOtroAlumno() {
    // if (!this.data.nombre || !this.data.apellidos || !this.fotoFile) {
    //   this.presentToast('Agrega nombre, apellidos y foto antes de continuar.', 'error');
    //   return;
    // }

    this.isIngresado = true;

    this.alumnosIngresados.push({
      nombre: this.data.nombre,
      apellidos: this.data.apellidos,
      fotoFile: this.fotoFile!
    });

    this.resetFormOnly();
  }


  resetFormOnly() {
    this.data = { nombre: '', apellidos: '' };
    this.previewImg = null;
    this.fotoFile = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  resetAll() {
    this.resetFormOnly();
    this.alumnosIngresados = [];
  }

  async presentToast(message: string, type: 'success' | 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
  }
}