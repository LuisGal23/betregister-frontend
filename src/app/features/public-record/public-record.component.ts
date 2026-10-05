import {Component,inject,signal} from '@angular/core';
import {DatePipe,DecimalPipe} from '@angular/common';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {ApiService} from '../../core/services/api.service';
interface RecordPage {name:string;notice:string;total:number;tickets:{id:number;event:string;bet_type:string;stake:number;odds:string;bonus:number;status:string;payout:number;currency:string;registered_at:string;declared_start:string;results:{at:string;status:string;payout:number}[]}[];totals:Record<string,{count:number;profit:number}>}
@Component({selector:'app-public-record',imports:[DatePipe,DecimalPipe,RouterLink],templateUrl:'./public-record.component.html',styleUrl:'./public-record.component.css'})
export class PublicRecordComponent {
 api=inject(ApiService);token=inject(ActivatedRoute).snapshot.paramMap.get('token')??'';page=signal<RecordPage|null>(null);error=signal('');busy=signal(false);offset=0;
 labels:Record<string,string>={pending:'Pendiente',won:'Ganada',lost:'Perdida',void:'Anulada',cashout:'Cashout'};
 constructor(){void this.load(0)}
 async load(offset:number){this.busy.set(true);this.error.set('');try{this.page.set(await this.api.request<RecordPage>('/public-record/'+encodeURIComponent(this.token)+'?offset='+offset));this.offset=offset;}catch(e){this.error.set(e instanceof Error?e.message:'No se pudo cargar el perfil.')}finally{this.busy.set(false)}}
}
