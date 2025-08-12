import { Component, OnInit, ViewChild } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonAlert, ToastController } from '@ionic/angular';
import { IonModal } from '@ionic/angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-admin',
  templateUrl: './users-admin.page.html',
  styleUrls: ['./users-admin.page.scss'],
  standalone: false
})


export class UsersAdminPage implements OnInit {

  @ViewChild('modal') modal!: IonModal;
  @ViewChild('deleteAlert') deleteAlert?: IonAlert;

  isModalOpen = false;
  admins: any[] = [];

  admin: any = [];
  token = "";
  idAdmin!: number;
  cantidadAdmins = 0;

  filteredSalones: any[] = [];
  searchTerm: string = ''; // Para salón
  alumnoSearchTerm: string = '';
  alumnoSeleccionado: any = null;

  adminsSeleccionados: any[] = [];  // Selected section

  isSelecting = false; // Selected section
  allSelected = false; // Selected section

  alertHeaderDelete = "";
  alertButtonsDelete = [
    { text: 'Cancelar', role: 'cancel' },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: () => {
        if (this.admin) {
          this.eliminar(this.admin);
          this.admin = null;
        } else if (this.adminsSeleccionados.length > 0) {
          this.eliminarSeleccionados();
        }
      }
    }
  ];

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController,
    private router: Router
  ) { }

  setOpen(isOpen: boolean, admin: [] = []) {
    this.isModalOpen = isOpen;
    this.admin = admin;
    console.log('Admin seleccionado:', this.admin);
  }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.isModalOpen = false;
  }

  async ngOnInit() {
    this.token = await this.storage.get("token");
    this.getAdmins();
  }

  async getAdmins() {
    await this.api.getUsersByRole(5).then((res: any) => { // rol admin = 1
      if (res?.data) {
        this.admins = res.data;

        console.log('Administradores:', this.admins);

        this.admins.forEach((admin: any) => {
          if (admin.alumnos && Array.isArray(admin.alumnos)) {
            admin.alumnos = admin.alumnos.filter((alumno: any) => alumno?.publishedAt != null);
          } else {
            admin.alumnos = [];
          }
        });
      } else {
        console.warn('No se encontró .data en la respuesta:', res);
      }
    }).catch((err: any) => {
      console.error('Error al obtener administradores:', err);
      this.admins = [];
    });
  }

  async eliminarSeleccionados() {
    await Promise.all(this.adminsSeleccionados.map(a =>
      this.api.deleteUser(a.id)
        .then(() => this.admins = this.admins.filter(admin => admin.id !== a.id))
        .catch(err => {
          console.error('Error eliminando admin:', err);
          this.presentToast(`No se pudo eliminar a ${a.nombre}.`, 'error');
        })
    ));
    this.presentToast(`${this.adminsSeleccionados.length} administrador(es) eliminados.`, 'success');
    this.notSelectingAdmins();
  }

  private async presentToast(message: string, type: 'success' | 'error' = 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
  }

  selectingAdmins() {
    this.isSelecting = true;
  }

  selectAdmins(admin: any) {
    const exists = this.adminsSeleccionados.some(a => a.id === admin.id);
    this.adminsSeleccionados = exists
      ? this.adminsSeleccionados.filter(a => a.id !== admin.id)
      : [...this.adminsSeleccionados, admin];
    admin.selected = !exists;
    this.allSelected = this.admins.length === this.adminsSeleccionados.length;
  }

  notSelectingAdmins() {
    this.isSelecting = false;
    this.allSelected = false;
    this.adminsSeleccionados = [];
    this.admins.forEach(a => a.selected = false);
  }

  toggleSelectAll(event: any) {
    const checked = event.detail.checked;
    this.allSelected = checked;
    this.admins.forEach(a => a.selected = checked);
    this.adminsSeleccionados = checked ? [...this.admins] : [];
  }

  toggleSelectAllLabel() {
    this.allSelected = !this.allSelected;
    this.toggleSelectAll({ detail: { checked: this.allSelected } });
  }

  openAlertDelete(admin: any = null) {
    this.alertHeaderDelete = admin ?
      `¿Eliminar a ${admin.nombre}?` :
      `¿Eliminar ${this.adminsSeleccionados.length} administradores seleccionados?`;

    this.admin = admin;

    this.deleteAlert?.present();
  }

  redirect() {
    this.router.navigate(['/create/cuenta'], { queryParams: { role: 'admin' } });
  }

  redirectToEditAdmin(admin: any) {
    this.router.navigate([`/editar/cuenta/${admin.id}`], { queryParams: { role: 'admin' } });
  }

  openModalVarios() {
    this.modal.present();
  }

  clickAdmin(admin: any) {
    this.selectAdmins(admin);
  }

  openModal(admin: any) {
    this.admin = admin;
    this.idAdmin = admin.documentId;
    this.modal.present();
  }

  cancel() {
    this.modal.dismiss();
    this.admin = null;
  }

  async eliminar(admin: any) {
    try {
      await this.api.deleteUser(admin.id);
      this.admins = this.admins.filter(a => a.id !== admin.id);
      this.presentToast(`Administrador ${admin.nombre} eliminado.`, 'success');
    } catch (err) {
      console.error('Error eliminando admin:', err);
      this.presentToast('No se pudo eliminar el administrador.', 'error');
    }
  }
}
