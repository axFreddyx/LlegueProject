import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: false,
})
export class CreatePage implements OnInit {

  constructor(
    private api: ApiService,
    private storage: Storage
  ) { }
  // token = "";
  user = {
    nombre: "",
    email: "",
    password: "",
    apellidos: "",
    username: "",
    role: 0, 
    confirmed: true, 
    blocked: false
  }
  roles: any[] = [];
  token: any;

  ngOnInit() {
    // this.token = this.storage.get('token');
    this.getRoles();
    
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

  async crearPersona() {
    const token = await this.storage.get('token');

    this.api.register(this.user, token).then(res => {
      console.log(res);
    }).catch(err => {
      console.error(err);
    });
    
  }

  async getRoles() {
    const token = await this.storage.get('token');
    await this.api.getRoles(token).then((res:any) => {
      const roles = res.data.roles;
      roles.forEach((role: any) => {
        if (role.type !== 'public' && role.type !== 'authenticated') {
          this.roles.push(role)
        }
      });
      console.log(this.roles);
    }).catch(err => {
      console.error(err);
    });
  }
}
