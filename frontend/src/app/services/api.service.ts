import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient, private storage: Storage) { this.initStorage(); }

  //#region Register y login

  async register(username: string, email: string, password: string, nombre: string) {
    return await axios.post(this.url + "/auth/local/register", { username, email, password, nombre });
  }
  private async initStorage() {
    await this.storage.create(); // 👈 esto evita que `storage.get` falle
  }

  async CrearAutorizada(data: any) {
    return await axios.post(this.url + "/auth/local/register", data);
  }

  async login(data: any) {
    const res = await axios.post(this.url + "/auth/local", data);
    return res.data;
  }

  //#endregion

  //#region Alumnos

  async getAlumnos() {
    return await axios.get(`${this.url}/alumnos?populate=*`);
  }

  async getAlumno(id: string) {
    return await axios.get(`${this.url}/alumnos/${id}?populate=*`);
  }

  // async getAlumnoByDocente(id: any) {
  //   return await axios.get(`${this.url}/alumnos?filters[docentes][id][$eq]=${id}`)
  // }

  async createAlumno(data: any) {
    return await axios.post(`${this.url}/alumnos`, { data });
  }

  async updateAlumno(id: string, data: any) {
    return await axios.put(`${this.url}/alumnos/${id}`, { data });
  }

  async deleteAlumno(id: string) {
    return await axios.delete(`${this.url}/alumnos/${id}`);
  }

  async asignarAlumnosAPersona(idPersona: number, alumno: number[], token: string) {
    return await axios.put(`${this.url}/users/${idPersona}`, {
      alumnos: alumno,
    },
      { headers: { Authorization: token } });
  }

  //#endregion

  //#region Usuarios
  async getUserByMe() {
    const token = await this.storage.get('token');
    const headers = { Authorization: token };
    const url = `${this.url}/users/me?populate[role]=*&populate[salon][populate]=alumnos&populate[alumnos]=*`;

    return await axios.get(url, {
      headers: headers
    });
  }

  //Función para traer usuarios con rol de "Persona Autorizada"
  async getUsersByRole(id: number) {
    const token = await this.storage.get('token');
    const headers = { Authorization: token };
    const url = `${this.url}/users?filters[role][id][$eq]=${id}&populate[alumnos][populate]=*&populate[foto]=*`;

    return await axios.get(url, { headers: headers });
  }

  //#endregion

  //#region Salones

  async getSalones(token: any) {
    return await axios.get(`${this.url}/salons?populate[alumnos][populate]=*&populate[docente]=true&populate[periodo]=true`, {
      headers: { Authorization: token }
    });
  }

  //#endregion

  //#region Llegue
  async llegue(alumnoId: string, autorizadaId: string, token: string) {
    return await axios.post(`${this.url}/llegadas`, {
      data: {
        alumno: alumnoId,
        persona_autorizada: autorizadaId,
      }
    }, {
      headers: { Authorization: token }
    }); 
  }

  async getLlegadasBySalon(id:number, token: string) {
    return await axios.get(`${this.url}/llegadas?filters[salon][id][$eq]=${id}&populate[alumno][populate]=foto&populate[persona_autorizada][populate]=foto`, {
      headers: { Authorization: token }
    });
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.storage.get("token");
  }
}