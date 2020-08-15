import { Injectable } from '@angular/core';
import { Filter } from './filter';
import { CurrencyService } from '../currency/currency.service';
import { StoreService } from '../store/store.service';
 
@Injectable({
  providedIn: 'root'
})
export class FilterService {
	filter: Filter = {
		name: null,
		minSpecialPrice: null,
		maxSpecialPrice: null,
		minOriginalPrice: null,
		maxOriginalPrice: null,
		minDiscountPercent: null,
		maxDiscountPercent: null,
		minMetascore: null,
		maxMetascore: null,
		gamesPerRequest: 10,
		gameRequestOffset: 0,
		selectedStores: [],
		direction: 1,
		sortBy: 'name',
		currency: 'EUR',
		currencyPrevious: 'EUR',
		symbol: '€',
		decimalPlaces: 2
	}
	private filterOpened: boolean = true;
	isAllSelected: boolean = true;
	private allStores: {name: String,isSelected: Boolean}[] = [];

	constructor(
		private currencyService: CurrencyService,
		private storeService: StoreService
	) {
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
		console.log(this.allStores);
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
		console.log(this.filter.selectedStores);
	}

	increaseOffset(){
		this.filter.gameRequestOffset+=this.filter.gamesPerRequest;
	}

	resetFilter(){

		this.filter = {
			name: null,
			minSpecialPrice: null,
			maxSpecialPrice: null,
			minOriginalPrice: null,
			maxOriginalPrice: null,
			minDiscountPercent: null,
			maxDiscountPercent: null,
			minMetascore: null,
			maxMetascore: null,
			selectedStores: [],
			gamesPerRequest: 10,
			gameRequestOffset: 0,
			direction: 1,
			sortBy: 'name',
			currency: this.filter.currency,
			currencyPrevious: this.filter.currencyPrevious,
			symbol: this.filter.symbol,
			decimalPlaces: this.filter.decimalPlaces
		}
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
		console.log(this.allStores);
	}

	selectStore(storeName){
		this.isAllSelected=false;
		this.allStores.forEach(store=>{
			if (store.name==storeName){
				store.isSelected = !store.isSelected;
			}
		})
		console.log(this.allStores);
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
}
