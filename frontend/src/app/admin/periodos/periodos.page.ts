import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { InfiniteScrollCustomEvent, IonAlert, ToastController } from '@ionic/angular';
import { IonModal } from '@ionic/angular/common';

@Component({
  selector: 'app-periodos',
  templateUrl: './periodos.page.html',
  styleUrls: ['./periodos.page.scss'],
  standalone: false
})
export class PeriodosPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('deleteAlert') deleteAlert?: IonAlert;

  token = '';
  periodos: any[] = [];
  periodosSeleccionados: any[] = [];
  anios: number[] = [];
  anioInicio!: number;
  anioFin!: number;
  idMe!: number;
  periodo: any = {};
  idPeriodo!: number;
  cantidadPeriodos = 0;
  isEditing = false;
  isSelecting = false;
  allSelected = false;
  alertHeaderDelete = '';
  dataExisting = false;
  p: any;
  isMultipleDelete = false;
  pageSize = 25;
  numItems = 0; // número de items cargados

  alertButtonsDelete = [
    { text: 'Cancelar', role: 'cancel' },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: async () => {
        if (this.isMultipleDelete) {
          await this.deleteMultiple();
        } else {
          await this.eliminar(this.periodo);
        }
        this.p = null;
      }
    }
  ];

  constructor(
    private storage: Storage,
    private api: ApiService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.generarAnios();
  }

  async ngOnInit() {
    await this.storage.create();
    this.token = await this.storage.get('token');
    this.getPeriodo();
    this.getMe();
  }

  generarAnios() {
    const anioActual = new Date().getFullYear();
    for (let i = anioActual; i <= anioActual + 30; i++) {
      this.anios.push(i);
    }
  }

  async getPeriodo(event?: InfiniteScrollCustomEvent) {
    try {
      const res: any = await this.api.getPeriodos(this.token, this.numItems, this.pageSize);
      const nuevosPeriodos = res.data.data || [];
      this.periodos = [...this.periodos, ...nuevosPeriodos]; // concatena

      this.numItems += this.pageSize;

      const total = res.data.meta.pagination.total;

      if (event) {
        event.target.complete(); // indica que terminó el scroll
        if (this.periodos.length >= total) {
          event.target.disabled = true; // desactiva scroll si no hay más
        }
      }
    } catch (err) {
      console.error(err);
      this.presentToast('Error al cargar periodos.', 'danger');
    }
  }


  async getMe() {
    try {
      const res: any = await this.api.getUserByMe();
      this.idMe = res.data.id;
    } catch (err) {
      console.error(err);
    }
  }

  validarCampos() {
    this.dataExisting = !!this.anioInicio && !!this.anioFin && this.anioFin >= this.anioInicio;
  }

  async save() {
    if (!this.dataExisting) {
      alert('Selecciona un rango válido de años');
      return;
    }

    const data = { ciclo: `${this.anioInicio}-${this.anioFin}`, director: this.idMe };

    try {
      if (this.isEditing) {
        await this.api.updatePeriodo(this.periodo.documentId, data, this.token);
        this.presentToast('Se ha actualizado el periodo de manera exitosa.', 'success');
      } else {
        await this.api.createPeriodos(data, this.token);
        this.presentToast('Se ha creado el periodo de manera exitosa.', 'success');
      }
      this.reset();
    } catch (err) {
      console.error(err);
      this.presentToast('Ha ocurrido un error.', 'danger');
    }
  }

  clickEditing(periodo: any) {
    [this.anioInicio, this.anioFin] = periodo.ciclo.split('-').map(Number);
    this.isEditing = true;
    this.periodo = periodo;
    this.validarCampos();
  }

  async eliminar(periodo: any) {
    try {
      await this.api.deletePeriodo(periodo.documentId, this.token);
      this.presentToast('Se ha eliminado el periodo de manera exitosa.', 'success');
      this.reset();
    } catch (err) {
      console.error(err);
      this.presentToast('Ha ocurrido un error.', 'danger');
    }
  }

  async deleteMultiple() {
    try {
      await Promise.all(
        this.periodosSeleccionados.map(p =>
          this.api.deletePeriodo(p.documentId, this.token)
        )
      );
      this.presentToast(`${this.periodosSeleccionados.length} periodo(s) eliminados.`, 'success');
      this.reset();
    } catch (err) {
      console.error(err);
      this.presentToast('Error al eliminar periodos.', 'danger');
    }
  }

  selectingPeriodos() { this.isSelecting = true; }

  notSelectingPeriodos() {
    this.isSelecting = false;
    this.allSelected = false;
    this.periodosSeleccionados = [];
    this.periodos.forEach(p => p.selected = false);
  }

  toggleSelect(periodo: any) {
    const exists = this.periodosSeleccionados.some(p => p.id === periodo.id);
    this.periodosSeleccionados = exists
      ? this.periodosSeleccionados.filter(p => p.id !== periodo.id)
      : [...this.periodosSeleccionados, periodo];
    periodo.selected = !exists;
    this.allSelected = this.periodos.length === this.periodosSeleccionados.length;
  }

  toggleSelectAll(event: any) {
    const checked = event.detail.checked;
    this.allSelected = checked;
    this.periodos.forEach(p => p.selected = checked);
    this.periodosSeleccionados = checked ? [...this.periodos] : [];
  }

  toggleSelectAllLabel() {
    this.toggleSelectAll({ detail: { checked: !this.allSelected } });
  }

  clickPeriodo(periodo: any) {
    this.toggleSelect(periodo);
  }

  openAlertDelete(periodo: any = null) {
    if (periodo) {
      this.isMultipleDelete = false;
      this.periodo = periodo;
      this.idPeriodo = periodo.documentId;
      this.alertHeaderDelete = `¿Deseas eliminar al periodo ${periodo.ciclo}?`;
      this.p = periodo;
    } else {
      this.isMultipleDelete = true;
      this.cantidadPeriodos = this.periodosSeleccionados.length;
      this.alertHeaderDelete = `¿Deseas eliminar ${this.cantidadPeriodos} periodos?`;
    }
    this.deleteAlert?.present();
  }

  async presentToast(message: string, type: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color: type
    });
    await toast.present();
  }

  cancel() {
    this.isEditing = false;
    this.anioInicio = 0;
    this.anioFin = 0;
    this.dataExisting = false;
  }

  reset() {
    this.isEditing = false;
    this.anioInicio = 0;
    this.anioFin = 0;
    this.dataExisting = false;
    this.periodosSeleccionados = [];
    this.getPeriodo();
  }

  // --- ALIAS DE COMPATIBILIDAD ---
  create() { this.save(); }
  update() { this.save(); }
  selectPeriodos(periodo: any) { this.toggleSelect(periodo); }
}
