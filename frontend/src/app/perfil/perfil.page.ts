// perfil.page.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Storage } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {
  token = '';
  me: any = {};

  constructor(
    private api: ApiService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    this.token = await this.storage.get('token');
    await this.getMe();
  }

  async getMe() {
    try {
      const res: any = await this.api.getUserByMe();
      this.me = res.data;
      console.log('ME =>', this.me);
    } catch (err) {
      console.error(err);
    }
  }

  get fotoUrl(): string {
    const media = this.me?.foto;
    const urlRelativa =
      Array.isArray(media) ? media?.[0]?.url : media?.url;

    if (!urlRelativa) {
      return 'assets/img/alumno_defecto.jpg'; 
    }

    // environment.apiUrl = 'http://localhost:1337/api' -> necesitamos el host sin '/api'
    const host = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${host}${urlRelativa}`;
  }
}
