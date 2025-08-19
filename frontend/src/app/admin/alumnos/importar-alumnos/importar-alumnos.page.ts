// src/app/admin/alumnos/importar-alumnos/importar-alumnos.page.ts

import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import * as XLSX from 'xlsx';
import { ApiService } from 'src/app/services/api.service';
import axios from 'axios';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type FilaAlumno = {
  nombre: string;
  apellidos: string;
  salon_documentId?: string;
};

type SalonUI = {
  id: number;
  documentId: string;
  grado: number | null;
  grupo: string | null;
  aula?: string;
  totalAlumnos?: number;
};

const DEFAULT_FOTO_FILENAME = 'alumno_defecto.jpg';
// posibles rutas en Ionic (principal + fallback)
const DEFAULT_FOTO_ASSET_PATHS = [
  'assets/img/alumno_defecto.jpg',
  'assets/alumno_defecto.jpg'
];
const API_BASE = environment.apiUrl;

@Component({
  selector: 'app-importar-alumnos',
  templateUrl: './importar-alumnos.page.html',
  styleUrls: ['./importar-alumnos.page.scss'],
  standalone: false
})
export class ImportarAlumnosPage implements OnInit {
  // Tabs
  selectedTab: 'plantilla' | 'salones' | 'importar' = 'plantilla';

  // Estado general
  file: File | null = null;
  token = '';
  cargando = false;

  // Preview
  filas: FilaAlumno[] = [];
  erroresPreview: string[] = [];
  resumen: { ok: number; fail: number; errores: Array<{ fila: number; motivo: string }> } | null = null;

  // Salones
  salones: SalonUI[] = [];
  filtroSalon = '';
  private salonDocSet: Set<string> = new Set();   // para validar rápido en preview

  // Media por defecto
  defaultFotoId: number | null = null;

  constructor(
    private storage: Storage,
    private api: ApiService,
    private toast: ToastController,
    private http: HttpClient
  ) {}

  // ==========================
  // Helpers locales (sin tocar api.service.ts)
  // ==========================
  private withBearer(t: string): string {
    return t?.startsWith('Bearer ') ? t : `Bearer ${t}`;
  }

  /** Sube un archivo al plugin Upload sin pasar por api.service.ts */
  private async uploadFileLocal(file: File) {
    const form = new FormData();
    form.append('files', file);
    const res = await axios.post(`${API_BASE}/upload`, form, {
      headers: { Authorization: this.withBearer(this.token) }
    });
    return (res.data as any[])[0]; // { id, name, url, ... }
  }

  /** Crea Alumno garantizando 'foto' por id; si 400, reintenta con {id} */
  private async createAlumnoConFotoLocal(data: any, fotoId: number) {
    const headers = { Authorization: this.withBearer(this.token) };
    try {
      return await axios.post(`${API_BASE}/alumnos`, { data: { ...data, foto: fotoId } }, { headers });
    } catch (e: any) {
      if (e?.response?.status === 400) {
        // Fallback para validaciones estrictas
        return await axios.post(`${API_BASE}/alumnos`, { data: { ...data, foto: { id: fotoId } } }, { headers });
      }
      throw e;
    }
  }

  // ==========================

  async ngOnInit() {
    this.token = await this.storage.get('token');
    await this.cargarSalones();
    await this.ensureDefaultFotoId();
  }

  // ===== Salones =====
  async cargarSalones() {
    try {
      const res = await this.api.verSalones(this.token); // GET /salons
      const data = (res.data as any).data || [];
      this.salones = data.map((s: any) => {
        const at = s.attributes || s;
        return {
          id: s.id,
          documentId: s.documentId, // <- importante
          grado: at.grado ?? null,
          grupo: at.grupo ?? null,
          aula: at.aula ?? undefined,
          totalAlumnos: at.alumnos?.data?.length ?? at.totalAlumnos ?? 0
        };
      });

      // set para validación instantánea en preview
      this.salonDocSet = new Set(this.salones.map(s => (s.documentId || '').trim()));
    } catch (e) {
      console.error(e);
      this.presentToast('No se pudieron cargar los salones', 'danger');
    }
  }

