import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonModal, ToastController } from '@ionic/angular'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false,
})
export class VerPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal; 

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router,
    private toastController: ToastController 
  ) { }

  public alertButtons = [
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

  docentes: any[] = [];
  salones: any[] = [];

  docente: any;
  salon: any;

  idDocente!: number;

  data: any = { salon: {} };

  ngOnInit() {
    this.getDocentes();
    this.getSalones();
    console.log(this.salon);
  }

  // helper toast 
  private async presentToast(
    message: string,
    color: 'danger' | 'warning' | 'success' = 'danger',
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

  async getDocentes() {
    await this.api.getUsersByRole(4).then((res: any) => {
      console.log(res.data);
      this.docentes = res.data;
    }).catch((err: any) => {
      console.error('Error fetching docentes:', err);
      this.presentToast('Error al cargar docentes.', 'danger'); 
    });
  }

  async asignarSalon() {
    await this.api.updateUser(this.data, this.idDocente).then((res: any) => {
      console.log('Docente updated successfully:', res.data);
      this.modal.dismiss(null, 'confirm');
      this.docentes = [];
      this.getDocentes();
      this.presentToast('Salón asignado correctamente.', 'success');
    }).catch((err: any) => {
      console.error('Error updating docente:', err?.response?.data || err);
      this.presentToast('No se pudo asignar el salón.', 'danger'); 
    });
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

      console.log(this.salones);

      // avisar si no hay salones disponibles:
      // if (this.salones.length === 0) this.presentToast('No hay salones disponibles.', 'warning');
    }).catch((err: any) => {
      console.error('Error fetching salones:', err);
      this.presentToast('Error al cargar salones.', 'danger'); 
    });
  }

  cancel() { this.modal.dismiss(null, 'cancel'); }
  confirm() { this.modal.dismiss(null, 'confirm'); }

  openModal(d: any) {
    this.modal.present();
    this.idDocente = d.id;  // d.id debe ser número
    this.docente = d;
    console.log(this.docente);
  }

  openAlert(salon: any) {
    document.querySelector('ion-alert')?.present();
    this.data = { salon: salon.id }; // referencia para Strapi
    this.salon = salon;
    console.log(this.data);
  }

  redirectToAddDocente() {
    this.router.navigate(['/create/cuenta'], { queryParams: { role: 'docente' } });
  }
}
