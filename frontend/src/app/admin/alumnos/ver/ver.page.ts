import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonAlert, IonModal, ToastController } from '@ionic/angular'; 

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false
})
export class VerPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('deleteAlert') deleteAlert: IonAlert | undefined;

  alumnos: any[] = [];
  token = '';
  salones: any[] = [];
  salon: any;
  alumno: any;
  alumnosFiltrados: any[] = [];
  alumnosSeleccionados: any[] = [];
  salonSeleccionado: string = '';
  idAlumno!: string;
  cantidadAlumnos: number = 0;

  isSelecting: boolean = false;
  allSelected = false;

  data: any = { salon: {} };

  public alertButtons = [
    { text: 'Cancelar', role: 'cancel', handler: () => {} },
    { text: 'Confirmar', role: 'confirm', handler: () => { this.asignarSalon(); } },
  ];

  public alertButtonsDelete = [
    { text: 'Cancelar', role: 'cancel', handler: () => {} },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: () => {
        if (this.isSelecting) {
          this.alumnosSeleccionados.forEach(alumno => this.eliminar(alumno));
          this.notSelectingAlumnos();
        } else {
          this.eliminar(this.alumno);
          this.alumno = null;
        }
      },
    },
  ];

  public alertHeaderDelete: string = "";

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController 
  ) {}

  async ngOnInit() {
    this.token = await this.storage.get('token');
    this.getAlumnos();
    this.getSalones();
  }

  // helper toast 
  private async presentToast(message: string, duration = 2200) {
    const t = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'danger' // rojo por defecto para errores
    });
    await t.present();
  }

  async getAlumnos() {
    await this.api.getAlumnos(this.token).then((res: any) => {
      this.alumnos = res.data.data;
    }).catch((err: any) => {
      console.error('Error fetching alumnos:', err);
      this.presentToast('Error al cargar alumnos.');
    });
  }

  async getSalones() {
    await this.api.getSalones(this.token).then((res: any) => {
      this.salones = res.data.data;
      for (let i = 0; i < this.salones.length; i++) {
        this.salones[i].totalAlumnos = this.salones[i]?.alumnos?.length || 0;
      }
    }).catch((err: any) => {
      console.error('Error fetching salones:', err);
      this.presentToast('Error al cargar salones.');
    });
  }

  async asignarSalon() {
    await this.api.updateAlumno(this.idAlumno, this.data, this.token).then((res: any) => {
      this.modal.dismiss(null, 'confirm');
      this.alumnos = [];
      this.getAlumnos();
    }).catch((err: any) => {
      console.error('Error updating alumno:', err?.response?.data || err);
      this.presentToast('No se pudo asignar el salón.');
    });
  }

  openAlert(salon: any) {
    this.data = { salon: salon.id };
    const alert = document.querySelector('ion-alert');
    alert?.present();
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

  redirectToAddAlumno() {}

  selectingAlumnos() { this.isSelecting = true; }

  selectAlumnos(alumno: any) {
    if (alumno.selected) {
      if (!this.alumnosSeleccionados.some(a => a.id === alumno.id)) {
        this.alumnosSeleccionados.push(alumno);
      }
    } else {
      this.alumnosSeleccionados = this.alumnosSeleccionados.filter(a => a.id !== alumno.id);
    }
    this.allSelected = this.alumnos.length === this.alumnosSeleccionados.length;
  }

  notSelectingAlumnos() {
    this.isSelecting = false;
    this.alumnosSeleccionados = [];
    this.alumnos.forEach(alumno => { alumno.selected = false; });
  }

  clickAlumno(alumno: any) {
    this.selectAlumnos(alumno);
    alumno.selected = !alumno.selected;
    console.log(this.alumnosSeleccionados);
  }

  eliminar(alumno: any) {
    this.api.deleteAlumno(alumno.id, this.token).then(() => {
      this.alumnos = this.alumnos.filter(a => a.id !== alumno.id);
    }).catch((err: any) => {
      console.error('Error deleting alumno:', err?.response?.data || err);
      this.presentToast('No se pudo eliminar el alumno.');
    });
  }

  openAlertDelete(alumno: any = null) {
    if (alumno) {
      this.alumno = alumno;
      this.idAlumno = alumno.documentId;
      this.alertHeaderDelete = `¿Deseas eliminar al alumno ${alumno.nombre} ${alumno.apellidos}?`;
    } else {
      this.alumno = null;
      this.cantidadAlumnos = this.alumnosSeleccionados.length;
      this.alertHeaderDelete = `¿Deseas eliminar ${this.cantidadAlumnos} alumno(s)?`;
    }
    this.deleteAlert?.present();
  }

  toggleSelectAll(event: any) {
    const checked = event.detail.checked;
    this.allSelected = checked;
    this.alumnos.forEach(alumno => alumno.selected = checked);
    this.alumnosSeleccionados = checked ? [...this.alumnos] : [];
  }

  toggleSelectAllLabel() {
    this.allSelected = !this.allSelected;
    this.toggleSelectAll({ detail: { checked: this.allSelected } });
  }
}
