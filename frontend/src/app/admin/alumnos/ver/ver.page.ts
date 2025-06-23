import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false
})
export class VerPage implements OnInit {

  constructor(
    private api: ApiService,
  ) { }

  ngOnInit() {
    this.getAlumnos();
  }

  alumnos: any[] = [];

  getAlumnos() {
    this.api.getAlumnos().subscribe(
      (res: any) => {
      this.alumnos = res.data;
    },
      (err: any) => {
        console.error(err);
      });
  }

}
