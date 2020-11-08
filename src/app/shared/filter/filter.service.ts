import { Injectable } from '@angular/core';
import { Filter } from './filter';
import { CurrencyService } from '../currency/currency.service';
import { Store } from '../store/store';
import { StoreService } from '../store/store.service';
import { CookieService } from '../cookie/cookie.service';
import { UserService } from '../user/user.service';
 
@Injectable({
  providedIn: 'root'
})
export class FilterService {
	filter: Filter;
	private filterOpened: boolean = false;
	isAllSelected: boolean = true;
	private allStores: {name: String,isSelected: Boolean}[] = [];

	constructor(
		private userService: UserService,
		private cookieService: CookieService,
		private currencyService: CurrencyService,
		private storeService: StoreService
	) {
		this.filter = new Filter();
		this.storeService.getStoresFromDatabase().subscribe(
			(res: any)=>{
				res.forEach(store=>{
					this.storeService.addStore(store);
				})
				this.populateStores();
				this.storeService.setStoresReceived(true);
			},
			(err)=>{
				console.log(err);
			})
	}

	toggleFilter(){
		this.filterOpened = !this.filterOpened;
	}

	populateStores(){
		this.storeService.getStores().forEach(store=>{
			this.allStores.push({
				name: store.name,
				isSelected : true
			});
		})
	}

	onCurrencyChange(value){
		const prices = ["minSpecialPrice","maxSpecialPrice","minOriginalPrice","maxOriginalPrice"];
		Object.keys(this.filter).forEach(key=>{
			if (this.filter[key]!=null && prices.includes(key)){
				this.filter[key]=this.currencyService.currencyConverter(this.filter[key],this.filter.currencyPrevious,this.filter.currency);
				if (this.filter.currency=='EUR'){
					this.filter[key]=this.filter[key].toFixed(this.filter.decimalPlaces);
				}
			}
		})

		this.currencyService.getCurrencies().forEach(currency=>{
			if (currency.name==value){
				this.filter.symbol = currency.symbol;
				this.filter.decimalPlaces = currency.decimalPlaces;
				this.cookieService.setCurrencyCookie(JSON.stringify({
					code: currency.name,
					symbol: currency.symbol,
					decimalPlaces: currency.decimalPlaces
				}));
			}
		})

		this.filter.currencyPrevious = this.filter.currency;
	}

	sortTable(sortBy: String){
		if (sortBy===this.filter.sortBy){
			this.filter.direction*=-1;
		} else {
			this.filter.sortBy = sortBy;
			this.filter.direction=1;
		}

		this.filter.gameRequestOffset = 0;
	}

	applyFilter(){
		this.filter.gameRequestOffset=0;

		this.filter.selectedStores = [];
		this.allStores.forEach(store=>{
			if (store.isSelected){
				this.filter.selectedStores.push(store.name);
			}
		})
	}

	increaseOffset(){
		this.filter.gameRequestOffset+=this.filter.gamesPerRequest;
	}

	resetFilter(){
		this.filter.reset(this.filter.currency,this.filter.currencyPrevious,this.filter.symbol,this.filter.decimalPlaces);
		this.setLocalCurrency();
	}

	selectAllStores(){
		if (this.isAllSelected){
			this.allStores.forEach(store=>{
				store.isSelected = false;
			})
		} else {
			this.allStores.forEach(store=>{
				store.isSelected = true;
			})
		}

		this.isAllSelected=!this.isAllSelected;
	}

	selectStore(storeName){
		this.isAllSelected=false;
		this.allStores.forEach(store=>{
			if (store.name==storeName){
				store.isSelected = !store.isSelected;
			}
		})
	}

	getAllStores(){
		return this.allStores;
	}

	isFilterOpened(){
		return this.filterOpened;
	}

	getIsAllSelected(){
		return this.isAllSelected;
	}

	setLocalCurrency(){
		let localCurrency=localStorage.getItem('currency');
		if (localCurrency){
			this.filter.currency = JSON.parse(localCurrency).code;
			this.filter.symbol = JSON.parse(localCurrency).symbol;
			this.filter.decimalPlaces = JSON.parse(localCurrency).decimalPlaces;
		} else {
			this.userService.getIPAddress().subscribe(
				(res: any)=>{
					this.getGeoLocation(res.ip);
				},
				(err)=>{
					console.log(err);
				});
		}
	}

	getGeoLocation(ip: string){
		this.userService.getGeoLocation(ip).subscribe(
			(res: any)=>{
				this.currencyService.getCurrencies().forEach(currency=>{
					if (currency.name==res.currency.code){
						this.filter.currency = res.currency.code;
						this.filter.symbol = currency.symbol;
						this.filter.decimalPlaces = currency.decimalPlaces;

						if (this.cookieService.getConsent().functional) {
							localStorage.setItem('currency',JSON.stringify({
								code: res.currency.code,
								symbol: currency.symbol,
								decimalPlaces: currency.decimalPlaces
							}))
						}
					}
				})	
			},
			(err)=>{
				console.log(err);
			});
	}
}
