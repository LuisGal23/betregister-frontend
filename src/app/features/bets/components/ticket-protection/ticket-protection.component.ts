import {Component,inject,input,signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ApiService} from '../../../../core/services/api.service';
import {LedgerState} from '../../../../core/services/ledger-state.service';
export interface Protection {enabled:boolean;hours:6|12;until:number;reason:string}
@Component({selector:'app-ticket-protection',imports:[DatePipe,RouterLink],templateUrl:'./ticket-protection.component.html'})
export class TicketProtectionComponent {
 api=inject(ApiService);vm=inject(LedgerState);league=input('');betType=input('simple');protection=signal<Protection|null>(null);error=signal('');busy=signal(false);
 constructor(){void this.load()}
 async load(){try{this.protection.set(await this.api.request<Protection>('/discipline'));this.error.set('')}catch{this.error.set('No se pudo consultar la pausa. El servidor volverá a comprobarla al guardar.')}}
 locked(){return (this.protection()?.until??0)>Date.now()/1000}
 async pause(){this.busy.set(true);try{this.protection.set(await this.api.request<Protection>('/discipline/pause',{hours:6}));this.error.set('')}catch(e){this.error.set(e instanceof Error?e.message:'No se pudo activar la pausa.')}finally{this.busy.set(false)}}
 warning(){
  const hour=Number(new Intl.DateTimeFormat('en',{hour:'2-digit',hourCycle:'h23',timeZone:this.vm.data().profile.timezone}).format(new Date()));
  if(this.betType()==='simple'||(hour>=6&&hour<22))return '';
  const rows=this.vm.data().bets.filter(b=>b.league_tag===this.league()&&b.bet_type===this.betType()&&['won','lost'].includes(b.status));
  if(!rows.length)return 'Es una combinada nocturna y no tienes resultados comparables registrados para esta liga. Revisa el importe y considera una pausa.';
  const lost=rows.filter(b=>b.status==='lost').length;
  return rows.length>=10&&lost/rows.length>=.75?`En esta liga y tipo de ticket perdiste ${lost} de ${rows.length} apuestas (${Math.round(lost/rows.length*100)}%). Es de noche: revisa tu decisión con calma. El historial no predice este resultado.`:'';
 }
}
