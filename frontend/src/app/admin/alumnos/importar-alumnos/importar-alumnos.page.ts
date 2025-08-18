// src/app/admin/alumnos/importar-alumnos/importar-alumnos.page.ts
import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import * as XLSX from 'xlsx';
import { ApiService } from 'src/app/services/api.service';
import axios from 'axios';
import { environment } from 'src/environments/environment';

type FilaAlumno = {
  nombre: string;
  apellidos: string;
  grado?: number | string;
  grupo?: string;
  aula?: string;
};

type SalonUI = { id: number; grado: number|null; grupo: string|null; aula?: string; totalAlumnos?: number };

const DEFAULT_FOTO_FILENAME = 'alumno_defecto.jpg';               // como se llamara en strapi
const DEFAULT_FOTO_ASSET_PATH = 'assets/img/alumno_defecto.jpg';  // en ionic
const API_BASE = environment.apiUrl; 

@Component({
  selector: 'app-importar-alumnos',
  templateUrl: './importar-alumnos.page.html',
  styleUrls: ['./importar-alumnos.page.scss'],
  standalone: false
})
export class ImportarAlumnosPage implements OnInit {
  file: File | null = null;
  token = '';
  cargando = false;

  // preview
  filas: FilaAlumno[] = [];
  erroresPreview: string[] = [];

  // salones
  salones: SalonUI[] = [];
  filtroSalon = '';
  get salonesFiltrados(): SalonUI[] {
    const q = this.filtroSalon.trim().toLowerCase();
    const arr = this.salones.slice().sort((a,b) => {
      const ag = a.grado ?? 9999, bg = b.grado ?? 9999;
      if (ag !== bg) return ag - bg;
      const grpA = (a.grupo ?? '').toLowerCase();
      const grpB = (b.grupo ?? '').toLowerCase();
      if (grpA !== grpB) return grpA.localeCompare(grpB);
      return (a.aula ?? '').toLowerCase().localeCompare((b.aula ?? '').toLowerCase());
    });
    if (!q) return arr;
    return arr.filter(s =>
      (s.grado !== null && String(s.grado).includes(q)) ||
      (s.grupo && s.grupo.toLowerCase().includes(q)) ||
      (s.aula && s.aula.toLowerCase().includes(q))
    );
  }

  resumen: { ok: number; fail: number; errores: Array<{ fila:number; motivo:string }> } | null = null;

  defaultFotoId: number | null = null;

  constructor(
    private storage: Storage,
    private api: ApiService,
    private toast: ToastController
  ) {}

  async ngOnInit() {
    this.token = await this.storage.get('token');
    await this.cargarSalones();
    await this.ensureDefaultFotoId(); 
  }

  async cargarSalones() {
    try {
      const res = await this.api.verSalones(this.token);
      const data = (res.data as any).data || [];
      this.salones = data.map((s: any) => {
        const at = s.attributes || s;
        return {
          id: s.id,
          grado: at.grado ?? null,
          grupo: at.grupo ?? null,
          aula: at.aula ?? undefined,
          totalAlumnos: at.alumnos?.data?.length ?? at.totalAlumnos ?? 0
        };
      });
    } catch (e) {
      console.error(e);
      this.presentToast('No se pudieron cargar los salones', 'danger');
    }
  }

  // Busca la imagen por nombre en Media Library; si no existe, la sube desde assets y guarda su id
  private async ensureDefaultFotoId(): Promise<void> {
    try {
      const res = await axios.get(
        `${API_BASE}/upload/files?filters[name][$eq]=${encodeURIComponent(DEFAULT_FOTO_FILENAME)}`,
        { headers: { Authorization: this.token } }
      );
      const found = (res.data as any[])[0];
      if (found?.id) { this.defaultFotoId = Number(found.id); return; }

      const resp = await fetch(DEFAULT_FOTO_ASSET_PATH);
      if (!resp.ok) throw new Error('No se pudo leer la imagen de assets');
      const blob = await resp.blob();
      const file = new File([blob], DEFAULT_FOTO_FILENAME, { type: blob.type || 'image/png' });

      const uploaded = await this.api.uploadFile(file, this.token);
      this.defaultFotoId = Number(uploaded.id);
    } catch (e) {
      console.error('Error asegurando foto por defecto:', e);
      this.defaultFotoId = null;
      this.presentToast(
        `No se pudo preparar la foto por defecto (${DEFAULT_FOTO_FILENAME}).`,
        'warning'
      );
    }
  }

