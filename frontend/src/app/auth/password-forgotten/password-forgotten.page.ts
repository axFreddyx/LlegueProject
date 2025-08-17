// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-password-forgotten',
//   templateUrl: './password-forgotten.page.html',
//   styleUrls: ['./password-forgotten.page.scss'],
//   standalone: false
// })
// export class PasswordForgottenPage implements OnInit {

//   constructor() { }

//   ngOnInit() {
//   }

// }
import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-password-forgotten',
  templateUrl: './password-forgotten.page.html',
  styleUrls: ['./password-forgotten.page.scss'],
  standalone: false
})
export class PasswordForgottenPage implements OnInit {
  email: string = '';

  ngOnInit() {
  }

  constructor(private api: ApiService, private toastController: ToastController) { }

  async enviarCorreo() {
    if (!this.email || !this.validarEmail(this.email)) {
      const toast = await this.toastController.create({
        message: 'Por favor ingresa un correo válido',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    try {
      // Llamada a tu API que envía el correo
      await this.api.recuperarPassword(this.email); // <-- Implementa esta función en tu ApiService
      const toast = await this.toastController.create({
        message: 'Se ha enviado un enlace a tu correo',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error(error);
      const toast = await this.toastController.create({
        message: 'Ocurrió un error al enviar el correo',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
