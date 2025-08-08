import { Component, OnInit } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false
})
export class VerPage implements OnInit {

  isModalOpen = false;
  personas: any[] = [];
  salones: any[] = [];
  alumnos: any[] = [];
  persona: any = [];

  // searchTerm: string = '';
  filteredSalones: any[] = [];
  searchTerm: string = ''; // Para salón
  alumnoSearchTerm: string = '';
  alumnoSeleccionado: any = null;


  constructor(
    private api: ApiService,
    private storage: Storage,
  ) { }

  setOpen(isOpen: boolean, persona: [] = []) {
    this.isModalOpen = isOpen;
    this.persona = persona;
    console.log('Persona seleccionada:', this.persona);
  }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.isModalOpen = false;
  }

  async ngOnInit() {
    this.getPersonasAutorizadas();
    this.getSalones();
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

  async getSalones() {
    const token = await this.storage.get('token');
    await this.api.getSalones(token).then((res: any) => {
      if (res?.data) {
        this.salones = res.data.data;

        // Filtra alumnos publicados
        this.salones.forEach((salon: any) => {
          if (salon.alumnos && Array.isArray(salon.alumnos)) {
            salon.alumnos = salon.alumnos.filter((alumno: any) => alumno?.publishedAt != null);
          } else {
            salon.alumnos = [];
          }
        });

        // Al principio mostramos todos
        this.filteredSalones = [...this.salones];
      } else {
        console.warn('No se encontró .data en la respuesta de salones:', res);
      }
    }).catch((err: any) => {
      console.error('Error al obtener salones:', err);
    });
  }

  filtrarSalones() {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredSalones = this.salones.filter((s: any) =>
      s.aula.toLowerCase().includes(term) ||
      s.grupo.toLowerCase().includes(term) ||
      String(s.grado).includes(term)
    );
  }

  filtrarAlumnos(alumnos: any[]): any[] {
    const term = this.alumnoSearchTerm.toLowerCase().trim();
    if (!term) return alumnos;

    return alumnos.filter(alumno =>
      alumno.nombre.toLowerCase().includes(term) ||
      alumno.apellidos.toLowerCase().includes(term)
    );
  }

  selectAlumnos(alumno: any) {
    const yaExiste = this.alumnos.some(a => a.id === alumno.id);
    if (!yaExiste) {
      this.alumnos.push(alumno);
      // this.alumnoSeleccionado = "Seleccionado"; // Actualiza el seleccionado
    }
  }

  async quitarAlumno(id: number) {
    // 1. Quitar localmente del arreglo de seleccionados
    this.alumnos = this.alumnos.filter(a => a.id !== id);

    // 2. Quitar localmente del arreglo de alumnos asignados
    if (this.persona && Array.isArray(this.persona.alumnos)) {
      this.persona.alumnos = this.persona.alumnos.filter((a: any) => a.id !== id);
    }

    // 3. Construir lista actualizada de IDs de alumnos que quedarán asignados
    const alumnoIds = this.getTodosLosAlumnos().map(a => a.id);

    // 4. Obtener el token y el id de la persona autorizada
    const token = await this.storage.get('token');
    const idPersona = this.persona.id;

    try {
      // 5. Llamar a la API para actualizar alumnos asignados en backend
      await this.api.asignarAlumnosAPersona(idPersona, alumnoIds, token);

      // 6. Refrescar la lista de personas autorizadas y modal si quieres
      this.personas = [];
      await this.getPersonasAutorizadas();

    } catch (error) {
      console.error('Error al quitar alumno en la base de datos:', error);
    }
  }

  async asignarAlumnos() {
    const alumnosFinales = this.getTodosLosAlumnos(); // todos los actuales sin duplicados
    const alumnoIds = alumnosFinales.map(a => a.id);
    const idPersona = this.persona.id;
    const token = await this.storage.get('token');

    await this.api.asignarAlumnosAPersona(idPersona, alumnoIds, token)
      .then(res => {
        console.log('Alumnos asignados:', res);
        this.setOpen(false); // Cierra modal
        this.alumnos = [];   // Limpia los seleccionados nuevos
        this.personas = [];  // Refresca lista
        this.getPersonasAutorizadas(); // Actualiza desde la BD
      })
      .catch(err => {
        console.error('Error al asignar alumnos:', err);
      });
  }

  getTodosLosAlumnos(): any[] {
    const asignados = Array.isArray(this.persona?.alumnos) ? this.persona.alumnos : [];
    const ids = new Set<number>();
    const combinados = [...asignados, ...this.alumnos];
    console.log('Combinados:', combinados);
    return combinados.filter(a => {
      if (!ids.has(a.id)) {
        ids.add(a.id);
        return true;
      }
      return false;
    });

    return []
  }

  esAlumnoAsignadoOSeleccionado(id: number): boolean {
    const asignadosBD = this.persona.alumnos || [];
    const seleccionados = this.alumnos || [];
    return asignadosBD.some((a: any) => a.id === id) || seleccionados.some(a => a.id === id);
  }

  esAlumnoAsignadoBD(id: number): boolean {
    return this.persona.alumnos?.some((a: any) => a.id === id);
  }
}