  onFileChange(ev: any) {
    const f = ev?.target?.files?.[0];
    this.file = f || null;
    this.filas = [];
    this.erroresPreview = [];
    this.resumen = null;
    if (this.file) this.leerArchivo(this.file);
  }

  private leerArchivo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result as ArrayBuffer), { type: 'array' });
        const sheet = wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' }) as any[];

        const errs: string[] = [];
        const parsed: FilaAlumno[] = rows.map((r, idx) => {
          const rowNum = idx + 2; 
          if (r.nombre === undefined || r.apellidos === undefined) {
            errs.push(`Fila ${rowNum}: faltan columnas "nombre" o "apellidos".`);
          }
          return {
            nombre: String(r.nombre || '').trim(),
            apellidos: String(r.apellidos || '').trim(),
            grado: r.grado === '' ? undefined : r.grado,
            grupo: String(r.grupo || '').trim(),
            aula: String(r.aula || '').trim(),
          };
        });

        this.filas = parsed;
        this.erroresPreview = errs;
      } catch (e) {
        console.error(e);
        this.presentToast('Error leyendo el archivo. Revisa el formato.', 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private resolverSalonId(f: FilaAlumno): number | null {
    // 1) Prioriza grado+grupo
    if (f.grado !== undefined && f.grupo) {
      const m = this.salones.find(s =>
        s.grado !== null &&
        Number(s.grado) === Number(f.grado) &&
        (s.grupo ?? '').toLowerCase() === String(f.grupo).toLowerCase()
      );
      if (m) return m.id;
    }
    // 2) Intenta por aula
    if (f.aula) {
      const m = this.salones.find(s =>
        (s.aula || '').toLowerCase() === String(f.aula).toLowerCase()
      );
      if (m) return m.id;
    }
    return null; 
  }

  async importar() {
    if (!this.filas.length) {
      return this.presentToast('No hay filas para importar.', 'warning');
    }
    if (this.erroresPreview.length) {
      return this.presentToast('Corrige los errores del preview antes de importar.', 'warning');
    }

    if (!this.defaultFotoId) {
      return this.presentToast(
        `No hay imagen por defecto disponible (${DEFAULT_FOTO_FILENAME}).`,
        'warning'
      );
    }

    this.cargando = true;
    this.resumen = { ok: 0, fail: 0, errores: [] };

    const chunkSize = 20;
    const chunks: FilaAlumno[][] = [];
    for (let i = 0; i < this.filas.length; i += chunkSize) {
      chunks.push(this.filas.slice(i, i + chunkSize));
    }

    try {
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (f) => {
            const filaExcel = this.filas.indexOf(f) + 2;
            try {
              if (!f.nombre || !f.apellidos) {
                this.resumen!.fail++;
                this.resumen!.errores.push({ fila: filaExcel, motivo: 'Nombre y apellidos son obligatorios.' });
                return;
              }

              const salonId = this.resolverSalonId(f);

              // ✅ Foto por defecto incluida en el payload
              await this.api.createAlumno({
                nombre: f.nombre,
                apellidos: f.apellidos,
                foto: this.defaultFotoId,                 // <-- aquí
                ...(salonId ? { salon: salonId } : {})
              }, this.token);

              this.resumen!.ok++;
            } catch (e: any) {
              console.error(e);
              const motivo = e?.response?.data?.error?.message || 'Error al crear el alumno';
              this.resumen!.fail++;
              this.resumen!.errores.push({ fila: filaExcel, motivo });
            }
          })
        );
      }

      this.presentToast(`Importación finalizada: OK ${this.resumen.ok}, Errores ${this.resumen.fail}`, 'success');
    } finally {
      this.cargando = false;
    }
  }

  private async presentToast(message: string, color: 'success'|'danger'|'warning' = 'danger') {
    const t = await this.toast.create({ message, duration: 2200, position: 'top', color });
    await t.present();
  }
}
