import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {ApiService} from '../../../../core/services/api.service';
import type {Protection} from '../../../bets/components/ticket-protection/ticket-protection.component';
interface PublicProfile {enabled:boolean;name:string;token:string}
@Component({selector:'app-smart-settings',imports:[FormsModule,DatePipe],templateUrl:'./smart-settings.component.html'})
export class SmartSettingsComponent {
 api=inject(ApiService);protection=signal<Protection|null>(null);profile=signal<PublicProfile|null>(null);enabled=false;hours=6;publicEnabled=false;name='';busy=signal(false);message=signal('');error=signal('');loading=signal(true);
 constructor(){void this.load()}
 async load(){this.loading.set(true);this.error.set('');try{const [s,p]=await Promise.all([this.api.request<Protection>('/discipline'),this.api.request<PublicProfile>('/public-profile')]);this.protection.set(s);this.enabled=s.enabled;this.hours=s.hours;this.profile.set(p);this.publicEnabled=p.enabled;this.name=p.name;}catch{this.error.set('No se pudieron cargar los ajustes.')}finally{this.loading.set(false)}}
 locked(){return (this.protection()?.until??0)>Date.now()/1000}
 link(){return location.origin+'/p/'+this.profile()?.token}
 async save(kind:'protection'|'profile'){this.busy.set(true);this.error.set('');this.message.set('');try{if(kind==='protection'){this.protection.set(await this.api.request<Protection>('/discipline',{enabled:this.enabled,hours:Number(this.hours)}));}else{this.profile.set(await this.api.request<PublicProfile>('/public-profile',{enabled:this.publicEnabled,name:this.name}));}this.message.set('Configuración guardada.');}catch(e){this.error.set(e instanceof Error?e.message:'No se pudo guardar.')}finally{this.busy.set(false)}}
}
