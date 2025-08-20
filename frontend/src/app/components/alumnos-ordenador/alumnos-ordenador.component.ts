import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IonAlert, IonModal, ToastController } from '@ionic/angular';
import { IonCard } from "@ionic/angular/standalone";
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment'; // ✅ NUEVO
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';

interface Salon {
  aula: string;
  grado: number;
  grupo: string;
  alumnos?: any[]; // opcional si quieres totalAlumnos
}

@Component({
  selector: 'app-alumnos-ordenador',
  templateUrl: './alumnos-ordenador.component.html',
  styleUrls: ['./alumnos-ordenador.component.scss'],
  // schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: false // Asegúrate de que este componente no sea standalone
})
export class AlumnosOrdenadorComponent implements OnInit {

  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('deleteAlert') deleteAlert?: IonAlert;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  previewImg: string | null = null;
  fotoFile: File | null = null;
  isHeHaveSalon = false;

  alumnosIngresados: Array<{ nombre: string; apellidos: string; fotoFile: File }> = [];
  isIngresado = false;

  data_alumno = { nombre: '', apellidos: '' };


  alumnosPorSalon: { [salonId: string]: any[] } = {};
  alumnosSinSalon: any[] = [];


  alumnos: any[] = [];
  salones: any[] = [];

  alumnosSeleccionados: any[] = [];  //Selected section
  alumno: any;
  salon: any = null;
  idAlumno!: string;
  cantidadAlumnos = 0;
  token = '';

  isSelecting = false; //Selected section
  allSelected = false; //Selected section

  data: any = { salon: {} };

  alertButtons = [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Confirmar', role: 'confirm', handler: () => this.asignarSalon() }
  ];

  alertButtonsDelete = [
    { text: 'Cancelar', role: 'cancel' },
    {
      text: 'Confirmar', role: 'confirm', handler: () => {
        this.isSelecting ? this.eliminarSeleccionados() : (this.eliminar(this.alumno), this.alumno = null);
      }
    }
  ];

  alertHeaderDelete = '';

