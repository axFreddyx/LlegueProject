import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: false
})
export class CreatePage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage
  ) { }

  async ngOnInit() {
    this.token = await this.storage.get('token');
  }

  previewImg: string | null = null;
  alumnosIngresados: any[] = [];
  isIngresado: boolean = false;
  token = "";

  data = {
    nombre: "",
    apellidos: "",
  }

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

    // Funcion para guardar varios alumnos
    if (this.alumnosIngresados.length > 0) {
      this.alumnosIngresados.forEach(async (alumno) => {
        await this.api.createAlumno(alumno, this.token).then((res: any) => {
          console.log('Alumno ingresado:', res.data);
        }).catch((err: any) => {
          console.error('Error creating alumno:', err.response?.data || err);
        });
      });
    } else {
      // Funcion para guardar un alumno
      await this.api.createAlumno(this.data, this.token).then((res: any) => {
        console.log('Alumno creado:', res.data);
        this.isIngresado = false;
        this.reset();
      }).catch((err: any) => {
        console.error('Error creating alumno:', err.response?.data || err);
      });
    }
  }

  reset() {
    this.data = {
      nombre: "",
      apellidos: "",
    };
  }

  ingresarOtroAlumno() {
    this.isIngresado = true;
    this.alumnosIngresados.push({ ...this.data });
    this.reset();
  }

}
