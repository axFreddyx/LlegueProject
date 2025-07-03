import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';

interface Alumno {
  id: number;
  nombre: string;
  grupo: string;
  foto: string;
  seleccionado?: boolean;
}

@Component({
  selector: 'app-alumnos',
  templateUrl: './alumnos.page.html',
  styleUrls: ['./alumnos.page.scss'],
  standalone: false
})
export class AlumnosPage implements OnInit {

  fechaHoy = new Date().toISOString().split('T')[0];

  alumnos: Alumno[] = [
    { id: 1, nombre: "Juan Pérez", grupo: "3°A", foto: "juan.jpg" },
    { id: 2, nombre: "María López", grupo: "3°A", foto: "maria.jpg" },
    { id: 3, nombre: "Pedro Sánchez", grupo: "4°B", foto: "pedro.jpg" }
  ];

  llegadas = [
    { alumno_id: 1, fecha: "2025-07-01" },
    { alumno_id: 1, fecha: "2025-07-02" }, // recogido hoy
    { alumno_id: 3, fecha: "2025-07-02" }  // recogido hoy
  ];

  recogidos: Alumno[] = [];
  pendientes: Alumno[] = [];

  constructor(private toastCtrl: ToastController) { }

  ngOnInit() {
    this.actualizarListas();
  }

  actualizarListas() {
    const idsRecogidosHoy = new Set(
      this.llegadas
        .filter(l => l.fecha === this.fechaHoy)
        .map(l => l.alumno_id)
    );

    this.recogidos = this.alumnos.filter(a => idsRecogidosHoy.has(a.id));
    this.pendientes = this.alumnos.filter(a => !idsRecogidosHoy.has(a.id));
  }

  confirmarLlegadas() {
    const nuevos = this.pendientes.filter(a => a.seleccionado);

    nuevos.forEach(a => {
      this.llegadas.push({ alumno_id: a.id, fecha: this.fechaHoy });
      a.seleccionado = false;
    });

    this.actualizarListas();
  }

  async dejarSalir(alumno: Alumno) {
    // Aquí podrías añadir lógica para registrar salida en base de datos

    // Por ahora, solo quitamos de la lista recogidos para simular que salió
    this.recogidos = this.recogidos.filter(a => a.id !== alumno.id);

    const toast = await this.toastCtrl.create({
      message: `${alumno.nombre} ha sido dejado salir.`,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    toast.present();
  }
}
