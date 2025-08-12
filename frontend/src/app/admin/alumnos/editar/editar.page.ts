import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/services/api.service';
import { ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.page.html',
  styleUrls: ['./editar.page.scss'],
  standalone: false
})
export class EditarPage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  previewImg: string | null = null;
  fotoFile: File | null = null;

  token = '';
  idAlumno = '';           // documentId que viene en la ruta
  alumno: any = null;      // ← inicia en null para evitar lecturas tempranas

  data = { nombre: '', apellidos: '' };

  // Base de archivos (http://localhost:1337) derivada de apiUrl
  private readonly assetsBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.token = await this.storage.get('token');
    this.idAlumno = this.route.snapshot.paramMap.get('id') || '';
    if (!this.idAlumno) {
      this.presentToast('No se encontró el ID del alumno en la ruta.', 'error');
      return;
    }
    await this.getAlumno();
  }

  async getAlumno() {
    try {
      const res: any = await this.api.getAlumno(this.idAlumno, this.token);
      const item = res?.data?.data;
      if (!item) {
        this.presentToast('No se encontró el alumno.', 'error');
        return;
      }

      // Normaliza la forma v4/v5
      const attrs = item.attributes ?? item;
      this.alumno = {
        id: item.id ?? attrs.id,
        documentId: item.documentId ?? attrs.documentId,
        nombre: attrs?.nombre ?? '',
        apellidos: attrs?.apellidos ?? '',
        foto: attrs?.foto ?? null
      };

      this.data = {
        nombre: this.alumno.nombre,
        apellidos: this.alumno.apellidos
      };

      // Vista previa con la foto actual (si existe)
      this.previewImg = null;
      // console.log('Alumno cargado:', this.alumno);
    } catch (err: any) {
      console.error('Error fetching alumno:', err?.response?.data || err);
      this.presentToast('No se pudo obtener la información del alumno.', 'error');
    }
  }

  onFileChange(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;
    this.fotoFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewImg = reader.result as string);
    reader.readAsDataURL(file);
  }

  async update() {
    try {
      const payload: any = { ...this.data };

      // Si seleccionaste una nueva foto, súbela y vincúlala
      if (this.fotoFile) {
        const uploaded = await this.api.uploadFile(this.fotoFile, this.token);
        payload.foto = uploaded.id; // single media
      }

      await this.api.updateAlumno(this.idAlumno, payload, this.token);

      this.presentToast('El alumno se ha actualizado correctamente.', 'success');

      // Limpia selección/preview por si el usuario regresa
      this.fotoFile = null;
      if (this.fileInput) this.fileInput.nativeElement.value = '';
      this.previewImg = null;

     await this.router.navigate(['/ver/alumnos'], {
        replaceUrl: true,
        state: {
          toast: { message: 'Alumno actualizado correctamente.', type: 'success' }
        }
      });
    } catch (err: any) {
      console.error('Error updating alumno:', err?.response?.data || err);
      this.presentToast('Ocurrió un error al actualizar el alumno.', 'error');
    }
  }

  getFotoUrl(a: any): string | null {
    try {
      const f = a?.foto ?? a?.attributes?.foto;
      if (!f) return null;
      const node = f?.data?.attributes ?? f?.attributes ?? f;
      if (!node) return null;
      const url: string | undefined = node?.formats?.thumbnail?.url || node?.url;
      if (!url) return null;
      return url.startsWith('http') ? url : `${this.assetsBase}${url}`;
    } catch {
      return null;
    }
  }

  reset() {
    this.data = { nombre: '', apellidos: '' };
    this.previewImg = null;
    this.fotoFile = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private async presentToast(message: string, type: 'success' | 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
  }
}
