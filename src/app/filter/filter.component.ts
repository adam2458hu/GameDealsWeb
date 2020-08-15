import { Component, EventEmitter, OnInit,Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Filter } from '../shared/filter/filter';
import { FilterService } from '../shared/filter/filter.service';
import { CurrencyService } from '../shared/currency/currency.service';
import { StoreService } from '../shared/store/store.service';

@Component({
  selector: 'tr[app-filter]',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
	@Output() filtered = new EventEmitter();

	constructor(
		private filterService: FilterService,
		private currencyService: CurrencyService,
		private storeService: StoreService
	) { }

	ngOnInit() {
	}

	onSubmit(form: NgForm){
		this.filtered.emit();
	}

	getFilterService(){
		return this.filterService;
	}

	getCurrencies(){
		return this.currencyService.getCurrencies();
	}

	getAllStores(){
		return this.filterService.getAllStores();
	}

	selectAllStores(){
		this.filterService.selectAllStores();
	}

	selectStore(storeName){
		this.filterService.selectStore(storeName);
	}

}
