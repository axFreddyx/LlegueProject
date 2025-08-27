import { Component, OnInit, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { InfiniteScrollCustomEvent, OverlayEventDetail } from '@ionic/core/components';
import { ApiService } from 'src/app/services/api.service';
import { Storage } from '@ionic/storage-angular';
import { IonAlert, ToastController } from '@ionic/angular';
import { IonModal } from '@ionic/angular/common';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment'; // ✅ NUEVO

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.page.html',
  styleUrls: ['./ver.page.scss'],
  standalone: false,
  // schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VerPage implements OnInit {

  @ViewChild('modal') modal!: IonModal;
  @ViewChild('deleteAlert') deleteAlert?: IonAlert;

  private readonly assetsBase = environment.apiUrl.replace(/\/api\/?$/, ''); // ✅ NUEVO

  isModalOpen = false;
  isModalOpenINE = false;
  currentPersonaINE: any = null;// Variable para la persona seleccionada
  personas: any[] = [];
  salones: any[] = [];
  alumnos: any[] = [];
  persona: any = [];
  token = "";
  idPersona!: number;
  cantidadPersonas = 0;

  isMobile: boolean = false;

  // Variables de filtro
  // Filtros y listas para cuentas confirmadas
  filterNombreConfirmadas: string = '';
  filterUsernameConfirmadas: string = '';
  filterEmailConfirmadas: string = '';
  filteredPersonasConfirmadas: any[] = [];

  // Filtros y listas para cuentas no confirmadas
  filterNombreNoConfirmadas: string = '';
  filterUsernameNoConfirmadas: string = '';
  filterEmailNoConfirmadas: string = '';
  filteredPersonasNoConfirmadas: any[] = [];

  // Paginación
  pageSize: number = 25; // Cantidad de elementos por página  
  numItems: number = 0; // Offset actual

  // searchTerm: string = '';
  filteredSalones: any[] = [];
  searchTerm: string = ''; // Para salón
  alumnoSearchTerm: string = '';
  alumnoSeleccionado: any = null;

  personasSeleccionados: any[] = [];  //Selected section

  isSelecting = false; //Selected section
  allSelected = false; //Selected section

  alertHeaderDelete = "";

  alertButtons = [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Confirmar', role: 'confirm', handler: () => this.asignarAlumnos() }
  ];
  alertButtonsDelete = [
    { text: 'Cancelar', role: 'cancel' },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: () => {
        if (this.persona) {
          this.eliminar(this.persona);
          this.persona = null;
        } else if (this.personasSeleccionados.length > 0) {
          this.eliminarSeleccionados();
        }
      }
    }
  ];

  constructor(
    private api: ApiService,
    private storage: Storage,
    private toastController: ToastController,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  setOpen(isOpen: boolean, persona: [] = []) {
    this.isModalOpen = isOpen;
    this.persona = persona;
    console.log('Persona seleccionada:', this.persona);
  }

  openModalINE(persona: any) {
    this.currentPersonaINE = persona;
    this.isModalOpenINE = true;
  }

  // Cerrar modal
  setOpenINE(isOpen: boolean) {
    this.isModalOpenINE = isOpen;
    if (!isOpen) this.currentPersonaINE = null;
  }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.isModalOpen = false;
    this.isModalOpenINE = false;
    this.currentPersonaINE = null;
  }

  async ngOnInit() {
    this.token = await this.storage.get("token");
    this.changeResolution();
    this.detectDevice();
    this.getPersonasAutorizadas();
    this.getSalones();
  }

  filtrarPersonasConfirmadas() {
    const nombre = this.filterNombreConfirmadas.toLowerCase().trim();
    const username = this.filterUsernameConfirmadas.toLowerCase().trim();
    const email = this.filterEmailConfirmadas.toLowerCase().trim();

    this.filteredPersonasConfirmadas = this.personas
      .filter(p => p.confirmed)
      .filter(p =>
        p.nombre.toLowerCase().includes(nombre) &&
        p.username.toLowerCase().includes(username) &&
        p.email.toLowerCase().includes(email)
      );
  }

  filtrarPersonasNoConfirmadas() {
    const nombre = this.filterNombreNoConfirmadas.toLowerCase().trim();
    const username = this.filterUsernameNoConfirmadas.toLowerCase().trim();
    const email = this.filterEmailNoConfirmadas.toLowerCase().trim();

    this.filteredPersonasNoConfirmadas = this.personas
      .filter(p => !p.confirmed)
      .filter(p =>
        p.nombre.toLowerCase().includes(nombre) &&
        p.username.toLowerCase().includes(username) &&
        p.email.toLowerCase().includes(email)
      );
  }

  async getPersonasAutorizadas(event?: InfiniteScrollCustomEvent) {
    try {
      // Suponiendo que tu API soporte offset y limit
      const res: any = await this.api.getUsersByRole(3, this.numItems, this.pageSize);
      const nuevasPersonas = res.data || [];

      // Evitar duplicados usando el ID
      this.personas = [
        ...this.personas,
        ...nuevasPersonas.filter((np: any) => !this.personas.some(p => p.id === np.id))
      ];

      // Avanzar offset solo si hay nuevos elementos
      if (nuevasPersonas.length > 0) {
        this.numItems += this.pageSize;
      }

      // Limitar infinite scroll si la API devuelve total
      const total = res.data.meta?.pagination?.total ?? this.personas.length;

      if (event) {
        event.target.complete();
        if (this.personas.length >= total) {
          event.target.disabled = true;
        }
      }

      // Filtrar alumnos
      this.personas.forEach((persona: any) => {
        if (persona.alumnos && Array.isArray(persona.alumnos)) {
          persona.alumnos = persona.alumnos.filter((alumno: any) => alumno?.publishedAt != null);
        } else {
          persona.alumnos = [];
        }
      });

      this.filtrarPersonasConfirmadas();
      this.filtrarPersonasNoConfirmadas();

    } catch (err) {
      console.error('Error al obtener personas autorizadas:', err);
      if (!event) this.personas = [];
      if (event) event.target.complete();
    }
  }

  async getSalones(event?: InfiniteScrollCustomEvent) {
    const token = await this.storage.get('token');

    try {
      // Suponiendo que la API soporte offset y limit
      const res: any = await this.api.getSalones(token, this.numItems, this.pageSize);
      const nuevosSalones = res.data?.data || [];

      // Evitar duplicados usando ID
      this.salones = [
        ...this.salones,
        ...nuevosSalones.filter((np:any) => !this.salones.some(s => s.id === np.id))
      ];

      // Filtrar alumnos publicados
      this.salones.forEach((salon: any) => {
        salon.alumnos = Array.isArray(salon.alumnos)
          ? salon.alumnos.filter((a:any) => a.publishedAt != null)
          : [];
      });

      // Mostrar todos los salones filtrados inicialmente
      this.filteredSalones = [...this.salones];

      // Incrementar offset solo si llegaron nuevos elementos
      if (nuevosSalones.length > 0) this.numItems += this.pageSize;

      // Desactivar infinite scroll si ya no hay más
      const total = res.data?.meta?.pagination?.total ?? this.salones.length;
      if (event) {
        event.target.complete();
        if (this.salones.length >= total) event.target.disabled = true;
      }

    } catch (err) {
      console.error('Error al obtener salones:', err);
      if (event) event.target.complete();
    }
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

  async eliminarSeleccionados() {
    await Promise.all(this.personasSeleccionados.map(p =>
      this.api.deleteUser(p.id)
        .then(() => this.personas = this.personas.filter(per => per.id !== p.id))
        .catch(err => {
          console.error('Error deleting docente:', err);
          this.presentToast(`No se pudo eliminar a ${p.nombre}.`, 'error');
        })
    ));
    this.presentToast(`${this.personasSeleccionados.length} docente(s) eliminados.`, 'success');
    this.notSelectingPersonas();
  }

  // Toast helper
  private async presentToast(message: string, type: 'success' | 'error' = 'error') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'top',
      color: type === 'success' ? 'success' : 'danger'
    });
    await toast.present();
  }

  selectingPersonas() { //Selected section
    this.isSelecting = true;
  }

  selectPersonas(persona: any) { //Selected section
    const exists = this.personasSeleccionados.some(a => a.id === persona.id);
    this.personasSeleccionados = exists
      ? this.personasSeleccionados.filter(a => a.id !== persona.id)
      : [...this.personasSeleccionados, persona];
    persona.selected = !exists;
    this.allSelected = this.personas.length === this.personasSeleccionados.length;
  }

  notSelectingPersonas() { //Selected section
    this.isSelecting = false;
    this.allSelected = false;
    this.personasSeleccionados = [];
    this.personas.forEach(p => p.selected = false);
  }

  toggleSelectAll(event: any) { //Selected section
    const checked = event.detail.checked;
    this.allSelected = checked;
    this.personas.forEach(p => p.selected = checked);
    this.personasSeleccionados = checked ? [...this.personas] : [];
  }

  toggleSelectAllLabel() { //Selected section
    this.allSelected = !this.allSelected;
    this.toggleSelectAll({ detail: { checked: this.allSelected } });
  }

  openAlertDelete(persona: any = null) {
    // Establece el texto del header para la alerta
    this.alertHeaderDelete = persona ?
      `¿Eliminar a ${persona.nombre}?` :
      `¿Eliminar ${this.personasSeleccionados.length} personas seleccionadas?`;

    // Guarda la persona o personas seleccionadas para eliminar en una variable
    this.persona = persona;

    // Presenta la alerta y deja que el handler de confirmación se encargue de eliminar
    this.deleteAlert?.present();
  }

  redirect() {
    this.router.navigate(['/create/cuenta'], { queryParams: { role: 'persona_autorizada' } });
  }

  redirectToEditPersona(p: any) {
    this.router.navigate([`/editar/cuenta/${p.id}`], { queryParams: { role: 'persona_autorizada' } });
  }

  confirmar(p: any) {
    try {
      this.api.updateUser({ confirmed: true }, p.id);
      this.presentToast(`Cuenta de ${p.nombre} confirmada.`, 'success');
    } catch (error) {
      console.error('Error al confirmar:', error);
      this.presentToast('No se pudo confirmar la cuenta.', 'error');
    }
  }

  openModalVarios() {
    this.modal.present();
  }

  clickPersona_autorizada(perosna: any) { //Selected section
    this.selectPersonas(perosna);
  }

  openModal(persona: any) {
    this.persona = persona;
    this.idPersona = persona.documentId;
    this.modal.present();
  }

  cancel() {
    this.modal.dismiss();
    this.persona = null;
  }

  openAlert(salon: any) {
    // this.salon = salon;
    // this.data = { salon: salon.id };
    document.querySelector('ion-alert')?.present();
  }

  async eliminar(persona: any) {
    // Implementar llamada API para eliminar docente (similar a eliminar alumno)
    // Supongamos que tienes api.deleteUser:
    try {
      await this.api.deleteUser(persona.id);
      this.personas = this.personas.filter(p => p.id !== persona.id);
      this.getPersonasAutorizadas(); // Refresca la lista
      this.presentToast(`Docente ${persona.nombre} eliminado.`, 'success');
    } catch (err) {
      console.error('Error deleting docente:', err);
      this.presentToast('No se pudo eliminar el docente.', 'error');
    }
  }

  getFotoUrl(a: any): string | null { // ✅ NUEVO
    try {
      const f = a?.foto ?? a?.attributes?.foto;
      if (!f) return null;

      // Puede venir como {data:{attributes:{url, formats}}} o directo con {url, formats}
      const node = f?.data?.attributes ?? f?.attributes ?? f;
      if (!node) return null;

      // Prioriza thumbnail si existe; si no, usa url
      const url: string | undefined = node?.formats?.thumbnail?.url || node?.url;
      if (!url) return null;

      // Si es relativa (/uploads/...), anteponer host; si ya es absoluta, devolverla tal cual
      return url.startsWith('http') ? url : `${this.assetsBase}${url}`;
    } catch {
      return null;
    }
  }

  getFotoINE(user: any): string | null {
    try {
      const ineArray = user?.ine ?? user?.attributes?.ine;
      if (!ineArray || !ineArray.length) return null;

      // Tomamos la primera foto de INE
      const ine = ineArray[0];

      // Puede venir como {data:{attributes:{url}}} o directo
      const node = ine?.data?.attributes ?? ine?.attributes ?? ine;

      if (!node?.url) return null;

      return node.url.startsWith('http') ? node.url : `${this.assetsBase}${node.url}`;
    } catch (e) {
      console.error('Error obteniendo foto INE:', e);
      return null;
    }
  }

  changeResolution() {
    const resolution = window.matchMedia('(max-width: 768px)');

    // Asignamos el estado inicial 👇
    this.isMobile = resolution.matches;

    // Escuchamos cambios
    resolution.addEventListener('change', (event) => {
      this.isMobile = event.matches;
    });
  }

  detectDevice() {
    if (window.innerWidth <= 768) {
      this.isMobile = true;
    }
  }
}