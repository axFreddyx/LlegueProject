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
  @ViewChild('canvasSalones', { static: false }) canvasSalones!: ElementRef<HTMLCanvasElement>;




  fecha = '';                 // YYYY-MM-DD
  cargando = false;
  chart?: Chart;
  avisosHoy = 0;
  token = "";

  chartSalones?: Chart;

  // KPIs
  horaPico: string | null = null;
  horaPicoConteo: number | null = null;


  // Datos para Graficar
  periodos: any[] = [];
  salones: any[] = [];
  alumnos: any[] = [];
  admins: any[] = [];
  personas: any[] = [];
  docentes: any[] = [];

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toast: ToastController
  ) { }

  async ngOnInit() {
    const hoy = new Date();
    this.fecha = hoy.toISOString().slice(0, 10);
    this.token = await this.storage.get('token');


    this.getPeriodo();
    this.getSalones();
    this.getAlumnos();
    this.getAdmins();
    this.getPersonasAutorizadas();
    this.getDocentes();
  }

  async ngAfterViewInit() {
    await this.cargar();
    await this.cargarGraficaSalones();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }



  async cargarGraficaSalones() {
    try {
      const token = await this.storage.get('token');
      if (!token) throw new Error('Sin token');

      // Traer salones
      const res: any = await this.api.getSalones(token);
      const salones = res?.data?.data ?? [];

      const labels = salones.map((s: any) => s.nombre);
      const data = salones.map((s: any) => this.alumnos.filter(a => a.salon?.id === s.id).length);



      // Destruir gráfica previa
      this.chartSalones?.destroy();

      // Crear nueva gráfica
      this.chartSalones = new Chart(this.canvasSalones.nativeElement.getContext('2d')!, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Salones',
            data,
            backgroundColor: '#36A2EB'
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          plugins: { legend: { display: false } }
        }
      });

    } catch (err) {
      console.error('Error cargando gráfica de salones:', err);
    }
  }


  async getPeriodo() {
    this.periodos = [];
    try {
      const res: any = await this.api.getPeriodos(this.token);
      this.periodos = res.data.data || [];
      console.log(this.periodos)
    } catch (err) {
      console.error(err);
      this.presentToast('Error al cargar periodos.', 'danger');
    }
  }

  async getSalones() {
    this.salones = [];
    try {
      const res: any = await this.api.getSalones(this.token);
      this.salones = res.data.data || [];
      console.log("Salones:", this.salones)
    } catch (err) {
      console.error(err);
      this.presentToast('Error al cargar salones.', 'danger');
    }
  }

  async getAlumnos() {
    try {
      const res: any = await this.api.getAlumnos(this.token);
      this.alumnos = res.data.data;

    } catch (err) {
      console.error('Error fetching alumnos:', err);
      this.presentToast('Error al cargar alumnos.', 'danger');
    }
  }

  async getAdmins() {
    await this.api.getUsersByRole(5).then((res: any) => { // rol admin = 1
      if (res?.data) {
        this.admins = res.data;

        console.log('Administradores:', this.admins);

        this.admins.forEach((admin: any) => {
          if (admin.alumnos && Array.isArray(admin.alumnos)) {
            admin.alumnos = admin.alumnos.filter((alumno: any) => alumno?.publishedAt != null);
          } else {
            admin.alumnos = [];
          }
        });
      } else {
        console.warn('No se encontró .data en la respuesta:', res);
      }
    }).catch((err: any) => {
      console.error('Error al obtener administradores:', err);
      this.admins = [];
    });
  }

  async getPersonasAutorizadas() {
    await this.api.getUsersByRole(3).then((res: any) => {
      if (res?.data) {
        this.personas = res.data;

        console.log('Personas autorizadas:', this.personas);

        this.personas.forEach((persona: any) => {
          if (persona.alumnos && Array.isArray(persona.alumnos)) {
            // Filtra alumnos con publishedAt no nulo
            persona.alumnos = persona.alumnos.filter((alumno: any) => alumno?.publishedAt != null);
          } else {
            persona.alumnos = []; // Si no hay alumnos, aseguramos que sea arreglo vacío
          }
        });
      } else {
        console.warn('No se encontró .data en la respuesta:', res);
      }
    }).catch((err: any) => {
      console.error('Error al obtener personas autorizadas:', err);
      this.personas = [];
    });
  }

  async getDocentes() {
    await this.api.getUsersByRole(4).then((res: any) => {
      this.docentes = res.data;
    }).catch((err: any) => {
      console.error('Error fetching docentes:', err);
      this.presentToast('Error al cargar docentes.', 'danger');
    });
  }


  preset(tipo: 'hoy' | 'ayer' | 'hace2d') {
    const base = new Date();
    if (tipo === 'ayer') base.setDate(base.getDate() - 1);
    if (tipo === 'hace2d') base.setDate(base.getDate() - 2);
    this.fecha = base.toISOString().slice(0, 10);
    this.cargar();
  }

  private inicioFinDelDiaLocal(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
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

      const data = buckets.map(b => b.c);

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
