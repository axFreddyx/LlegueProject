import { Component, OnInit } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false
})
export class VerPage implements OnInit {

  isModalOpen = false;
  personas: any[] = [];

  constructor(private api: ApiService) { }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.isModalOpen = false;
  }

async ngOnInit() {
  try {
    const response: any = await this.api.getPersonasAutorizadas();

    if (response?.data) {
      this.personas = response.data;
      console.log('Personas autorizadas:', this.personas);
    } else {
      console.warn('No se encontró .data en la respuesta:', response);
    }

  } catch (error) {
    console.error('Error al obtener personas autorizadas:', error);
  }
}

}