  // 👉 Base para archivos (derivada de apiUrl quitando /api). Ej: "http://localhost:1337"
  private readonly assetsBase = environment.apiUrl.replace(/\/api\/?$/, ''); // ✅ NUEVO

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController,
    private router: Router
  ) { }

  async ngOnInit() {
    this.token = await this.storage.get('token');
    this.getAlumnos();
    this.getSalones();
    this.changeBox(); // Inicializar el scroll en el box
  }

  // Variable que se mostrará en la vista
  alumnosFiltrados: any[] = [];

  onClick(conSalon: any) {
    this.organizarAlumnosPorSalon(conSalon);
  }

  changeBox() {
    // Aqui se definira la logica para agregar el scroll cuando el box llega a un tamaño maximo
    const box = document.getElementById('listado-alumnos-box');
    // Definir el tamaño máximo del box
    const maxHeight = 400; // Puedes ajustar este valor según tus necesidades
    if (box) {
      box.classList.toggle('scrollable', box.scrollHeight > maxHeight);
    }
  }

  private organizarAlumnosPorSalon(conSalon: any) {
    this.isSelecting = false; //Selected section
    this.isHeHaveSalon = conSalon;
    if (conSalon === true) {
      this.alumnosFiltrados = this.alumnos.filter(a => a.salon);
    } else if (conSalon === false) {
      this.alumnosFiltrados = this.alumnos.filter(a => !a.salon);
    } else if (conSalon === null) {
      this.alumnosFiltrados = this.alumnos;
    }
  }

  // Toast helper
  private async presentToast(message: string, type: 'success' | 'error' = 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
  }

  // API calls
  async getAlumnos() {
    try {
      const res: any = await this.api.getAlumnos(this.token);
      this.alumnos = res.data.data;          // ✅ guardar todos los alumnos
      this.alumnosFiltrados = [...this.alumnos]; // ✅ inicializar filtrados
    } catch (err) {
      console.error('Error fetching alumnos:', err);
      this.presentToast('Error al cargar alumnos.');
    }
  }


  private async presentToasts(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'danger',
    duration = 2200
  ) {
    const t = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color
    });
    await t.present();
  }
  async getSalones() {
    this.salones = [];
    try {
      const res = await this.api.verSalones(this.token);
      const data = (res.data as any).data as Salon[];

      // Añadir totalAlumnos y ordenar por grado y grupo
      this.salones = data
        .map(s => ({
          ...s,
          totalAlumnos: s?.alumnos?.length || 0
        }))
        .sort((a: Salon, b: Salon) => {
          return a.grado !== b.grado
            ? a.grado - b.grado
            : a.grupo.toLowerCase().localeCompare(b.grupo.toLowerCase());
        });

      console.log(this.salones);
    } catch (error) {
      console.error('Error cargando salones:', error);
      this.presentToasts('Error al cargar salones.', 'danger');
    }
  }

  async asignarSalonOne(alumnoId: string) {
    try {
      await this.api.updateAlumno(alumnoId, this.data, this.token);
      this.getAlumnos();
      this.presentToast('Salón asignado correctamente.', 'success');
      this.isSelecting = false;
    } catch (err) {
      console.error('Error updating alumno:', err);
      this.presentToast('No se pudo asignar el salón.');
    }
  }

  asignarSalon() {
    if (this.alumnosSeleccionados.length > 1) {
      this.alumnosSeleccionados.forEach(a => this.asignarSalonOne(a.documentId));
    } else {
      this.asignarSalonOne(this.idAlumno);
    }
    this.modal.dismiss(null, 'confirm');
  }

  async eliminar(alumno: any) {
    try {
      await this.api.deleteAlumno(alumno.documentId, this.token);
      this.alumnos = this.alumnos.filter(a => a.id !== alumno.id);
      this.presentToast(`Alumno ${alumno.nombre} eliminado.`, 'success');
      this.getAlumnos();
    } catch (err) {
      console.error('Error deleting alumno:', err);
      this.presentToast('No se pudo eliminar el alumno.');
    }
  }

  async eliminarSeleccionados() { //Selected section
    await Promise.all(this.alumnosSeleccionados.map(a =>
      this.api.deleteAlumno(a.documentId, this.token)
        .then(() => {
          this.getAlumnos();
          this.alumnos = this.alumnos.filter(al => al.id !== a.id)
        }
        )
        .catch(err => {
          console.error('Error deleting alumno:', err);
          this.presentToast(`No se pudo eliminar a ${a.nombre}.`);
        })
    ));
    this.presentToast(`${this.alumnosSeleccionados.length} alumno(s) eliminados.`, 'success');
    this.notSelectingAlumnos();
  }

  // UI interactions
  openAlert(salon: any) {
    this.salon = salon;
    this.data = { salon: salon.id };
    document.querySelector('ion-alert')?.present();
  }

  cancel() {
    this.modal.dismiss();
    this.alumno = null;
  }

  openModal(alumno: any) {
    this.alumno = alumno;
    this.idAlumno = alumno.documentId;
    this.modal.present();
  }

  openModalVarios() {
    this.modal.present();
  }

  selectingAlumnos() { //Selected section
    this.isSelecting = true;
  }

  selectAlumnos(alumno: any) {
    // Alternar selección
    const index = this.alumnosSeleccionados.findIndex(a => a.id === alumno.id);
    if (index > -1) {
      this.alumnosSeleccionados.splice(index, 1);
      alumno.selected = false;
    } else {
      this.alumnosSeleccionados.push(alumno);
      alumno.selected = true;
    }

    // Actualizar la bandera: si hay al menos un alumno con salón, ocultar el botón
    this.isHeHaveSalon = this.alumnosSeleccionados.some(a => a.salon !== null);
  }

  notSelectingAlumnos() { //Selected section
    this.isSelecting = false;
    this.allSelected = false;
    this.alumnosSeleccionados = [];
    this.alumnos.forEach(a => a.selected = false);
  }

  clickAlumno(alumno: any) { //Selected section
    this.selectAlumnos(alumno);
  }

  openAlertDelete(alumno: any = null) {
    if (alumno) {
      this.alumno = alumno;
      this.idAlumno = alumno.documentId;
      this.alertHeaderDelete = `¿Deseas eliminar al alumno ${alumno.nombre} ${alumno.apellidos}?`;
    } else {
      this.cantidadAlumnos = this.alumnosSeleccionados.length;
      this.alertHeaderDelete = `¿Deseas eliminar ${this.cantidadAlumnos} alumno(s)?`;
    }
    this.deleteAlert?.present();
  }

  toggleSelectAll(event: any) { //Selected section
    const checked = event.detail.checked;
    this.allSelected = checked;
    this.alumnos.forEach(a => a.selected = checked);
    this.alumnosSeleccionados = checked ? [...this.alumnos] : [];
  }

  toggleSelectAllLabel() { //Selected section
    this.allSelected = !this.allSelected;
    this.toggleSelectAll({ detail: { checked: this.allSelected } });
  }

  // 🖼️ Helper para obtener la URL de la foto desde Strapi (v4/v5)
  getFotoUrl(a: any): string | null { // ✅ NUEVO
    try {
      const f = a?.foto ?? a?.attributes?.foto;
      if (!f) return null;

      // Puede venir como {data:{attributes:{url, formats}}} o directo con {url, formats}
      const node = f?.data?.attributes ?? f?.attributes ?? f;
      if (!node) return null;

      // Prioriza thumbnail si existe; si no, usa url
      const url: string | undefined = node?.formats?.thumbnail?.url || node?.url;
      if (!url) return null;

      // Si es relativa (/uploads/...), anteponer host; si ya es absoluta, devolverla tal cual
      return url.startsWith('http') ? url : `${this.assetsBase}${url}`;
    } catch {
      return null;
    }
  }
}
