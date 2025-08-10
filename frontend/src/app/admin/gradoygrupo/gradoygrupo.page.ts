import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';


@Component({
  selector: 'app-gradoygrupo',
  templateUrl: './gradoygrupo.page.html',
  styleUrls: ['./gradoygrupo.page.scss'],
  standalone: false
})
export class GradoygrupoPage implements OnInit {

  constructor(
    private storage: Storage,
    private api: ApiService,
    private router: Router,

  ) { }
  token = "";

  salones: any = [] = [];

  async ngOnInit() {
    this.storage.create();
    this.token = await this.storage.get('token');

    this.getSalones();
  }



  async getSalones() {
    this.salones = [];
    this.api.verSalones(this.token).then(res => {
      const data = (res.data as any).data;  // cast a any para evitar error
      this.salones = data;
      console.log(this.salones);
    });
  }



}
