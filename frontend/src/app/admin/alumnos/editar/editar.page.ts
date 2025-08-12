import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.page.html',
  styleUrls: ['./editar.page.scss'],
  standalone: false
})
export class EditarPage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage
  ) { }

  async ngOnInit() {
    this.token = await this.storage.get('token');
    this.getAlumno()
  }

  previewImg: string | null = null;
  isIngresado: boolean = false;
  token = "";
  idAlumno!: string;
  alumno: any = {};

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

  async update() {
    // Funcion para guardar un alumno
    await this.api.updateAlumno(this.idAlumno, this.data, this.token).then((res: any) => {
      this.getAlumno();
    }).catch((err: any) => {
      console.error('Error creating alumno:', err.response?.data || err);
    });
  }

  getAlumno() {
    // Obtener el ID del alumno desde la URL
    const url = window.location.href;
    const id = url.split('/').pop();

    // Llamar al servicio para obtener los datos del alumno
    this.api.getAlumno(id).then((res: any) => {
      this.alumno = res.data.data;
      this.data = {
        nombre: this.alumno.nombre,
        apellidos: this.alumno.apellidos
      };

      this.idAlumno = res.data.data.documentId;
      // this.previewImg = res.data.attributes.foto ? res.data.attributes.foto : null;
    }).catch((err: any) => {
      console.error('Error fetching alumno:', err.response?.data || err);
    });
  }

  reset() {
    this.data = {
      nombre: "",
      apellidos: "",
    };
  }

}
