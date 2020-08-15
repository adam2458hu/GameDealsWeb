import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Currency } from './currency';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
	private currencies: Currency[]=[];
	private currenciesReceived: boolean;

	constructor(private http: HttpClient) { 
		this.getCurrenciesFromDatabase().subscribe(
			(res: any)=>{
				res.forEach(currency=>{
					this.currencies.push({
						name: currency.name,
						rate: currency.rate,
						subCurrency: currency.subCurrency,
						symbol: currency.symbol,
						decimalPlaces: currency.decimalPlaces
					});
				});
				this.currenciesReceived = true;
			},
			(err)=>{
				console.log(err);
			});
	}

	areCurrenciesReceived(){
		return this.currenciesReceived;
	}

	getCurrenciesFromDatabase(){
		return this.http.get(environment.apiCurrenciesURL+'/');
	}

	getCurrency(name: String): Currency{
		let value;

		this.currencies.forEach(currency=>{
			if (currency.name === name){
				value = currency;
			}
		})

		return value;
	}

	getCurrencies(){
		return this.currencies;
	}

	currencyConverter(amount: number,from: String,to: String){
		let value=0;
		let fromCurrency = this.getCurrency(from);
		let toCurrency = this.getCurrency(to);

		if (toCurrency.subCurrency){
			value=(amount*(toCurrency.rate/fromCurrency.rate));
		} else {
			value=(Math.round(amount*(toCurrency.rate/fromCurrency.rate)));
		}

		return value;
	}
}
