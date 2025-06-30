import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    // let options = new HttpHeaders({
    //   'Authorization': 'Bearer ' + token
    // })
    return await axios.post(this.url + "/auth/local/register", data);
  }

  async login(data: any) {
    return await axios.post(this.url + "/auth/local", data);
  }

  //#endregion

  //#region Alumnos

  async getAlumnos() {
    return await axios.get(`${this.url}/alumnos?populate=*`);
  }

  async getAlumno(id: string) {
    return await axios.get(`${this.url}/alumnos/${id}?populate=*`);
  }

  async getAlumnoByDocente(id:any){
    return await axios.get(`${this.url}/alumnos?filters[docentes][id][$eq]=${id}`)
  }

  async createAlumno(data: any) {
    return await axios.post(`${this.url}/alumnos`, { data });
  }

  async updateAlumno(id: string, data: any) {
    return await axios.put(`${this.url}/alumnos/${id}`, { data });
  }

  async deleteAlumno(id: string) {
    return await axios.delete(`${this.url}/alumnos/${id}`);
  }

  //#endregion

  // async isAuthenticated() {
  //   // return !!localStorage.getItem("token");
  //   console.log(!!this.storage.get("token"));
  // }
  async isAuthenticated():Promise<boolean>{
    return !!this.storage.get("token");
  }
}