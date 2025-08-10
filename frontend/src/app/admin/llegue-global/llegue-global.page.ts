import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-llegue-global',
  templateUrl: './llegue-global.page.html',
  styleUrls: ['./llegue-global.page.scss'],
  standalone: false
})
export class LlegueGlobalPage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage
  ) { }

  llegadas: any[] = [];
  token = "";

  async ngOnInit() {
    this.storage.create();
    this.token = await this.storage.get('token');
    this.getLlegadas();
  }


  async getLlegadas(){
    this.api.getLLegueGlobal(this.token).then(res =>{
      console.log(res.data as any);
      this.llegadas = (res.data as any).data;
    }).catch(err=>{
      console.log(err);
    })
  }

}
