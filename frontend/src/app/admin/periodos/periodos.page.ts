import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-periodos',
  templateUrl: './periodos.page.html',
  styleUrls: ['./periodos.page.scss'],
  standalone: false
})
export class PeriodosPage implements OnInit {

  constructor(
    private storage: Storage,
    private api: ApiService,
    private router: Router,
  ) { }

  token = ""
  periodos: any[] = []


  async ngOnInit() {
    await this.storage.create();
    this.token = await this.storage.get('token');

    this.getPeriodo();

  }


  async getPeriodo() {
    this.periodos = [];
    this.api.getPeriodos(this.token).then(res => {
      const data = res.data as any;
      this.periodos = data.data;
      console.log(this.periodos)
    }).catch(err => {
      console.log(err);
    })
  }

  //   async getLlegadas(){
  //   this.llegadas = [];
  //   this.api.getLLegueGlobal(this.token).then(res =>{
  //   const data = res.data as any;
  //   this.llegadas = data.data;
  //   console.log(this.llegadas);
  //   }).catch(err=>{
  //     console.log(err);
  //   })
  // }

}
