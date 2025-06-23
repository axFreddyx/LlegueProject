import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gradoygrupo',
  templateUrl: './gradoygrupo.page.html',
  styleUrls: ['./gradoygrupo.page.scss'],
  standalone:false
})
export class GradoygrupoPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  gradosEjemplo = [
  { nombre: '1°', grupos: ['A', 'B'] },
  { nombre: '2°', grupos: ['A'] },
  { nombre: '3°', grupos: ['A', 'B', 'C'] },
  { nombre: '4°', grupos: ['A', 'B', ] },
  { nombre: '5°', grupos: ['A', 'B', ] },
  { nombre: '6°', grupos: ['A',] },
];


}
