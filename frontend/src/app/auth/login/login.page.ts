import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';
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
    private toastController: ToastController
  ) { }


  token_push = '';


  identifier = '';
  password = '';
  token = ""

  async ngOnInit() {
    this.db.create();
    this.token = await this.db.get("token");




    console.log('Initializing HomePage');

    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration',
      (token: Token) => {
        alert('Push registration success, token: ' + token.value);
        this.token_push = token.value;
      }
    );

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
        alert('Error on registration: ' + JSON.stringify(error));
      }
    );

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        alert('Push received: ' + JSON.stringify(notification));

      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        alert('Push action performed: ' + JSON.stringify(notification));
      }
    );

  }

  async presentToast(message: string, type: 'success' | 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
  }

  async login() {
    const data = {
      identifier: this.identifier,
      password: this.password
    };

    await this.api.login(data).then(async (data: any) => {
      console.log("Login correcto:", data);

      await this.db.set('token', `Bearer ${data.jwt}`);

      await this.api.getUserByMe().then((userWithRole: any) => {
        const rol = userWithRole?.data?.role?.type;

        switch (rol) {
          case 'admin':
            this.router.navigateByUrl('/home');
            break;
          case 'docente':
            this.router.navigateByUrl('/alumnos');
            break;
          case 'persona_autorizada':
            this.router.navigateByUrl('/llegue');
            break;
          default:
            this.router.navigateByUrl('/login');
            break;
        }
      });

      this.presentToast('Inicio de sesión exitoso', 'success');

    }).catch((error: any) => {
      console.error("Error en login:", error);
      this.presentToast('Ocurrió un error al iniciar sesión', 'error');
    });
  }
}
