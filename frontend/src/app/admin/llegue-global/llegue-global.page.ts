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
    this.llegadas = [];
    this.api.getLLegueGlobal(this.token).then(res =>{
    const data = res.data as any;
    this.llegadas = data.data;
    console.log(this.llegadas);
    }).catch(err=>{
      console.log(err);
    })
  }

}
