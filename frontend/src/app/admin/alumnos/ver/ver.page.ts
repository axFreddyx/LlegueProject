import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonAlert, IonModal } from '@ionic/angular';

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
  salonSeleccionado: string = ''; // ID o nombre del salón seleccionado
  idAlumno!: string;
  cantidadAlumnos: number = 0;

  isSelecting: boolean = false;
  allSelected = false;

  data: any = {
    salon: {},
  }

  public alertButtons = [
    {
      text: 'Cancelar',

      role: 'cancel',
      handler: () => {
      },
    },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: () => {
        this.asignarSalon();
      },
    },
  ];

  public alertButtonsDelete = [
    {
      text: 'Cancelar',

      role: 'cancel',
      handler: () => {
      },
    },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: () => {
        if (this.isSelecting) {
          this.alumnosSeleccionados.forEach(alumno => {
            this.eliminar(alumno);
          });
          this.notSelectingAlumnos();
        } else {
          this.eliminar(this.alumno);
          this.alumno = null;
        }
        // this.eliminar();
      },
    },
  ];

  public alertHeaderDelete: string = "";

  constructor(
    private api: ApiService,
    private storage: Storage
  ) { }

  async ngOnInit() {
    this.token = await this.storage.get('token');
    this.getAlumnos();
    this.getSalones();
  }

  async getAlumnos() {
    await this.api.getAlumnos(this.token).then((res: any) => {
      this.alumnos = res.data.data;
    }).catch((err: any) => {
      console.error('Error fetching alumnos:', err);
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
    });
  }

  async asignarSalon() {
    await this.api.updateAlumno(this.idAlumno, this.data, this.token).then((res: any) => {
      this.modal.dismiss(null, 'confirm');
      this.alumnos = [];
      this.getAlumnos();
    }).catch((err: any) => {
      console.error('Error updating alumno:', err.response?.data || err);
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
    this.idAlumno = alumno.documentId; // Asegúrate de que el ID del alumno sea un número
    this.modal.present();
  }

  redirectToAddAlumno() {

  }

  selectingAlumnos() {
    this.isSelecting = true
  }

  selectAlumnos(alumno: any) {
    if (alumno.selected) {
      // Agregar si no está
      if (!this.alumnosSeleccionados.some(a => a.id === alumno.id)) {
        this.alumnosSeleccionados.push(alumno);
      }
    } else {
      // Remover si está
      this.alumnosSeleccionados = this.alumnosSeleccionados.filter(a => a.id !== alumno.id);
    }

    // Actualizar el estado del checkbox "Seleccionar todos"
    this.allSelected = this.alumnos.length === this.alumnosSeleccionados.length;
  }

  notSelectingAlumnos() {
    this.isSelecting = false;
    this.alumnosSeleccionados = [];

    // Limpiar selección en cada alumno (su propiedad 'selected')
    this.alumnos.forEach(alumno => {
      alumno.selected = false;
    });
  }

  clickAlumno(alumno: any) {
    this.selectAlumnos(alumno);
    alumno.selected = !alumno.selected;
    console.log(this.alumnosSeleccionados)
  }

  eliminar(alumno: any) {
    this.api.deleteAlumno(alumno.id, this.token).then(() => {
      this.alumnos = this.alumnos.filter(a => a.id !== alumno.id);
    }).catch((err: any) => {
      console.error('Error deleting alumno:', err.response?.data || err);
    });
  }

  openAlertDelete(alumno: any = null) {
    if (alumno) {
      this.alumno = alumno;
      this.idAlumno = alumno.documentId; // o alumno.id según uses
      this.alertHeaderDelete = `¿Deseas eliminar al alumno ${alumno.nombre} ${alumno.apellidos}?`;
    } else {
      this.alumno = null;
      this.cantidadAlumnos = this.alumnosSeleccionados.length;
      this.alertHeaderDelete = `¿Deseas eliminar ${this.cantidadAlumnos} alumno(s)?`;
    }

    // Presenta el alert
    this.deleteAlert?.present();
  }

  toggleSelectAll(event: any) {
    const checked = event.detail.checked;
    this.allSelected = checked;
    this.alumnos.forEach(alumno => alumno.selected = checked);

    if (checked) {
      // Añadir todos a seleccionados
      this.alumnosSeleccionados = [...this.alumnos];
    } else {
      // Vaciar seleccionados
      this.alumnosSeleccionados = [];
    }
  }

  toggleSelectAllLabel() {
    this.allSelected = !this.allSelected;
    this.toggleSelectAll({ detail: { checked: this.allSelected } });
  }



}
