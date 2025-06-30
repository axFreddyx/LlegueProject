import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: false,
})
export class CreatePage implements OnInit {

  constructor(
    private api: ApiService
  ) { }
  // token = "";
  persona_autorizada = {
    nombre: "",
    email: "",
    password: "",
    apellidos: "",
    username: "",
    foto: "",
    role: 'Persona Autorizada'
  }

  nombre = "";
  email = "";
  password = "";
  username = "";


  ngOnInit() {
  }

  previewImg: string | null = null;

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImg = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  crearPersona() {
    this.api.register(this.username, this.email, this.password, this.nombre).then(res => {
      console.log(res);
    }).catch(err => {
      console.error(err);
    });
    
  }




}