  get salonesFiltrados(): SalonUI[] {
    const q = this.filtroSalon.trim().toLowerCase();
    const arr = this.salones.slice().sort((a, b) => {
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
      (s.aula && s.aula.toLowerCase().includes(q)) ||
      s.documentId.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  }

  get totalSalones(): number { return this.salones?.length || 0; }
  get totalFilasPreview(): number { return this.filas?.length || 0; }
  get totalErroresPreview(): number { return this.erroresPreview?.length || 0; }

  // ===== Media por defecto (desde assets) =====
  private async ensureDefaultFotoId(): Promise<void> {
    try {
      // 1) Buscar por nombre exacto o que contenga (case-insensitive)
      const q = encodeURIComponent(DEFAULT_FOTO_FILENAME);
      const url = `${API_BASE}/upload/files`
        + `?filters[$or][0][name][$eq]=${q}`
        + `&filters[$or][1][name][$containsi]=${q}`;
      const res = await axios.get(url, { headers: { Authorization: this.withBearer(this.token) } });
      const found = (res.data as any[])?.[0];
      if (found?.id) { this.defaultFotoId = Number(found.id); return; }

      // 2) cargar desde assets como Blob (HttpClient + firstValueFrom)
      let blob: Blob | null = null;
      for (const path of DEFAULT_FOTO_ASSET_PATHS) {
        try {
          blob = await firstValueFrom(this.http.get(path, { responseType: 'blob' }));
          if (blob) break;
        } catch {
          // intenta siguiente ruta
        }
      }
      if (!blob) throw new Error('No se pudo leer la imagen desde assets');

      // 3) crear File con mime razonable y subir a Strapi SIN pasar por api.service
      const type = blob.type || 'image/jpeg';
      const file = new File([blob], DEFAULT_FOTO_FILENAME, { type });
      const uploaded = await this.uploadFileLocal(file);
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

  // ===== Archivo =====
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
          const salonDoc = r.salon_documentId ?? r['salon_documentid'] ?? r['salon_docid'] ?? '';
          return {
            nombre: String(r.nombre || '').trim(),
            apellidos: String(r.apellidos || '').trim(),
            salon_documentId: String(salonDoc || '').trim() || undefined,
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

  // ===== Utilidades de validación para la vista previa =====
  isSalonDocPresent(f: FilaAlumno): boolean {
    return !!(f.salon_documentId && f.salon_documentId.trim());
  }
  isSalonDocValid(f: FilaAlumno): boolean {
    if (!this.isSalonDocPresent(f)) return false;
    return this.salonDocSet.has((f.salon_documentId as string).trim());
  }

  // ===== Resolver salón SOLO por documentId =====
  private resolverSalonId(f: FilaAlumno): number | null {
    if (!f.salon_documentId) return null;
    const s = this.salones.find(x => x.documentId === f.salon_documentId);
    return s ? s.id : null;
  }

  // ===== Importar =====
  async importar() {
    if (!this.filas.length) {
      return this.presentToast('No hay filas para importar.', 'warning');
    }
    if (this.erroresPreview.length) {
      return this.presentToast('Corrige los errores del preview antes de importar.', 'warning');
    }
    if (!this.defaultFotoId) {
      return this.presentToast(`No hay imagen por defecto disponible (${DEFAULT_FOTO_FILENAME}).`, 'warning');
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

              if (f.salon_documentId && !salonId) {
                // aviso, se crea sin salón
                this.resumen!.errores.push({
                  fila: filaExcel,
                  motivo: `AVISO: documentId "${f.salon_documentId}" no encontrado. Alumno creado sin salón.`
                });
              }

              // Crear alumno ligando SIEMPRE la foto por id (single media)
              await this.createAlumnoConFotoLocal(
                {
                  nombre: f.nombre,
                  apellidos: f.apellidos,
                  ...(salonId ? { salon: salonId } : {})
                },
                this.defaultFotoId!
              );

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

      this.presentToast(`Importación: OK ${this.resumen.ok}, Errores ${this.resumen.fail}`, 'success');
    } finally {
      this.cargando = false;
    }
  }

  // ===== Descarga: una sola plantilla con 2 hojas =====
  descargarPlantilla() {
    // Hoja alumnos
    const headers = ['nombre', 'apellidos', 'salon_documentId'];
    const ejemplo = [
      { nombre: 'Ana', apellidos: 'Pérez', salon_documentId: '' },
      { nombre: 'Luis', apellidos: 'Gómez', salon_documentId: '' }
    ];
    const ws1 = XLSX.utils.json_to_sheet(ejemplo, { header: headers });
    XLSX.utils.sheet_add_aoa(ws1, [headers], { origin: 'A1' });

    // Hoja salones
    const ws2 = XLSX.utils.json_to_sheet(
      this.salones.map(s => ({
        id: s.id,
        documentId: s.documentId,
        grado: s.grado ?? '',
        grupo: s.grupo ?? '',
        aula: s.aula ?? ''
      })),
      { header: ['id', 'documentId', 'grado', 'grupo', 'aula'] }
    );

    // Libro
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'alumnos');
    XLSX.utils.book_append_sheet(wb, ws2, 'salones_disponibles');
    XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
  }

  // ===== Utilidades =====
  async copyToClipboard(texto: string) {
    try {
      if (typeof navigator !== 'undefined' && (navigator as any)?.clipboard?.writeText) {
        await (navigator as any).clipboard.writeText(texto);
      } else {
        const ta = document.createElement('textarea');
        ta.value = texto;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.presentToast('DocumentID copiado al portapapeles', 'success');
    } catch (e) {
      console.error('Error copiando:', e);
      this.presentToast('No se pudo copiar. Copia manualmente.', 'danger');
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'danger') {
    const t = await this.toast.create({ message, duration: 2200, position: 'top', color });
    await t.present();
  }
}
