import { Component, OnInit, Input } from '@angular/core';
import { Chart } from 'chart.js';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {
	@Input() genreStatistics;
	@Input() uniqueWatchedGenres;

	constructor(
		private gameService: GameService
	) { }

	ngOnInit() {
		let viewCounts=[];
		let colors=['#001f3f','#0074D9','#7FDBFF','#39CCCC','#3D9970','#2ECC40',
		'#01FF70','#FFDC00','#FF851B','#FF4136','#85144b','#F012BE','#B10DC9','#111111','#AAAAAA','#DDDDDD'];
		this.genreStatistics.forEach(genre=>viewCounts.push(genre.viewCount));
		var chart = new Chart("myChart", {
		    type: 'doughnut',
		    data: {
			        labels: this.uniqueWatchedGenres,
			        datasets: [{
			            label: 'Legnézettebb műfajok',
			            backgroundColor: colors,
			            borderColor: colors,
			            data: viewCounts
			        }]
			    },

			    options: {
			    	legend: {
			            display: true,
			            labels: {
			                fontColor: '#000000'
			            }
			        }
			    }
		});
	}

	getRecommendedGames(){
		return this.gameService.getRecommendedGames();
	}

}
