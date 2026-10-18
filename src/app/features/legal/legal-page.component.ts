import {Component,inject,signal,ElementRef,viewChild} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../../core/services/api.service';
import {LedgerState} from '../../core/services/ledger-state.service';
@Component({selector:'app-legal-page',imports:[RouterLink,FormsModule],templateUrl:'./legal-page.component.html'})
export class LegalPageComponent {
 route=inject(ActivatedRoute);kind=this.route.snapshot.data['kind'] as string;api=inject(ApiService);vm=inject(LedgerState);
 info=signal({operator:'Luis Angel Perez Gallardo',email:'perezgallardoluis19@gmail.com',version:'2026-10-05'});
 password='';confirmation='';busy=signal(false);error=signal('');deleted=signal(false);
 dialog=viewChild<ElementRef<HTMLDialogElement>>('deletionDialog');
 constructor(){this.api.request<typeof this.info extends never?never:{operator:string;email:string;version:string}>('/legal').then(v=>this.info.set(v)).catch(()=>{})}
 mail(){return 'mailto:'+this.info().email+'?subject=BetRegister%20-%20Privacidad%20o%20eliminacion%20de%20cuenta'}
 open(){this.password='';this.confirmation='';this.error.set('');this.dialog()?.nativeElement.showModal()}
 close(event?:Event){if(this.busy()){event?.preventDefault();return}this.dialog()?.nativeElement.close();this.password=''}
 async remove(){if(this.confirmation!=='ELIMINAR MI CUENTA'||this.busy())return;this.busy.set(true);this.error.set('');try{await this.api.request('/account/delete',{password:this.password,confirmation:this.confirmation});this.dialog()?.nativeElement.close();this.password='';this.vm.reset();this.deleted.set(true);}catch(e){this.error.set(e instanceof Error?e.message:'No se pudo completar la eliminación.')}finally{this.busy.set(false)}}
}
