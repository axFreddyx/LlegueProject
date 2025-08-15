import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone:false
})
export class PerfilPage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage
  ) { }

  token = "";
  me:any = {};

  async ngOnInit() {
    this.token = await this.storage.get("token")
    this.getMe();
  }

  async getMe(){
    await this.api.getUserByMe().then((res:any) => {
      console.log(res.data);
      this.me = res.data;
    }).catch((err:any) => {
      console.error(err)
    })
  }

  async getFoto(){
    // await this.api.
  }

}
