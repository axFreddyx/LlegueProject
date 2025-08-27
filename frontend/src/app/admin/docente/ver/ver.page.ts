import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonModal, IonAlert, ToastController, InfiniteScrollCustomEvent } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false,
})
export class VerPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('deleteAlert') deleteAlert?: IonAlert;  // Nuevo para alerta eliminar múltiple

  docentes: any[] = [];
  salones: any[] = [];

  docente: any;
  salon: any;

  idDocente!: number;

  data: any = { salon: {} };

  // Variables para selección múltiple (copiadas y adaptadas de alumnos)
  isSelecting = false;
  allSelected = false;
  docentesSeleccionados: any[] = [];

  // Paginación
  pageSize = 25; // Número de elementos por página
  numItems = 0; // Número actual de elementos cargados

  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => { console.log('Cancelado'); },
    },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: () => {
        this.asignarSalon();
        console.log('Confirmado');
      },
    },
  ];

  alertButtonsDelete = [
    { text: 'Cancelar', role: 'cancel' },
    {
      text: 'Confirmar', role: 'confirm', handler: () => {
        this.isSelecting ? this.eliminarSeleccionados() : (this.eliminar(this.docente), this.docente = null);
      }
    }
  ];

  alertHeaderDelete = '';

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.getDocentes();
    this.getSalones();
  }

  private async presentToast(message: string, color: 'danger' | 'warning' | 'success' = 'danger', duration = 2200) {
    const t = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color
    });
    await t.present();
  }

  async getDocentes(event?: InfiniteScrollCustomEvent) {
    try {
      // Asegúrate que tu API soporte offset y limit
      const res: any = await this.api.getUsersByRole(4, this.numItems, this.pageSize);
      const nuevosDocentes = res.data || [];

      // Evitar duplicados usando el ID del docente
      this.docentes = [
        ...this.docentes,
        ...nuevosDocentes.filter((nd:any) => !this.docentes.some(d => d.id === nd.id))
      ];

      // avanzar offset solo si recibimos datos
      if (nuevosDocentes.length > 0) {
        this.numItems += this.pageSize;
      }

      const total = res.data.meta?.pagination?.total ?? this.docentes.length;

      if (event) {
        event.target.complete();
        if (this.docentes.length >= total) {
          event.target.disabled = true;
        }
      }

      this.notSelectingDocentes();
    } catch (err) {
      console.error('Error fetching docentes:', err);
      this.presentToast('Error al cargar docentes.', 'danger');
    }
  }

  async getSalones() {
    const token = await this.storage.get('token');
    this.api.getSalones(token).then((res: any) => {
      const data = res.data.data;
      this.salones = data.filter((element: any) => {
        const docente = element.docente;
        return docente === null || docente === undefined || docente === '';
      });
      for (let i = 0; i < this.salones.length; i++) {
        this.salones[i].totalAlumnos = this.salones[i]?.alumnos?.length || 0;
      }
    }).catch((err: any) => {
      console.error('Error fetching salones:', err);
      this.presentToast('Error al cargar salones.', 'danger');
    });
  }

  async asignarSalon() {
    // Asignar a uno solo
    await this.api.updateUser(this.data, this.idDocente).then(() => {
      this.presentToast('Salón asignado correctamente.', 'success');
      this.getDocentes();
      this.notSelectingDocentes();
      this.getSalones();
    }).catch(err => {
      console.error('Error updating docente:', err);
      this.presentToast('No se pudo asignar el salón.', 'danger');
    });
    this.modal.dismiss(null, 'confirm');
  }

  async eliminar(docente: any) {
    // Implementar llamada API para eliminar docente (similar a eliminar alumno)
    // Supongamos que tienes api.deleteUser:
    try {
      await this.api.deleteUser(docente.id);
      this.docentes = this.docentes.filter(d => d.id !== docente.id);
      this.presentToast(`Docente ${docente.nombre} eliminado.`, 'success');
    } catch (err) {
      console.error('Error deleting docente:', err);
      this.presentToast('No se pudo eliminar el docente.', 'danger');
    }
  }

  async eliminarSeleccionados() {
    await Promise.all(this.docentesSeleccionados.map(d =>
      this.api.deleteUser(d.id)
        .then(() => this.docentes = this.docentes.filter(doc => doc.id !== d.id))
        .catch(err => {
          console.error('Error deleting docente:', err);
          this.presentToast(`No se pudo eliminar a ${d.nombre}.`, 'danger');
        })
    ));
    this.presentToast(`${this.docentesSeleccionados.length} docente(s) eliminados.`, 'success');
    this.notSelectingDocentes();
  }

  openModal(d: any) {
    this.modal.present();
    this.idDocente = d.id;
    this.docente = d;
  }

  openAlert(salon: any) {
    this.data = { salon: salon.id };
    this.salon = salon;
    document.querySelector('ion-alert')?.present();
  }

  redirectToAddDocente() {
    this.router.navigate(['/create/cuenta'], { queryParams: { role: 'docente' } });
  }
  redirectToEditDocente(d: any) {
    // console.log(d.documentId)
    this.router.navigate([`/editar/cuenta/${d.id}`], { queryParams: { role: 'docente' } });
  }

  // FUNCIONES SELECCIÓN MÚLTIPLE

  selectingDocentes() {
    this.isSelecting = true;
  }

  selectDocentes(docente: any) {
    const exists = this.docentesSeleccionados.some(d => d.id === docente.id);
    this.docentesSeleccionados = exists
      ? this.docentesSeleccionados.filter(d => d.id !== docente.id)
      : [...this.docentesSeleccionados, docente];
    docente.selected = !exists;
    this.allSelected = this.docentes.length === this.docentesSeleccionados.length;
  }

  notSelectingDocentes() {
    this.isSelecting = false;
    this.allSelected = false;
    this.docentesSeleccionados = [];
    this.docentes.forEach(d => d.selected = false);
  }

  clickDocente(docente: any) {
    this.selectDocentes(docente);
  }

  openAlertDelete(docente: any = null) {
    if (docente) {
      this.docente = docente;
      this.alertHeaderDelete = `¿Deseas eliminar al docente ${docente.nombre} ${docente.apellidos}?`;
    } else {
      this.alertHeaderDelete = `¿Deseas eliminar ${this.docentesSeleccionados.length} docente(s)?`;
    }
    this.deleteAlert?.present();
  }

  toggleSelectAll(event: any) {
    const checked = event.detail.checked;
    this.allSelected = checked;
    this.docentes.forEach(d => d.selected = checked);
    this.docentesSeleccionados = checked ? [...this.docentes] : [];
  }

  toggleSelectAllLabel() {
    this.allSelected = !this.allSelected;
    this.toggleSelectAll({ detail: { checked: this.allSelected } });
  }

  cancel() { this.modal.dismiss(null, 'cancel'); }
}
