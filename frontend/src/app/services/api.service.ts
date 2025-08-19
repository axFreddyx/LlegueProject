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
  private url = environment.apiUrl; // apiUrl: 'http://localhost:1337/api',

  constructor(private http: HttpClient, private storage: Storage) { this.initStorage(); }

  //#region Register y login

  async register(user: any, token: any) {
    return await axios.post(this.url + "/users", user, { headers: { Authorization: token } });
  }

  async crear_cuenta(data: any) {
    console.log(data)
    return await axios.post(this.url + "/users", data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }

  async subirArchivos(formData: FormData) {
    try {
      const response = await axios.post(this.url + '/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data; // array de archivos subidos
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      return [];
    }
  }

  private async initStorage() {
    await this.storage.create();
  }

  async CrearAutorizada(data: any) {
    return await axios.post(this.url + "/auth/local/register", data);

  }

  async login(data: any) {
    const res = await axios.post(this.url + "/auth/local", data);
    return res.data;
  }

  isLoggedIn(): boolean {
    const token = this.storage.get('token');
    if (!token) {
      return false;
    }
    return true;
  }

  //#endregion

  //#region Alumnos

  async getAlumnos(token: any) {
    return await axios.get(`${this.url}/alumnos?populate=*`, { headers: { Authorization: token } });
  }

  async getAlumno(id: any, token: string) {
    return await axios.get(`${this.url}/alumnos/${id}`, {
      headers: { Authorization: token },
      params: { populate: '*' }
    });
  }

  // async getAlumnoByDocente(id: any) {
  //   return await axios.get(`${this.url}/alumnos?filters[docentes][id][$eq]=${id}`)
  // }

  async createAlumno(data: any, token: string) {
    return await axios.post(`${this.url}/alumnos`, { data }, {
      headers: { Authorization: token }
    });
  }

  // -------------------------------

  async uploadFile(file: File, token: string) {
    const formData = new FormData();
    formData.append('files', file);

    const res = await axios.post(`${this.url}/upload`, formData, {
      headers: { Authorization: token }
    });

    return (res.data as any[])[0];
  }

  async createAlumnoConFoto(payload: any, file: File, token: string) {
    // 1) Subir la imagen
    const uploaded = await this.uploadFile(file, token);

    // 2) Crear el alumno ligando el id del archivo al campo "foto"
    // Si "foto" es single media: usar el id directamente
    // Si fuera multiple media, sería [uploaded.id]
    const data = { ...payload, foto: uploaded.id };

    return await this.createAlumno(data, token);
  }

  // ---------------------

  async updateAlumno(id: string, data: any, token: string) {
    return await axios.put(`${this.url}/alumnos/${id}`, { "data": data }, {
      headers: { Authorization: token }
    });
  }

  async deleteAlumno(id: string, token: string) {
    return await axios.delete(`${this.url}/alumnos/${id}`, { headers: { Authorization: token } });

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
    const token = await this.storage.get("token")
    const headers = { Authorization: token };
    const url = `${this.url}/users/me?populate[role]=*&populate[salon][populate]=alumnos&populate[alumnos][populate]=*&poulate[foto]=*`;

    return await axios.get(url, {
      headers: headers
    });
  }

  //Función para traer usuarios con rol específico

  // Glosario de roles con id:
  // 3: Persona Autorizada
  // 4: Docente
  // 5: Admin

  async getUsersByRole(id: number) {
    const token = await this.storage.get('token');
    const headers = { Authorization: token };
    let url = "";
    if (id === 3) {
      url += `${this.url}/users?filters[role][id][$eq]=${id}&populate[alumnos][populate]=*&populate[foto]=*&populate[ine]=*`;
    } else if (id === 4) {
      url += `${this.url}/users?filters[role][id][$eq]=${id}&populate[salon][populate]=*&populate[foto]=*`;
    } else if (id === 5) {
      url += `${this.url}/users?filters[role][id][$eq]=${id}`;
    }
    return await axios.get(url, { headers: headers });
  }

  async updateUser(data: any, id: any) {
    const token = await this.storage.get('token');
    return await axios.put(`${this.url}/users/${id}`, data, { headers: { Authorization: token } });
    // console.log(`${this.url}/users/${id}`, data);
  }

  async deleteUser(id: number) {
    const token = await this.storage.get('token');
    return await axios.delete(`${this.url}/users/${id}`, { headers: { Authorization: token } });
  }

  async getUserById(id: any, token: string) {
    return await axios.get(`${this.url}/users/${id}`, { headers: { Authorization: token } });
  }

  // crea una funcion que me traiga la foto del usuario

  //#endregion

  //#region Salones

  async getSalones(token: any) {
    return await axios.get(`${this.url}/salons?populate[alumnos][populate]=*&populate[docente]=true&populate[periodo]=true`, {
      headers: { Authorization: token }
    });
  }

  async verSalones(token: string) {
    return await axios.get(`${this.url}/salons`, {
      headers: { Authorization: `${token}` }
    });
  }

  async updateSalon(id: string, data: any, token: string) {
    return await axios.put(`${this.url}/salons/${id}`, { data: data }, {
      headers: { Authorization: token }
    });
  }

  async createSalon(data: any, token: string) {
    return await axios.post(`${this.url}/salons`, { data: data }, {
      headers: { Authorization: token }
    });
  }
  async deleteSalon(id: string, token: string) {
    return await axios.delete(`${this.url}/salons/${id}`, {
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

  async getLlegadasBySalon(id: string, token: any) {
    const url = `${this.url}/llegadas?filters[alumno][salon][documentId][$eq]=${id}&populate[alumno][populate]=*`;

    return await axios.get(url, {
      headers: {
        Authorization: token
      }
    });
  }

  async gestionarSalida(id: string, data: any, token: string) {
    return await axios.put(`${this.url}/llegadas/${id}`, {
      data: data
    }, {
      headers: { Authorization: token }
    });
  }

  async getLLegueGlobal(token: string) {
    return await axios.get(`${this.url}/llegadas`, {
      headers: { Authorization: `${token}` },
      params: {
        sort: 'createdAt:desc',
        populate: {
          alumno: {
            populate: {
              salon: {
                populate: '*'
              }
            }
          },
          docente: { populate: '*' },
          persona_autorizada: { populate: '*' }
        }
      }
    });
  }

  //#endregion

  //#region Roles
  async getUserRole(): Promise<string> {
    const token = await this.storage.get('token');

    if (!token) {
      return '';
    }

    try {
      const response: any = await axios.get(`${this.url}/users/me?populate=role`, {
        headers: { Authorization: token }
      });

      return response.data.role.type.toString();
    } catch (error) {
      console.error('Error fetching user role:', error);
      return '';
    }
  }

  async getRoles(token: any) {
    return await axios.get(`${this.url}/users-permissions/roles`, { headers: { Authorization: token } });
  }

  //#endregion
  async isAuthenticated(): Promise<boolean> {
    return !!this.storage.get("token");
  }

  //#region Periodos
  async getPeriodos(token: any) {
    return await axios.get(`${this.url}/periodos`,
      {
        headers: { Authorization: token },
        params: {
          sort: 'createdAt:desc',
          populate: '*'
        }
      });
  }

  async createPeriodos(data: any, token: any) {
    return await axios.post(`${this.url}/periodos`, { data }, { headers: { Authorization: token } })
  }

  async updatePeriodo(id: any, data: any, token: any) {
    return await axios.put(`${this.url}/periodos/${id}`, { data }, { headers: { Authorization: token } })
  }

  async deletePeriodo(id: any, token: any) {
    return await axios.delete(`${this.url}/periodos/${id}`, { headers: { Authorization: token } })
  }
  //#endregion

  //#region Fredy checa esto

  recuperarPassword(email: string) {
    return this.http.post(`${this.url}/auth/forgot-password`, { email }).toPromise();
  }
  //#endregion

  // ---------------------------------

  async getLlegadasPorRango(inicioISO: string, finISO: string, token: string) {
    return await axios.get(`${this.url}/llegadas`, {
      headers: { Authorization: token },
      params: {
        'filters[createdAt][$gte]': inicioISO,
        'filters[createdAt][$lte]': finISO,
        'pagination[pageSize]': 1000,
        'sort': 'createdAt:asc'
        // 'populate[docente]': true,
        // 'populate[persona_autorizada]': true,
        // 'populate[alumno][populate]': 'salon',
      }
    });
  }


}
