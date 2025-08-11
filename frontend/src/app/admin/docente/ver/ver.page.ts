import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonModal } from '@ionic/angular';
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
    private router: Router
  ) { }

  public alertButtons = [
    {
      text: 'Cancelar',
    
      role: 'cancel',
      handler: () => {
        console.log('Cancelado');
      },
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

  data: any = {
    salon: {},
  }

  ngOnInit() {
    this.getDocentes();
    this.getSalones();
    console.log(this.salon);
  }

  async getDocentes() {
    await this.api.getUsersByRole(4).then((res: any) => {
      console.log(res.data);
      this.docentes = res.data;
    }).catch((err: any) => {
      console.error('Error fetching docentes:', err);
    });
  }

  async asignarSalon() {
    // await this.api.updateUser(this.data, this.idDocente)
    await this.api.updateUser(this.data, this.idDocente).then((res: any) => {
      console.log('Docente updated successfully:', res.data);
      this.modal.dismiss(null, 'confirm');
      this.docentes = [];
      this.getDocentes();
    }).catch((err: any) => {
      console.error('Error updating docente:', err.response?.data || err);
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
    }).catch((err: any) => {
      console.error('Error fetching salones:', err);
    });
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(null, 'confirm');
  }

  openModal(d: any) {
    this.modal.present();
    this.idDocente = d.id;  // d.id debe ser número

    this.docente = d;
    console.log(this.docente);

  }

  openAlert(salon: any) {
    document.querySelector('ion-alert')?.present();

    // Guardamos solo la referencia que Strapi entiende
    this.data = { salon: salon.id };

    this.salon = salon;
    console.log(this.data); // para verificar que solo tenga { salon: id }
  }

  redirectToAddDocente() {
    // Por ejemplo, usando el router de Angular:
    this.router.navigate(['/create/cuenta'], { queryParams: { role: 'docente' } });
  }
}
