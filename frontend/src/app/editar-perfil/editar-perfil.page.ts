// src/app/pages/editar-perfil/editar-perfil.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';

type UserMe = {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  foto?: { url: string; id: number } | null;
};

@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.page.html',
  styleUrls: ['./editar-perfil.page.scss'],
  standalone: false,
})
export class EditarPerfilPage implements OnInit {

  form = {
    nombre: '',
    apellidos: '',
    username: '',
    email: ''
  };

  me: UserMe | null = null;
  token: string = '';
  loading = false;

  // Foto
  nuevaFotoFile: File | null = null;
  fotoPreviewUrl: string = 'assets/img/user.png';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: Storage,
    private api: ApiService,
    private toast: ToastController,
  ) { }

  async ngOnInit() {
    await this.storage.create();
    this.token = (await this.storage.get('token')) || '';
    await this.cargarMiPerfil();
  }

  private toAbsoluteUrl(path?: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const host = environment.apiUrl?.replace(/\/api\/?$/, '') || '';
    return `${host}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private async cargarMiPerfil() {
    try {
      this.loading = true;
      const res: any = await this.api.getUserByMe();
      const data = res?.data as UserMe;
      this.me = data;

      this.form.nombre = data?.nombre || '';
      this.form.apellidos = data?.apellidos || '';
      this.form.username = data?.username || '';
      this.form.email = data?.email || '';

      if (this.nuevaFotoFile) {
        const formData = new FormData();
        formData.append('files', this.nuevaFotoFile); // 👈 nombre debe coincidir con el que espera tu backend

        const uploaded = await this.api.subirArchivos(formData);
        // si el backend responde un arreglo de archivos, tomamos el primero
        let fotoId: number | undefined;
        if (uploaded && uploaded.length > 0) {
          fotoId = uploaded[0].id;
        }
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      this.presentToast('No se pudo cargar tu perfil.', 'danger');
    } finally {
      this.loading = false;
    }
  }

  onFotoChange(ev: any) {
    const file: File | undefined = ev?.target?.files?.[0];
    if (!file) return;
    this.nuevaFotoFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreviewUrl = String(reader.result || 'assets/img/user.png');
    };
    reader.readAsDataURL(file);
  }



  async guardarCambios() {
    if (!this.me?.id) {
      this.presentToast('Usuario no identificado.', 'danger');
      return;
    }

    try {
      this.loading = true;

      // 1) Subir foto si corresponde
      let fotoId: number | undefined;
      if (this.nuevaFotoFile) {
        const uploaded = await this.api.uploadFile(this.nuevaFotoFile, this.token);
        fotoId = uploaded?.id;
      }

      // 2) Armar payload
      const payload: any = {
        nombre: this.form.nombre?.trim(),
        apellidos: this.form.apellidos?.trim(),
        username: this.form.username?.trim(),
        email: this.form.email?.trim(),
      };
      if (fotoId) payload.foto = fotoId;

      // 3) Actualizar
      await this.api.updateUser(payload, this.me.id);

      this.presentToast('Perfil actualizado.', 'success');
      await this.cargarMiPerfil();
      this.nuevaFotoFile = null;
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      const msg = err?.response?.data?.error?.message || 'No se pudo actualizar el perfil.';
      this.presentToast(msg, 'danger', 4000);
    } finally {
      this.loading = false;
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success', duration = 2500) {
    const t = await this.toast.create({ message, color, duration });
    t.present();
  }
}
