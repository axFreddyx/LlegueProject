import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef
} from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { ToastController, IonModal } from '@ionic/angular';
import { Router } from '@angular/router';

import {
  Chart, BarController, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, ArcElement, DoughnutController
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(
  BarController, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, ArcElement, DoughnutController, ChartDataLabels
);

interface Salon {
  id?: number;
  aula: string;
  grado: number;
  grupo: string;
  alumnos?: any[];
  totalAlumnos?: number;
}

type EstadoSimple = 'En espera' | 'Entregado';

interface LlegadaRow {
  id: string | number;
  hora: string;       
  horaDate: Date;
  alumno: string;
  salonId: number | null;
  salonLabel: string;  
  persona?: string;
  estado: EstadoSimple;
}

@Component({
  selector: 'app-visualizacion-llegadas',
  templateUrl: './visualizacion-llegadas.page.html',
  styleUrls: ['./visualizacion-llegadas.page.scss'],
  standalone: false
})
export class VisualizacionLlegadasPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvasHora',    { static: false }) canvasHora!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasSalones', { static: false }) canvasSalones!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dateModal',     { static: false }) dateModal!:     IonModal;

  // ====== Filtros de fecha / calendario ======
  fecha = '';                 
  fechaTemp = '';             
  maxFecha = '';              
  minFecha = '1900-01-01';    
  fechaLabel = '';            

  // ====== Estado general ======
  cargando = false;
  token = '';

  // ====== Charts ======
  chart?: Chart;            
  chartSalones?: Chart;     

  // ====== KPIs ======
  avisosHoy = 0;
  horaPico: string | null = null;
  horaPicoConteo: number | null = null;

  // ====== Datos base ======
  periodos: any[] = [];
  salones:  Salon[] = [];
  alumnos:  any[] = [];
  admins:   any[] = [];
  personas: any[] = [];
  docentes: any[] = [];

  // ====== Tabla simplificada ======
  llegadasDiaRaw: any[] = [];
  rows: LlegadaRow[] = [];
  rowsFiltradas: LlegadaRow[] = [];

  // Filtros tabla
  searchText = '';
  filterSalon: 'all' | number = 'all';
  filterEstado: 'all' | EstadoSimple = 'all';

  // Opciones selects
  selectSalones: { id: number, label: string }[] = [];

  // Paginación
  page = 1;
  pageSize = 10;
  private _searchDebounce: any;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toast: ToastController,
    private router: Router
  ) {}

  // ================== Ciclo de vida ==================
  async ngOnInit() {
    this.token = await this.storage.get('token');
    if (!this.token) {
      this.router.navigate(['/login']);
      return;
    }

    const hoy = new Date();
    this.fecha = hoy.toISOString().slice(0, 10);
    this.maxFecha = this.fecha;
    this.updateFechaLabel();

    await Promise.all([
      this.getPeriodos(),
      this.getSalones(),
      this.getAlumnos(),
      this.getAdmins(),
      this.getPersonasAutorizadas(),
      this.getDocentes()
    ]);
  }

  async ngAfterViewInit() {
    await this.cargar();             
    this.organizarAlumnosPorSalon(); 
    this.renderChartSalones(this.salones);
  }

  ngOnDestroy() {
    this.chart?.destroy();
    this.chartSalones?.destroy();
  }

  // ================== Calendario (modal) ==================
  onOpenDateModal() {
    this.fechaTemp = this.fecha; 
  }
  cancelDate() {
    this.dateModal?.dismiss();
  }
  confirmDate() {
    this.fecha = this.fechaTemp || this.fecha;
    this.updateFechaLabel();
    this.dateModal?.dismiss();
    this.cargar(); 
  }
  private updateFechaLabel() {
    const d = new Date(this.fecha + 'T00:00:00');
    this.fechaLabel = d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ================== Datos maestros ==================
  async getAlumnos() {
    try {
      const res: any = await this.api.getAlumnos(this.token);
      this.alumnos = res?.data?.data ?? [];
    } catch {
      this.presentToast('Error al cargar alumnos.', 'danger');
    }
  }
  async getPeriodos() {
    try {
      const res: any = await this.api.getPeriodos(this.token);
      this.periodos = res?.data?.data ?? [];
    } catch {
      this.presentToast('Error al cargar periodos.', 'danger');
    }
  }
  async getSalones() {
    this.salones = [];
    try {
      const res = await this.api.verSalones(this.token);
      const data = (res.data as any).data as Salon[];
      this.salones = (data || [])
        .map(s => ({ ...s, totalAlumnos: (s as any)?.alumnos?.length || 0 }))
        .sort((a, b) =>
          (a.grado !== b.grado ? a.grado - b.grado :
            a.grupo.toLowerCase().localeCompare(b.grupo.toLowerCase()))
        );
    } catch {
      this.presentToast('Error al cargar salones.', 'danger');
    }
  }
  async getAdmins() {
    try {
      const res: any = await this.api.getUsersByRole(5);
      this.admins = res?.data || [];
      this.admins.forEach((a: any) =>
        a.alumnos = Array.isArray(a.alumnos) ? a.alumnos.filter((x: any) => x?.publishedAt != null) : []
      );
    } catch {
      this.admins = [];
    }
  }
  async getPersonasAutorizadas() {
    try {
      const res: any = await this.api.getUsersByRole(3);
      this.personas = res?.data || [];
      this.personas.forEach((p: any) =>
        p.alumnos = Array.isArray(p.alumnos) ? p.alumnos.filter((x: any) => x?.publishedAt != null) : []
      );
    } catch {
      this.personas = [];
    }
  }
  async getDocentes() {
    try {
      const res: any = await this.api.getUsersByRole(4);
      this.docentes = res?.data || [];
    } catch {
      this.presentToast('Error al cargar docentes.', 'danger');
    }
  }

  // ================== Filtros rápidos de fecha ==================
  preset(tipo: 'hoy' | 'ayer' | 'hace2d') {
    const base = new Date();
    if (tipo === 'ayer')   base.setDate(base.getDate() - 1);
    if (tipo === 'hace2d') base.setDate(base.getDate() - 2);
    this.fecha = base.toISOString().slice(0, 10);
    this.updateFechaLabel();
    this.cargar();
  }
  private inicioFinDelDiaLocal(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const fin    = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    return { inicioISO: inicio.toISOString(), finISO: fin.toISOString() };
  }

  // ================== Carga del día (gráfico + tabla) ==================
  async cargar() {
    this.cargando = true;
    try {
      const token = await this.storage.get('token');
      if (!token) throw new Error('Sin token');

      const { inicioISO, finISO } = this.inicioFinDelDiaLocal(this.fecha);
      const res: any = await this.api.getLlegadasPorRango(inicioISO, finISO, token);
      const llegadas: any[] = (res?.data?.data ?? []);
      this.llegadasDiaRaw = llegadas;

      // --- KPIs + gráfico por hora ---
      this.avisosHoy = llegadas.length;
      const buckets = Array.from({ length: 24 }, (_, h) => ({ h, c: 0 }));
      for (const item of llegadas) {
        const createdAt = this.getCreatedAt(item);
        if (!createdAt) continue;
        const h = new Date(createdAt).getHours();
        if (h >= 0 && h <= 23) buckets[h].c++;
      }
      const max = buckets.reduce((acc, b) => (b.c > acc.c ? b : acc), { h: -1, c: 0 });
      if (max.h >= 0 && max.c > 0) {
        const ampm = max.h >= 12 ? 'PM' : 'AM';
        const hour12 = max.h % 12 === 0 ? 12 : max.h % 12;
        this.horaPico = `${hour12} ${ampm}`;
        this.horaPicoConteo = max.c;
      } else {
        this.horaPico = null;
        this.horaPicoConteo = null;
      }
      const labels = buckets.map(b => {
        const h = b.h; const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12; return `${hour12} ${ampm}`;
      });
      const data = buckets.map(b => b.c);
      this.renderChartHora(labels, data);

      // --- Tabla: map + filtros ---
      this.rows = this.mapLlegadasToRows(llegadas)
        .sort((a, b) => b.horaDate.getTime() - a.horaDate.getTime());
      this.buildFilterOptions();   // inicial
      this.applyFilters(true);

      // --- Refrescar gráfico de alumnos por salón + opciones de select desde catálogo ---
      await Promise.all([this.getSalones(), this.getAlumnos()]);
      this.organizarAlumnosPorSalon();
      this.renderChartSalones(this.salones);

      // Asegura opciones finales desde catálogo completo
      this.buildFilterOptions();

    } catch {
      this.presentToast('Error al cargar datos', 'danger');
      this.avisosHoy = 0; this.horaPico = null; this.horaPicoConteo = null;
      this.chart?.destroy();
      this.rows = []; this.rowsFiltradas = [];
    } finally {
      this.cargando = false;
    }
  }

  // ================== Helpers de normalización / mapeo ==================
  private norm(s: string): string {
    return (s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private unwrap(node: any) {
    return node?.attributes ?? node ?? null;
  }

  private getCreatedAt(item: any): string | undefined {
    const at = item?.attributes ?? item;
    return at?.createdAt;
  }

  private safeNombre(user: any): string {
    const u = this.unwrap(user);
    const n = u?.nombre ?? u?.username ?? '';
    const ap = u?.apellidos ?? '';
    return `${n} ${ap}`.trim();
  }

  private formatSalonLabel(s: any): string {
    const grado = s?.grado;
    const grupo = s?.grupo;
    if (grado != null || grupo) return `${grado ?? ''}° ${grupo ?? ''}`.trim();
    return s?.aula ?? '—';
  }

  private mapLlegadasToRows(llegadas: any[]): LlegadaRow[] {
    return (llegadas || []).map((it: any) => {
      const at = it?.attributes ?? it;

      const createdAt = at?.createdAt ? new Date(at.createdAt) : new Date();
      const hh = String(createdAt.getHours()).padStart(2, '0');
      const mm = String(createdAt.getMinutes()).padStart(2, '0');

      const alumnoNode = at?.alumno?.data ?? at?.alumno;
      const alumno = this.unwrap(alumnoNode);

      const salonNode = alumno?.salon?.data ?? alumno?.salon;
      const salon = this.unwrap(salonNode);

      // fuerza a número si viene string; si no hay id, deja null
      const salonIdRaw = salonNode?.id ?? salon?.id ?? null;
      const salonId = (salonIdRaw !== null && salonIdRaw !== undefined)
        ? Number(salonIdRaw)
        : null;

      const salonLabel = this.formatSalonLabel(salon);

      const personaNode = at?.persona_autorizada?.data ?? at?.persona_autorizada;
      const persona = this.safeNombre(personaNode);

      const docenteNode = at?.docente?.data ?? at?.docente;
      const entregado = !!(docenteNode?.id);
      const estado: EstadoSimple = entregado ? 'Entregado' : 'En espera';

      return {
        id: at?.id ?? it?.id ?? `${createdAt.getTime()}`,
        hora: `${hh}:${mm}`,
        horaDate: createdAt,
        alumno: this.safeNombre(alumno) || '(sin alumno)',
        salonId,
        salonLabel,
        persona: persona || '—',
        estado
      } as LlegadaRow;
    });
  }

  // Opciones del select de salones construidas desde el catálogo
  private buildFilterOptions() {
    const seen = new Set<number>();
    this.selectSalones = (this.salones || [])
      .map((s: any) => {
        const id = Number(s?.id);
        const label = this.formatSalonLabel(s);
        return { id, label };
      })
      .filter(opt => Number.isFinite(opt.id) && !!opt.label && !seen.has(opt.id))
      .map(opt => { seen.add(opt.id); return opt; })
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // ================== Filtros + paginación ==================
  applyFilters(resetPage = false) {
    const t = this.norm(this.searchText);
    this.rowsFiltradas = this.rows.filter(r => {
      const okText = !t ||
        this.norm(r.alumno).includes(t) ||
        this.norm(r.persona || '').includes(t) ||
        this.norm(r.salonLabel || '').includes(t);

      const okSalon = this.filterSalon === 'all'
        || (r.salonId !== null && Number(r.salonId) === Number(this.filterSalon));

      const okEstado = this.filterEstado === 'all' || r.estado === this.filterEstado;

      return okText && okSalon && okEstado;
    });
    if (resetPage) this.page = 1;
  }

  applyFiltersDebounced(val?: string | null) {
    this.searchText = (val ?? '');
    clearTimeout(this._searchDebounce);
    this._searchDebounce = setTimeout(() => this.applyFilters(true), 200);
  }

  onSalonChange(ev: any) {
    const v = ev?.detail?.value;
    this.filterSalon = (v === 'all') ? 'all' : Number(v);
    this.applyFilters(true);
  }

  onEstadoChange(ev: any) {
    const v = ev?.detail?.value as ('all' | EstadoSimple);
    this.filterEstado = v ?? 'all';
    this.applyFilters(true);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.rowsFiltradas.length / this.pageSize));
  }
  get pageRows(): LlegadaRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.rowsFiltradas.slice(start, start + this.pageSize);
  }
  nextPage() { if (this.page < this.totalPages) this.page++; }
  prevPage() { if (this.page > 1) this.page--; }

  // ================== Gráficos ==================
  private renderChartHora(labels: string[], data: number[]) {
    if (!this.canvasHora?.nativeElement) return;
    this.chart?.destroy();

    this.chart = new Chart(this.canvasHora.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Llegadas por hora',
          data,
          borderRadius: 6,
          maxBarThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          datalabels: {
            anchor: 'end', align: 'top',
            formatter: (v: number) => (v > 0 ? v : ''),
            font: { weight: '600' as any, size: 11 }, clamp: true
          }
        },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        animation: { duration: 600, easing: 'easeOutQuart' }
      }
    });
  }

  private organizarAlumnosPorSalon() {
    // Si el endpoint de salones ya trae alumnos, úsalo directamente
    if (this.salones?.length && (this.salones[0] as any)?.alumnos !== undefined) {
      this.salones = this.salones.map(s => ({
        ...s,
        totalAlumnos: (s as any)?.alumnos?.length || 0
      }));
      return;
    }

    // Fallback: contar desde this.alumnos (tolerando shapes de Strapi)
    const counts = new Map<number, number>();
    for (const a of (this.alumnos || [])) {
      const sid =
        (a as any)?.salon?.id ??
        (a as any)?.attributes?.salon?.data?.id ??
        null;
      if (sid != null) {
        const n = Number(sid);
        counts.set(n, (counts.get(n) || 0) + 1);
      }
    }
    this.salones = this.salones.map(s => ({
      ...s,
      totalAlumnos: counts.get(Number(s.id!)) || 0
    }));
  }

  private renderChartSalones(salones: Salon[]) {
    if (!this.canvasSalones?.nativeElement) return;
    this.chartSalones?.destroy();

    const labels = salones.map(s => `${s.grado}° ${s.grupo}`);
    const data   = salones.map(s => s.totalAlumnos || 0);

    this.chartSalones = new Chart(this.canvasSalones.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Alumnos',
          data,
          borderRadius: 8,
          maxBarThickness: 36
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false }, tooltip: { enabled: true },
          datalabels: {
            anchor: 'end', align: 'top',
            formatter: (v: number) => (v > 0 ? v : ''),
            font: { weight: '600' as any, size: 11 }, clamp: true
          }
        },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { autoSkip: true, maxRotation: 0 } } },
        animation: { duration: 700, easing: 'easeOutQuart' }
      }
    });
  }

  // ================== Export ==================
  exportPNG(target: 'hora' | 'salones') {
    if (target === 'hora')    this.exportChartAsPNG(this.chart,        `llegadas_por_hora_${this.fecha}.png`);
    if (target === 'salones') this.exportChartAsPNG(this.chartSalones, `alumnos_por_salon_${this.fecha}.png`);
  }
  private exportChartAsPNG(chart: Chart | undefined, filename: string) {
    if (!chart) return;
    const url = chart.toBase64Image('image/png', 1);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  }

  // ================== UI ==================
  async presentToast(message: string, type: 'success' | 'danger' | 'warning') {
    const toast = await this.toast.create({
      message,
      duration: 1500,
      position: 'top',
      color: type
    });
    await toast.present();
  }
}
