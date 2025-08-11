import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';

interface Salon {
  aula: string;
  grado: number;
  grupo: string;
}

@Component({
  selector: 'app-gradoygrupo',
  templateUrl: './gradoygrupo.page.html',
  styleUrls: ['./gradoygrupo.page.scss'],
  standalone: false
})
export class GradoygrupoPage implements OnInit {

  token = "";
  salones: Salon[] = [];
  isEditing = false;
  idSalon: string = "";
  dataExisting: boolean = false;
  salonSelected:any;

  public alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',

    },
    {
      text: 'Eliminar',
      role: 'confirm',
      handler: () => {
        if (this.salonSelected) {
          this.delete(this.salonSelected);
          this.salonSelected = null; // Reset after deletion
        }
      }
    },
  ];

  constructor(
    private storage: Storage,
    private api: ApiService,
    private router: Router,
  ) { }

  data: any = {
    grado: 0,
    grupo: ''.toUpperCase(),
    aula: '' // Quiero que cuando se ingrese el aula empieze desde el 0 cuando sean numeros de 1 digito (1 al 9)
  }

  async ngOnInit() {
    await this.storage.create();
    this.token = await this.storage.get('token');
    await this.getSalones();
  }

  formatAula(event: any) {
    let value = event.detail.value || '';

    // Quitamos ceros iniciales antes de procesar
    value = value.replace(/^0+/, '');

    // Si es un número de 1 dígito, agregamos el 0 delante
    if (/^\d$/.test(value)) {
      this.data.aula = '0' + value;
    } else {
      this.data.aula = value;
    }
  }

  async getSalones() {
    this.salones = [];
    try {
      const res = await this.api.verSalones(this.token);
      const data = (res.data as any).data as Salon[];
      this.salones = data.sort((a: Salon, b: Salon) => {
        return a.grado !== b.grado
          ? a.grado - b.grado
          : a.grupo.toLowerCase().localeCompare(b.grupo.toLowerCase());
      });
      console.log(this.salones);
    } catch (error) {
      console.error('Error cargando salones:', error);
    }
  }

  selectEditar(salon: any) {
    this.data = {
      grado: salon.grado,
      grupo: salon.grupo,
      aula: salon.aula
    };
    this.isEditing = true;
    this.idSalon = salon.documentId;
  }

  async create() {
    await this.api.createSalon(this.data, this.token).then(() => {
      this.getSalones();
      this.cancel();
    }).catch(error => {
      console.error('Error creating salon:', error);
    });
  }

  async update() {
    await this.api.updateSalon(this.idSalon, this.data, this.token).then(() => {
      this.getSalones();
      this.cancel();
    }).catch(error => {
      console.error('Error updating salon:', error);
    });
  }

  async delete(salon: any) {
    await this.api.deleteSalon(salon.documentId, this.token).then(() => {
      this.salones = [];
      this.getSalones();
    }).catch(error => {
      console.error('Error deleting salon:', error);
    });
  }

  cancel() {
    this.data = {
      grado: 0,
      grupo: '',
      aula: ''
    };
    this.isEditing = false;
  }

  change(event: any) {
    this.dataExisting = event.target.value.trim() !== '';
  }

  openAlert(salon: any) {
    this.salonSelected = salon;
    const alert = document.querySelector('ion-alert');
    if (alert) {
      alert.present();
    }
  }

}
