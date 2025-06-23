import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class HeaderComponent  implements OnInit {

  constructor(
    private storage: Storage,
    private router: Router
  ){
    
  }

  ngOnInit() {}

   logout(){
    console.log("has cerrado sesion")
    setTimeout(() => {
      this.router.navigateByUrl("/login");
    }, 3000)
    this.storage.remove("token")
  }

}
