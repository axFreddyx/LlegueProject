import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: false,
})
export class ResetPasswordPage {
  code: string = '';
  password: string = '';
  passwordConfirmation: string = '';

  constructor( private toastCtrl: ToastController, private api:ApiService) {}

  async resetPassword() {
    try {
      await this.api.resetPassword(this.code, this.password, this.passwordConfirmation);
      const toast = await this.toastCtrl.create({
        message: 'Contraseña restablecida correctamente',
        duration: 3000,
        color: 'success',
      });
      toast.present();

      // Opcional: redirigir al login
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: 'Error al restablecer la contraseña',
        duration: 3000,
        color: 'danger',
      });
      toast.present();
    }
  }
}
