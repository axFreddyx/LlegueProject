import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { IonCard } from "@ionic/angular/standalone";
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-real-time-chart',
  templateUrl: './real-time-chart.component.html',
  styleUrls: ['./real-time-chart.component.scss'],
  standalone: false
})
export class RealTimeChartComponent implements AfterViewInit {
  @ViewChild('lineCanvas') private lineCanvas!: ElementRef;
  lineChart!: Chart;

  ngAfterViewInit() {
    this.createChart();

    // Simulación de llegadas cada 3 segundos (luego reemplazas con tu backend)
    setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const newArrivals = Math.floor(Math.random() * 5); // Número aleatorio de llegadas

      this.updateChart(now, newArrivals);
    }, 3000);
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
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54,162,235,0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Hora' },
          },
          y: {
            title: { display: true, text: 'Llegadas' },
            beginAtZero: true,
          },
        },
      },
    };

    this.lineChart = new Chart(this.lineCanvas.nativeElement, config);
  }

  updateChart(label: string, value: number) {
    const maxPoints = 10; // máximo de puntos visibles

    if (this.lineChart.data.labels) {
      this.lineChart.data.labels.push(label);
      (this.lineChart.data.datasets[0].data as number[]).push(value);

      // Elimina el primer dato si se pasa del límite
      if (this.lineChart.data.labels.length > maxPoints) {
        this.lineChart.data.labels.shift();
        (this.lineChart.data.datasets[0].data as number[]).shift();
      }
    }

    this.lineChart.update();
  }
}
