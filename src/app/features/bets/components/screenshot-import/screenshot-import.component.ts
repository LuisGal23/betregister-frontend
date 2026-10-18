import {Component, inject, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../../../../core/services/api.service';
import type {SelectionDetail} from '../../models/selection-detail';
export interface ScreenshotDraft { house:string|null; currency:'MXN'|'USD'|null; bet_type:'simple'|'parlay'|'same_game'|null; stake:number|null; odds:number|null; bonus:number|null; selections:{event:string|null;sport:string|null;market:string|null;odds:number|null;detail:SelectionDetail|null}[];warnings:string[] }
@Component({selector:'app-screenshot-import',imports:[FormsModule],templateUrl:'./screenshot-import.component.html'})
export class ScreenshotImportComponent {
 api=inject(ApiService); draft=output<ScreenshotDraft>(); busy=signal(false); error=signal(''); result=signal<ScreenshotDraft|null>(null); configured=signal<boolean|null>(null); image=''; fileName=''; consent=false;
 constructor(){this.api.request<{configured:boolean}>('/import/screenshot/status').then(r=>this.configured.set(r.configured)).catch(()=>this.error.set('No pudimos consultar la disponibilidad.'))}
 async choose(event:Event){
  this.error.set('');this.result.set(null);this.image='';this.fileName='';
  const f=(event.target as HTMLInputElement).files?.[0]; if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>2000000){this.error.set('Usa PNG, JPG o WebP de hasta 2 MB.');return;}
  this.fileName=f.name;
  try {this.image=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(f)});}catch{this.error.set('No se pudo abrir la imagen.')}
 }
 async read(){if(!this.image||!this.consent||this.busy())return;this.busy.set(true);this.error.set('');this.result.set(null);
 try{this.result.set(await this.api.request<ScreenshotDraft>('/import/screenshot',{image:this.image,consent:true},55000));this.image='';}catch(e){this.error.set(e instanceof Error?e.message:'No se pudo leer.')}finally{this.busy.set(false)}
 }
}
