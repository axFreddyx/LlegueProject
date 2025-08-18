import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-visualizacion-llegadas',
  templateUrl: './visualizacion-llegadas.page.html',
  styleUrls: ['./visualizacion-llegadas.page.scss'],
  standalone: false
})
export class VisualizacionLlegadasPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvasHora', { static: false }) canvasHora!: ElementRef<HTMLCanvasElement>;

  fecha = '';                 // YYYY-MM-DD
  cargando = false;
  chart?: Chart;
  avisosHoy = 0;

  // KPIs
  horaPico: string | null = null;
  horaPicoConteo: number | null = null;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toast: ToastController
  ) {}

  ngOnInit() {
    const hoy = new Date();
    this.fecha = hoy.toISOString().slice(0,10);
  }

  async ngAfterViewInit() {
    await this.cargar();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  preset(tipo: 'hoy' | 'ayer' | 'hace2d') {
    const base = new Date();
    if (tipo === 'ayer') base.setDate(base.getDate() - 1);
    if (tipo === 'hace2d') base.setDate(base.getDate() - 2);
    this.fecha = base.toISOString().slice(0,10);
    this.cargar();
  }

  private inicioFinDelDiaLocal(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0);
    const fin    = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
    return { inicioISO: inicio.toISOString(), finISO: fin.toISOString() };
  }

  async cargar() {
    this.cargando = true;
    try {
      const token = await this.storage.get('token');
      if (!token) throw new Error('Sin token');

      const { inicioISO, finISO } = this.inicioFinDelDiaLocal(this.fecha);

      // Método del servicio con $gte/$lte 
      const res: any = await this.api.getLlegadasPorRango(inicioISO, finISO, token);

      const llegadas: any[] = (res && res.data && Array.isArray(res.data.data))
        ? res.data.data
        : [];

      this.avisosHoy = llegadas.length;

      // buckets 0..23
      const buckets = Array.from({ length: 24 }, (_, h) => ({ h, c: 0 }));
      for (const item of llegadas) {
        const createdAt: string | undefined = item?.createdAt; 
        if (!createdAt) continue;
        const h = new Date(createdAt).getHours();
        if (h >= 0 && h <= 23) buckets[h].c++;
      }

      // KPI hora pico
      const max = buckets.reduce((acc, b) => (b.c > acc.c ? b : acc), { h: -1, c: 0 });
      if (max.h >= 0 && max.c > 0) {
        //this.horaPico = `${String(max.h).padStart(2,'0')}:00`;
        const ampm = max.h >= 12 ? 'PM' : 'AM';
        const hour12 = max.h % 12 === 0 ? 12 : max.h % 12;
        this.horaPico = `${hour12} ${ampm}`;

        this.horaPicoConteo = max.c;
      } else {
        this.horaPico = null;
        this.horaPicoConteo = null;
      }

      //const labels = buckets.map(b => `${String(b.h).padStart(2,'0')}:00`);
      const labels = buckets.map(b => {
        const h = b.h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${hour12} ${ampm}`;
      });

      const data   = buckets.map(b => b.c);

      this.renderChart(labels, data);

    } catch (e: any) {
      console.error('STRAPI ERROR', e?.response?.data || e);
      const t = await this.toast.create({ message: 'Error al cargar datos', duration: 2200 });
      t.present();
      this.avisosHoy = 0;
      this.horaPico = null;
      this.horaPicoConteo = null;
      this.chart?.destroy();
    } finally {
      this.cargando = false;
    }
  }

  private renderChart(labels: string[], data: number[]) {

    if (!this.canvasHora || !this.canvasHora.nativeElement) return;

    this.chart?.destroy();

    this.chart = new Chart(this.canvasHora.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Avisos por hora', data }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  exportarPNG() {
    if (!this.chart) return;
    const url = this.chart.toBase64Image('image/png', 1);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avisos_por_hora_${this.fecha}.png`;
    a.click();
  }
}
