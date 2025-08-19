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
  
  selectedTab: 'plantilla' | 'salones' | 'importar' = 'plantilla';

  // Estado general
  file: File | null = null;
  token = '';
  cargando = false;

  // Preview
  filas: FilaAlumno[] = [];
  erroresPreview: string[] = [];
  resumen: {
    ok: number;
    fail: number;
    duplicadosBD: number;
    duplicadosExcel: number;
    errores: Array<{ fila: number; motivo: string; tipo: 'dup-bd' | 'dup-excel' | 'error' }>;
  } | null = null;

  // Salones
  salones: SalonUI[] = [];
  filtroSalon = '';
  private salonDocSet: Set<string> = new Set();

  // Media por defecto
  defaultFotoId: number | null = null;

  // Duplicados
  private existingKeys = new Set<string>(); // claves únicas ya existentes en BD
  private vistosExcel = new Set<string>();   // claves vistas en este Excel (misma importación)
  private excelSalonesIds = new Set<number>(); // salones involucrados en el Excel

  constructor(
    private storage: Storage,
    private api: ApiService,
    private toast: ToastController,
    private http: HttpClient
  ) {}

  // ----- Helpers ----- 

  private withBearer(t: string): string {
    return t?.startsWith('Bearer ') ? t : `Bearer ${t}`;
  }

  // Normaliza: trim, minúsculas, sin acentos (compatible cross-browser)
  private norm(s: string): string {
    return (s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Clave única por (salonId, nombre, apellidos). Usa 0 si no hay salón.
  private makeKey(salonId: number | null, nombre: string, apellidos: string): string {
    const n = this.norm(nombre);
    const a = this.norm(apellidos);
    const sid = salonId ?? 0;
    return `${sid}|${n}|${a}`;
  }

  private parseStrapiList(resp: any): { items: any[]; meta?: any } {
    const d = resp?.data;
    if (Array.isArray(d)) return { items: d, meta: undefined };
    return { items: d?.data ?? [], meta: d?.meta };
  }

  private async uploadFileLocal(file: File) {
    const form = new FormData();
    form.append('files', file);
    const res = await axios.post(`${API_BASE}/upload`, form, {
      headers: { Authorization: this.withBearer(this.token) }
    });
    const uploadedArr = res.data as any[];
    return uploadedArr?.[0]; // { id, name, url, ... }
  }

  private async createAlumnoConFotoLocal(data: any, fotoId: number) {
    const headers = { Authorization: this.withBearer(this.token) };
    try {
      return await axios.post(`${API_BASE}/alumnos`, { data: { ...data, foto: fotoId } }, { headers });
    } catch (e: any) {
      if (e?.response?.status === 400) {
        return await axios.post(`${API_BASE}/alumnos`, { data: { ...data, foto: { id: fotoId } } }, { headers });
      }
      throw e;
    }
  }

  // ----- Ciclo de vida ----- 

  async ngOnInit() {
    this.token = await this.storage.get('token');
    await this.cargarSalones();
    await this.ensureDefaultFotoId();
  }

  // ----- Salones ----- 
  async cargarSalones() {
    try {
      const res = await this.api.verSalones(this.token); // GET /salons
      const parsed = this.parseStrapiList(res);
      this.salones = parsed.items.map((s: any) => {
        const at = s.attributes || s;
        const documentId = s.documentId ?? at.documentId ?? '';
        return {
          id: s.id,
          documentId: String(documentId),
          grado: at.grado ?? null,
          grupo: at.grupo ?? null,
          aula: at.aula ?? undefined,
          totalAlumnos: at.alumnos?.data?.length ?? at.totalAlumnos ?? 0
        };
      });
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

  // ----- Media por defecto (desde assets) ----- 
  private async ensureDefaultFotoId(): Promise<void> {
    try {
      // 1) Buscar por nombre exacto o que contenga (case-insensitive)
      const q = encodeURIComponent(DEFAULT_FOTO_FILENAME);
      const url = `${API_BASE}/upload/files`
        + `?filters[$or][0][name][$eq]=${q}`
        + `&filters[$or][1][name][$containsi]=${q}`;
      const res = await axios.get(url, { headers: { Authorization: this.withBearer(this.token) } });

      // /upload/files regresa array
      const files = (res.data as any[]) || [];
      const found = files[0];
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

      // 3) subir a Strapi
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

  // ----- Archivo ----- 
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

  // ----- Helpers de preview ----- 
  isSalonDocPresent(f: FilaAlumno): boolean {
    return !!(f.salon_documentId && f.salon_documentId.trim());
  }
  isSalonDocValid(f: FilaAlumno): boolean {
    if (!this.isSalonDocPresent(f)) return false;
    return this.salonDocSet.has((f.salon_documentId as string).trim());
  }

  // Resolver id interno del salón SOLO por documentId
  private resolverSalonId(f: FilaAlumno): number | null {
    if (!f.salon_documentId) return null;
    const s = this.salones.find(x => x.documentId === f.salon_documentId);
    return s ? s.id : null;
  }

  // ----- Precarga claves existentes desde BD (por salones en Excel + sin salón) ----- 
  private async preloadExistingForExcelSalones(): Promise<void> {
    this.excelSalonesIds.clear();
    this.vistosExcel.clear();
    this.existingKeys.clear();

    // 1) Qué salones aparecen en el Excel (por documentId -> id interno)
    for (const f of this.filas) {
      const sid = this.resolverSalonId(f);
      if (sid !== null) this.excelSalonesIds.add(sid);
    }

    const token = this.withBearer(this.token);
    const pageSize = 100;

    // 2) Traer alumnos de esos salones y llenar existingKeys
    for (const sid of this.excelSalonesIds) {
      let page = 1;
      while (true) {
        const res = await axios.get(`${API_BASE}/alumnos`, {
          headers: { Authorization: token },
          params: {
            'filters[salon][id][$eq]': sid,
            'pagination[page]': page,
            'pagination[pageSize]': pageSize,
            'fields[0]': 'nombre',
            'fields[1]': 'apellidos',
            'populate': 'salon'
          }
        });
        const parsed = this.parseStrapiList(res);
        for (const raw of parsed.items) {
          const it = raw.attributes ? raw.attributes : raw;
          const nombre = it.nombre ?? raw.nombre ?? '';
          const apellidos = it.apellidos ?? raw.apellidos ?? '';
          this.existingKeys.add(this.makeKey(sid, nombre, apellidos));
        }
        const pageCount = parsed.meta?.pagination?.pageCount ?? 1;
        if (page >= pageCount) break;
        page++;
      }
    }

    // 3) (Opcional) alumnos sin salón (por si el Excel deja vacío el salon_documentId)
    {
      let page = 1;
      while (true) {
        const res = await axios.get(`${API_BASE}/alumnos`, {
          headers: { Authorization: token },
          params: {
            'filters[salon][$null]': true,
            'pagination[page]': page,
            'pagination[pageSize]': pageSize,
            'fields[0]': 'nombre',
            'fields[1]': 'apellidos'
          }
        });
        const parsed = this.parseStrapiList(res);
        for (const raw of parsed.items) {
          const it = raw.attributes ? raw.attributes : raw;
          const nombre = it.nombre ?? raw.nombre ?? '';
          const apellidos = it.apellidos ?? raw.apellidos ?? '';
          this.existingKeys.add(this.makeKey(null, nombre, apellidos));
        }
        const pageCount = parsed.meta?.pagination?.pageCount ?? 1;
        if (page >= pageCount) break;
        page++;
      }
    }
  }

  // ----- Importar ----- 
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
    this.resumen = { ok: 0, fail: 0, duplicadosBD: 0, duplicadosExcel: 0, errores: [] };

    try {
      // 1) Precarga duplicados en BD
      await this.preloadExistingForExcelSalones();

      // 2) Procesa en chunks
      const chunkSize = 20;
      const chunks: FilaAlumno[][] = [];
      for (let i = 0; i < this.filas.length; i += chunkSize) {
        chunks.push(this.filas.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (f) => {
            const filaExcel = this.filas.indexOf(f) + 2;
            try {
              // Validación de requeridos
              if (!f.nombre || !f.apellidos) {
                this.resumen!.fail++;
                this.resumen!.errores.push({
                  fila: filaExcel,
                  tipo: 'error',
                  motivo: `Faltan datos obligatorios: agrega nombre y apellidos.`
                });
                return;
              }

              const salonId = this.resolverSalonId(f);
              const key = this.makeKey(salonId, f.nombre, f.apellidos);

              // 2a) Duplicado dentro del MISMO ARCHIVO (antes de tocar la BD)
              if (this.vistosExcel.has(key)) {
                this.resumen!.duplicadosExcel++;
                this.resumen!.errores.push({
                  fila: filaExcel,
                  tipo: 'dup-excel',
                  motivo: `Repetido en este archivo: “${f.nombre} ${f.apellidos}”${salonId ? ' para el mismo salón' : ''}.`
                });
                return;
              }

              // 2b) Duplicado en BD
              if (this.existingKeys.has(key)) {
                this.resumen!.duplicadosBD++;
                this.resumen!.errores.push({
                  fila: filaExcel,
                  tipo: 'dup-bd',
                  motivo: `Ya existe en BD: “${f.nombre} ${f.apellidos}”${salonId ? ' en ese salón' : ''}.`
                });
                // Marca también en vistosExcel para evitar más repeticiones del mismo en el resto del archivo
                this.vistosExcel.add(key);
                return;
              }

              // 3) Crear
              await this.createAlumnoConFotoLocal(
                {
                  nombre: f.nombre,
                  apellidos: f.apellidos,
                  ...(salonId ? { salon: salonId } : {})
                },
                this.defaultFotoId!
              );

              // 4) Marcar claves en memoria para siguientes filas
              this.vistosExcel.add(key);
              this.existingKeys.add(key);
              this.resumen!.ok++;

            } catch (e: any) {
              console.error(e);
              const motivo = e?.response?.data?.error?.message || 'No se pudo crear el alumno.';
              this.resumen!.fail++;
              this.resumen!.errores.push({ fila: filaExcel, tipo: 'error', motivo });
            }
          })
        );
      }

      const totalDup = this.resumen.duplicadosBD + this.resumen.duplicadosExcel;
      this.presentToast(
        `Resultado: ${this.resumen.ok} creados, ${this.resumen.duplicadosBD} duplicados BD, ${this.resumen.duplicadosExcel} duplicados Excel, ${this.resumen.fail} errores.`,
        (this.resumen.fail || totalDup) ? 'warning' : 'success'
      );
    } finally {
      this.cargando = false;
    }
  }

  // ===== Descarga de plantilla =====
  descargarPlantilla() {
    const headers = ['nombre', 'apellidos', 'salon_documentId'];
    const ejemplo = [
      { nombre: 'Ana', apellidos: 'Pérez', salon_documentId: '' },
      { nombre: 'Luis', apellidos: 'Gómez', salon_documentId: '' }
    ];

    const ws1 = XLSX.utils.json_to_sheet(ejemplo, { header: headers });
    XLSX.utils.sheet_add_aoa(ws1, [headers], { origin: 'A1' });

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
    const t = await this.toast.create({ message, duration: 2600, position: 'top', color });
    await t.present();
  }
}
