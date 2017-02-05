// Require Moment
//require('moment');

function tickerftn(theres,j,response) {

	var newres = theres;
	var ticker = newres[j];

	console.log(ticker);

	// URL CREATION
	var tickercode = ticker.get('Ticker');
	var month = '1';
	var day = '1';
	var year = '2013';

	var mom = new Date();

	var pmonth = mom.getMonth();
	var pday = mom.getDate();
	var pyear = mom.getFullYear();

	if (pday < 10) {day = '0' + day};
	if (month < 10) {month = '0' + month};

	var tickurl = 'https://www.quandl.com/api/v1/datasets/WIKI/' + tickercode + '.json?auth_token=hem8_xFEtq-ytQHrGMTF&trim_start=' + year + '-' + month + '-' + day;

	Parse.Cloud.httpRequest({url:tickurl}).then(function (res) {

	    var sh = res.data.data;

		// ANALYSIS LOOP
		for (var i = sh.length-1; i >= 0; i--) {

			if (i == sh.length-1) {
				var high = sh[i][11];
				var low = sh[i][11];
				var rangehigh = sh[i][11];
				var rangelow = sh[i][11];
				var supp = [];
				var resist = [];
				var tp = 0;
				var tv = 0;
				var tsupp = null;
				var tresist = null;
				var twentySum = [sh[i][11]/20];
				var fiftySum = [sh[i][11]/50];
				var hundySum = [sh[i][11]/100];
				var onefiftySum = [sh[i][11]/150];
				var twoSum = [sh[i][11]/200];
				var volSum = sh[i][12] / 50;
				var istwentySum = false;
				var isfiftySum = false;
				var istwoSum = false;
				var ishundySum = false;
				var isonefiftySum = false;
				var isvolSum = false;
				var hasresist = false;
				var hassupport = false;
			} else if (i < sh.length-1) {

				if (i < sh.length-201) {
					twentySum.push(twentySum[twentySum.length-1] + (sh[i][11]/20) - (sh[i+21][11]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (sh[i][11]/50) - (sh[i+51][11]/50));
					hundySum.push(hundySum[hundySum.length-1] + (sh[i][11]/100) - (sh[i+101][11]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (sh[i][11]/150) - (sh[i+151][11]/150));
					twoSum.push(twoSum[twoSum.length-1] + (sh[i][11]/200) - (sh[i+201][11]/200));
					istwoSum = true;
				} else if (i < sh.length-151) {
					twentySum.push(twentySum[twentySum.length-1] + (sh[i][11]/20) - (sh[i+21][11]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (sh[i][11]/50) - (sh[i+51][11]/50));
					hundySum.push(hundySum[hundySum.length-1] + (sh[i][11]/100) - (sh[i+101][11]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (sh[i][11]/150) - (sh[i+151][11]/150));
					twoSum.push(twoSum[twoSum.length-1] + (sh[i][11]/200));
					isonefiftySum = true;
				} else if (i < sh.length-101) {
					twentySum.push(twentySum[twentySum.length-1] + (sh[i][11]/20) - (sh[i+21][11]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (sh[i][11]/50) - (sh[i+51][11]/50));
					hundySum.push(hundySum[hundySum.length-1] + (sh[i][11]/100) - (sh[i+101][11]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (sh[i][11]/150));
					twoSum.push(twoSum[twoSum.length-1] + (sh[i][11]/200));
					ishundySum = true;
				} else if (i < sh.length-51) {
					twentySum.push(twentySum[twentySum.length-1] + (sh[i][11]/20) - (sh[i+21][11]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (sh[i][11]/50) - (sh[i+51][11]/50));
					hundySum.push(hundySum[hundySum.length-1] + (sh[i][11]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (sh[i][11]/150));
					twoSum.push(twoSum[twoSum.length-1] + (sh[i][11]/200));
					isvolSum = true;
					isfiftySum = true;
				} else if (i < sh.length-21) {
					twentySum.push(twentySum[twentySum.length-1] + (sh[i][11]/20) - (sh[i+21][11]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (sh[i][11]/50));
					hundySum.push(hundySum[hundySum.length-1] + (sh[i][11]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (sh[i][11]/150));
					twoSum.push(twoSum[twoSum.length-1] + (sh[i][11]/200));
					istwentySum = true;
				} else {
					twentySum.push(twentySum[twentySum.length-1] + (sh[i][11]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (sh[i][11]/50));
					hundySum.push(hundySum[hundySum.length-1] + (sh[i][11]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (sh[i][11]/150));
					twoSum.push(twoSum[twoSum.length-1] + (sh[i][11]/200));
				};

				if (i < 50) {
					volSum += sh[i][12] / 50;
				};

				if (sh[i][11] > high) {
					high = sh[i][11];
					//resist.unshift({'price':sh[i][11],'loc':i});
				} else if (sh[i][11] < low){
					low = sh[i][11];
				} else if (sh[i][11] < rangelow){
					rangelow = sh[i][11];
				} else if (sh[i][11] > rangehigh){
					rangehigh = sh[i][11];
				};

				
				if (i == 0) { // STOCK NOTIFICATIONS

					twentySum[twentySum.length-1] = +(twentySum[twentySum.length-1].toFixed(2));
					fiftySum[fiftySum.length-1] = +(fiftySum[fiftySum.length-1].toFixed(2));
					hundySum[hundySum.length-1] = +(hundySum[hundySum.length-1].toFixed(2));
					onefiftySum[onefiftySum.length-1] = +(onefiftySum[onefiftySum.length-1].toFixed(2));
					twoSum[twoSum.length-1] = +(twoSum[twoSum.length-1].toFixed(2));

					var maalerts = [];
					// 50 OVER 200
					if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 50/200 BEAR APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
						// 50/200 BULL APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 50/200 BEAR CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-2]/twoSum[twoSum.length-2] <= 1) {
						// 50/200 BULL CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					};

					// 50 OVER 100
					if (isfiftySum && ishundySum && fiftySum[fiftySum.length-1]/hundySum[hundySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/hundySum[hundySum.length-1] > 1 && fiftySum[fiftySum.length-5]/hundySum[hundySum.length-5] > 1.01) {
						// 50/100 BEAR APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '100',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && ishundySum && hundySum[hundySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && hundySum[hundySum.length-1]/fiftySum[fiftySum.length-1] > 1 && hundySum[hundySum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
						// 50/100 BULL APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '100',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && ishundySum && hundySum[hundySum.length-1]/fiftySum[fiftySum.length-1] > 1 && hundySum[hundySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 50/100 BEAR CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '100',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && ishundySum && fiftySum[fiftySum.length-1]/hundySum[hundySum.length-1] > 1 && fiftySum[fiftySum.length-2]/hundySum[hundySum.length-2] <= 1) {
						// 50/100 BULL CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '100',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					};

					// 50 OVER 150
					if (isfiftySum && isonefiftySum && fiftySum[fiftySum.length-1]/onefiftySum[onefiftySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && fiftySum[fiftySum.length-5]/onefiftySum[onefiftySum.length-5] > 1.01) {
						// 50/150 BEAR APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: onefiftySum[onefiftySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '150',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && isonefiftySum && onefiftySum[onefiftySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && onefiftySum[onefiftySum.length-1]/fiftySum[fiftySum.length-1] > 1 && onefiftySum[onefiftySum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
						// 50/150 BULL APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: onefiftySum[onefiftySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '150',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && isonefiftySum && onefiftySum[onefiftySum.length-1]/fiftySum[fiftySum.length-1] > 1 && onefiftySum[onefiftySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 50/150 BEAR CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: onefiftySum[onefiftySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '150',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && isonefiftySum && fiftySum[fiftySum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && fiftySum[fiftySum.length-2]/onefiftySum[onefiftySum.length-2] <= 1) {
						// 50/150 BULL CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: onefiftySum[onefiftySum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '150',
							lowmat: '50',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					};

					// 20 OVER 50
					if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 20/50 BEAR APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twentySum[twentySum.length-5] > 1.01) {
						// 20/50 BULL APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-2]/twentySum[twentySum.length-2] <= 1) {
						// 20/50 BEAR CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && twentySum[twentySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 20/50 BULL CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					};

					// 20 OVER 100
					if (ishundySum && istwentySum && twentySum[twentySum.length-1]/hundySum[hundySum.length-1] < 1.01 && twentySum[twentySum.length-1]/hundySum[hundySum.length-1] > 1 && hundySum[hundySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 20/100 BEAR APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '100',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (ishundySum && istwentySum && hundySum[hundySum.length-1]/twentySum[twentySum.length-1] < 1.01 && hundySum[hundySum.length-1]/twentySum[twentySum.length-1] > 1 && hundySum[hundySum.length-5]/twentySum[twentySum.length-5] > 1.01) {
						// 20/100 BULL APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '100',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (ishundySum && istwentySum && hundySum[hundySum.length-1]/twentySum[twentySum.length-1] > 1 && hundySum[hundySum.length-2]/twentySum[twentySum.length-2] <= 1) {
						// 20/100 BEAR CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '100',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (ishundySum && istwentySum && twentySum[twentySum.length-1]/hundySum[hundySum.length-1] > 1 && twentySum[twentySum.length-2]/hundySum[hundySum.length-2] <= 1) {
						// 20/100 BULL CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: hundySum[hundySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '100',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					};

					// 20 OVER 150
					// if (isonefiftySum && istwentySum && twentySum[twentySum.length-1]/onefiftySum[onefiftySum.length-1] < 1.01 && twentySum[twentySum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && onefiftySum[onefiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
					// 	// 20/150 BEAR APP ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '20',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// } else if (isonefiftySum && istwentySum && onefiftySum[onefiftySum.length-1]/twentySum[twentySum.length-1] < 1.01 && onefiftySum[onefiftySum.length-1]/twentySum[twentySum.length-1] > 1 && onefiftySum[onefiftySum.length-5]/twentySum[twentySum.length-5] > 1.01) {
					// 	// 20/150 BULL APP ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '20',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// } else if (isonefiftySum && istwentySum && onefiftySum[onefiftySum.length-1]/twentySum[twentySum.length-1] > 1 && onefiftySum[onefiftySum.length-2]/twentySum[twentySum.length-2] <= 1) {
					// 	// 20/150 BEAR CROSS ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '20',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// } else if (isonefiftySum && istwentySum && twentySum[twentySum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && twentySum[twentySum.length-2]/onefiftySum[onefiftySum.length-2] <= 1) {
					// 	// 20/150 BULL CROSS ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '20',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// };

					// 20 OVER 200
					if (istwoSum && istwentySum && twentySum[twentySum.length-1]/twoSum[twoSum.length-1] < 1.01 && twentySum[twentySum.length-1]/twoSum[twoSum.length-1] > 1 && twoSum[twoSum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 20/200 BEAR APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '200',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (istwoSum && istwentySum && twoSum[twoSum.length-1]/twentySum[twentySum.length-1] < 1.01 && twoSum[twoSum.length-1]/twentySum[twentySum.length-1] > 1 && twoSum[twoSum.length-5]/twentySum[twentySum.length-5] > 1.01) {
						// 20/200 BULL APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '200',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (istwoSum && istwentySum && twoSum[twoSum.length-1]/twentySum[twentySum.length-1] > 1 && twoSum[twoSum.length-2]/twentySum[twentySum.length-2] <= 1) {
						// 20/200 BEAR CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '200',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (istwoSum && istwentySum && twentySum[twentySum.length-1]/twoSum[twoSum.length-1] > 1 && twentySum[twentySum.length-2]/twoSum[twoSum.length-2] <= 1) {
						// 20/200 BULL CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '200',
							lowmat: '20',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					};

					// 100 OVER 200
					if (istwoSum && ishundySum && hundySum[hundySum.length-1]/twoSum[twoSum.length-1] < 1.01 && hundySum[hundySum.length-1]/twoSum[twoSum.length-1] > 1 && twoSum[twoSum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 100/200 BEAR APP ALERT
						maalerts.push({
							mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: hundySum[hundySum.length-1],
							highmat: '200',
							lowmat: '100',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (istwoSum && ishundySum && twoSum[twoSum.length-1]/hundySum[hundySum.length-1] < 1.01 && twoSum[twoSum.length-1]/hundySum[hundySum.length-1] > 1 && twoSum[twoSum.length-5]/hundySum[hundySum.length-5] > 1.01) {
						// 100/200 BULL APP ALERT
						maalerts.push({
							mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: hundySum[hundySum.length-1],
							highmat: '200',
							lowmat: '100',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (istwoSum && ishundySum && twoSum[twoSum.length-1]/hundySum[hundySum.length-1] > 1 && twoSum[twoSum.length-2]/hundySum[hundySum.length-2] <= 1) {
						// 100/200 BEAR CROSS ALERT
						maalerts.push({
							mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: hundySum[hundySum.length-1],
							highmat: '200',
							lowmat: '100',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					} else if (istwoSum && ishundySum && hundySum[hundySum.length-1]/twoSum[twoSum.length-1] > 1 && hundySum[hundySum.length-2]/twoSum[twoSum.length-2] <= 1) {
						// 100/200 BULL CROSS ALERT
						maalerts.push({
							mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.toUpperCase,
							highmap: twoSum[twoSum.length-1],
							lowmap: hundySum[hundySum.length-1],
							highmat: '200',
							lowmat: '100',
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						});
					};

					// 150 OVER 200
					// if (istwoSum && isonefiftySum && onefiftySum[onefiftySum.length-1]/twoSum[twoSum.length-1] < 1.01 && onefiftySum[onefiftySum.length-1]/twoSum[twoSum.length-1] > 1 && twoSum[twoSum.length-5]/twoSum[twoSum.length-5] > 1.01) {
					// 	// 150/200 BEAR APP ALERT
					// 	maalerts.push({
					// 		mess: '150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: onefiftySum[onefiftySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '150',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// } else if (istwoSum && isonefiftySum && twoSum[twoSum.length-1]/onefiftySum[onefiftySum.length-1] < 1.01 && twoSum[twoSum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && twoSum[twoSum.length-5]/onefiftySum[onefiftySum.length-5] > 1.01) {
					// 	// 150/200 BULL APP ALERT
					// 	maalerts.push({
					// 		mess: '150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: onefiftySum[onefiftySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '150',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// } else if (istwoSum && isonefiftySum && twoSum[twoSum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && twoSum[twoSum.length-2]/onefiftySum[onefiftySum.length-2] <= 1) {
					// 	// 150/200 BEAR CROSS ALERT
					// 	maalerts.push({
					// 		mess: '150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: onefiftySum[onefiftySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '150',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// } else if (istwoSum && isonefiftySum && onefiftySum[onefiftySum.length-1]/twoSum[twoSum.length-1] > 1 && onefiftySum[onefiftySum.length-2]/twoSum[twoSum.length-2] <= 1) {
					// 	// 150/200 BULL CROSS ALERT
					// 	maalerts.push({
					// 		mess: '150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.toUpperCase,
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: onefiftySum[onefiftySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '150',
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	});
					// };

					// Std. Dev
					if (sh.length > 49) {
						var sdlen = 50;
					} else {
						var sdlen = sh.length;
					};

					//volumeVariance
					var v = 0;
					for (var k = 0; k < sdlen; k++) {
						v = v + ((sh[k][12] - volSum) * (sh[k][12] - volSum) / 50);
						//console.log(v);
					};

					//volatilityVariance
					var volivar = 0;
					for (var l = 0; l < sdlen; l++) {
						volivar = volivar + ((sh[l][11] - fiftySum[fiftySum.length-1]) * (sh[l][11] - fiftySum[fiftySum.length-1]) / 50);
						//console.log(v);
					};

					//STDev
					var sd = Math.sqrt(v);
					var volisd = Math.sqrt(volivar);

					//Volume Alert
					if (isvolSum && sd && (sh[0][12] - volSum) > (sd)) {
						var volalert = {
							mess: 'High trading volume on ' + commaSeparateNumber(sh[0][12]) + ' shares traded compared to an average of ' + commaSeparateNumber(Math.round(volSum)) + ' shares traded',
							ticker: ticker.toUpperCase,
							meanvol: volSum,
							price: sh[0][11],
							date: sh[0][0],
							volume: sh[0][12]
						};
						maalerts.push(volalert);
					} else {
						var volalert = null;
					};

					//Volatility Alert
					// if (isfiftySum && volisd && (Math.abs(sh[0][11] - fiftySum[fiftySum.length-1])) > (volisd * 1.8)) {
					// 	var volialert = {
					// 		mess: 'Big Price Move',
					// 		ticker: ticker.toUpperCase,
					// 		meanvol: fiftyDay,
					// 		price: sh[0][11],
					// 		date: sh[0][0],
					// 		volume: sh[0][12]
					// 	};
					// };

					ticker.set('maAlerts', maalerts);
					ticker.set('volAlert', volalert);
					//ticker.set('voliAlert', volialert);
					ticker.set('Close', +(sh[0][11].toFixed(2)));
					ticker.set('Change', +(sh[0][11] - sh[1][11]).toFixed(2));
					ticker.set('pctChange', +((sh[0][11] / sh[1][11] - 1) * 100).toFixed(2));
					ticker.set('avgVolume', Math.round(volSum));
					ticker.set('Volume', +(sh[0][12].toFixed(2)));
					ticker.set('twentyDay', +(twentySum[twentySum.length-1].toFixed(2)));
					ticker.set('fiftyDay', +(fiftySum[fiftySum.length-1].toFixed(2)));
					ticker.set('hundyDay', +(hundySum[hundySum.length-1].toFixed(2)));
					ticker.set('onefiftyDay', +(onefiftySum[onefiftySum.length-1].toFixed(2)));
					ticker.set('twoDay', +(twoSum[twoSum.length-1].toFixed(2)));


					if (j == newres.length-1) {
						ticker.save({
							success: function(result) {
								response.success('SUCCESS');
							},
							error: function(error) {
								response.error(error);
							}
						});
					} else {
						ticker.save({
							success: function(result) {
								tickerftn(newres,j+1,response);
							},
							error: function(error) {
								response.error(error);
							}
						});
					};
				};
			};
		};
	},
	function(err) {
		console.error(err);
	});
};

// COMMA GENERATION
function commaSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
    	val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}


// ALERT GENERATION

Parse.Cloud.job("generateAlerts", function(request, response) {

	var tickers = [];

	// Pull Active Tickers
	var Ticker = Parse.Object.extend('Tickers');
	var tickquery = new Parse.Query(Ticker);
	tickquery.equalTo('isUsed', true);
	tickquery.limit(1000);
	tickquery.find({
		success: function(res) {

			var j = 0;
			tickerftn(res,j,response);


		},
		error: function(err) {
			console.error(err);
			response.error(err);
		}
	});

});





