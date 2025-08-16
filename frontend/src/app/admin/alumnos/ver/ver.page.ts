import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonAlert, IonModal, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment'; // ✅ NUEVO
import { Router } from '@angular/router';

interface Salon {
  aula: string;
  grado: number;
  grupo: string;
  alumnos?: any[]; // opcional si quieres totalAlumnos
}


@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false
})
export class VerPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('deleteAlert') deleteAlert?: IonAlert;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;


  previewImg: string | null = null;
  fotoFile: File | null = null;

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
  }

  private organizarAlumnosPorSalon() {
    // Vaciar antes
    this.alumnosPorSalon = {};
    this.alumnosSinSalon = [];

    this.alumnos.forEach(a => {
      if (a.salon && a.salon.id) {
        if (!this.alumnosPorSalon[a.salon.id]) {
          this.alumnosPorSalon[a.salon.id] = [];
        }
        this.alumnosPorSalon[a.salon.id].push(a);
      } else {
        this.alumnosSinSalon.push(a);
      }
    });
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.fotoFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewImg = reader.result as string);
    reader.readAsDataURL(file);
  }

  ingresarOtroAlumno() {
    if (!this.data.nombre || !this.data.apellidos || !this.fotoFile) {
      this.presentToast('Agrega nombre, apellidos y foto antes de continuar.', 'error');
      return;
    }
    this.isIngresado = true;

    this.alumnosIngresados.push({
      nombre: this.data.nombre,
      apellidos: this.data.apellidos,
      fotoFile: this.fotoFile
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

  async save() {
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
        this.alumnosIngresados = [];
        //this.presentToast('Se han ingresado los alumnos exitosamente.', 'success');

        await this.router.navigate(['/ver/alumnos'], {
          replaceUrl: true,
          // state: { toast: { message: 'Alumno guardado/actualizado correctamente.', type: 'success' } }
        });
        this.presentToast("Alumno Guardado correctamente", "success")

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
      this.alumnos = res.data.data;

      // 🟢 Organizar alumnos por salón
      this.organizarAlumnosPorSalon();

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
    } catch (err) {
      console.error('Error deleting alumno:', err);
      this.presentToast('No se pudo eliminar el alumno.');
    }
  }

  async eliminarSeleccionados() { //Selected section
    await Promise.all(this.alumnosSeleccionados.map(a =>
      this.api.deleteAlumno(a.documentId, this.token)
        .then(() => this.alumnos = this.alumnos.filter(al => al.id !== a.id))
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

  selectAlumnos(alumno: any) { //Selected section
    const exists = this.alumnosSeleccionados.some(a => a.id === alumno.id);
    this.alumnosSeleccionados = exists
      ? this.alumnosSeleccionados.filter(a => a.id !== alumno.id)
      : [...this.alumnosSeleccionados, alumno];
    alumno.selected = !exists;
    this.allSelected = this.alumnos.length === this.alumnosSeleccionados.length;
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
