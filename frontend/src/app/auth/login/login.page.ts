import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { Platform, ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  constructor(
    private api: ApiService,
    private router: Router,
    private db: Storage,
    private toastController: ToastController,
    private platform: Platform
  ) { }

  token_push = '';

  identifier = '';
  password = '';
  token = ""

  async ngOnInit() {
    this.db.create();
    this.token = await this.db.get("token");

    console.log('Initializing HomePage');



    if (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') {

      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        } else {
        }
      });

      PushNotifications.addListener('registration',
        (token: Token) => {
          this.token_push = token.value;
        }
      );

      PushNotifications.addListener('registrationError',
        (error: any) => {
          this.presentToast('Ha ocurrido un error, intentalo mas tarde.', 'error');
        }
      );

      PushNotifications.addListener('pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          this.presentToast(JSON.stringify(notification.title) + JSON.stringify(notification.body), 'success');
        }
      );

      PushNotifications.addListener('pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          alert('Push action performed: ' + JSON.stringify(notification));
        }
      );

    } else {
      console.log('Push notifications solo disponibles en móviles');
    }

  }

  async presentToast(message: string, type: 'success' | 'error' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color: type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'danger'
    });
    await toast.present();
  }

  async login() {
    const data = { identifier: this.identifier, password: this.password };

    try {
      const res: any = await this.api.login(data);
      await this.db.set('token', `Bearer ${res.jwt}`);

      // Intentamos guardar el token_push en la DB
      if (this.token_push) {
        try {
          await this.api.gestionarToken(res.user.id, this.token_push, res.jwt);
          this.presentToast('✅ token_push guardado correctamente', 'success');
          console.log('token_push actualizado en backend');
        } catch (err) {
          console.error('No se pudo registrar push token:', err);
          this.presentToast('❌ Error guardando token_push: ' + JSON.stringify(err), 'warning');
        }
      } else {
        this.presentToast('⚠️ No se encontró token_push para registrar', 'warning');
      }

      // Ahora obtenemos info del usuario logueado
      const userWithRole: any = await this.api.getUserByMe();
      const rol = userWithRole?.data?.role?.type;
      switch (rol) {
        case 'admin': this.router.navigateByUrl('/home'); break;
        case 'docente': this.router.navigateByUrl('/alumnos'); break;
        case 'persona_autorizada': this.router.navigateByUrl('/llegue'); break;
        default: this.router.navigateByUrl('/login'); break;
      }

      this.presentToast('Inicio de sesión exitoso', 'success');
    } catch (error) {
      console.error('Error en login:', error);
      this.presentToast('Ocurrió un error al iniciar sesión', 'warning');
    }
  }



}
