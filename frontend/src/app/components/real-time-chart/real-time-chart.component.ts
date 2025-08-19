import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';

Chart.register(...registerables);

@Component({
  selector: 'app-real-time-chart',
  templateUrl: './real-time-chart.component.html',
  styleUrls: ['./real-time-chart.component.scss'],
  standalone: false
})
export class RealTimeChartComponent implements AfterViewInit {
  @ViewChild('lineCanvas') private lineCanvas!: ElementRef;
  lineChart!: Chart;
  token: string = '';
  lastCheckTime: Date = new Date();

  constructor(private api: ApiService, private storage: Storage) { }

  async ngOnInit() {
    this.token = await this.storage.get('token');
  }

  ngAfterViewInit() {
    this.createChart();

    setInterval(() => this.addNextPoint(), 5000); // cada 5 segundos
  }

  createChart() {
    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: [],
        datasets: [
          {
            label: 'Llegadas en tiempo real',
            data: [],
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255,99,132,0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          x: { title: { display: true, text: 'Tiempo' } },
          y: { title: { display: true, text: 'Llegadas false' }, beginAtZero: true },
        },
      },
    };

    this.lineChart = new Chart(this.lineCanvas.nativeElement, config);
  }

  async addNextPoint() {
    const now = new Date();
    const labels = this.lineChart.data.labels as string[];
    const data = this.lineChart.data.datasets[0].data as number[];

    let arrivalsInInterval = 0;

    try {
      const res: any = await this.api.getLLegueGlobal(this.token);

      if (res && res.data && Array.isArray(res.data.data)) {
        // Solo llegadas false en el intervalo de 5 segundos
        arrivalsInInterval = res.data.data.filter((item: any) => {
          const createdAt = new Date(item.createdAt);
          return item.llegada === false && createdAt > this.lastCheckTime && createdAt <= now;
        }).length;
      }
    } catch (error) {
      console.error('Error fetching data from API', error);
    }

    this.lastCheckTime = now;

    const label = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    labels.push(label);
    data.push(arrivalsInInterval);

    // Limitar a 10 puntos
    if (labels.length > 10) {
      labels.shift();
      data.shift();
    }

    this.lineChart.update();
  }
}
