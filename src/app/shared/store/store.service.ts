import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Store } from './store';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
	private stores: Store[]=[];
	private storesReceived: boolean;

	constructor(
		private http: HttpClient
	) { }

	getStoresFromDatabase(){
		return this.http.get(environment.apiStoresURL+'/');
	}

	getStores(){
		return this.stores;
	}

	addStore(store){
		this.stores.push({
			name : store.name
		})
	}

	areStoresReceived(){
		return this.storesReceived;
	}

	setStoresReceived(value){
		this.storesReceived = value;
	}
}
