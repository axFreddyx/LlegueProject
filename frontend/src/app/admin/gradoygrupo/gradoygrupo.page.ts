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

  constructor(
    private storage: Storage,
    private api: ApiService,
    private router: Router,
  ) { }

  async ngOnInit() {
    await this.storage.create();
    this.token = await this.storage.get('token');
    await this.getSalones();
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
}
