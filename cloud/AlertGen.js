var moment = require('moment');

// PROD CLOUD ALERT GENERATION
function tickerftndev(theres,j,response) {

	var newres = theres;
	var ticker = newres[j];

	// URL CREATION
	var tickercode = ticker.get('Ticker');
	var month = '1';
	var day = '1';
	var year = '2013';

	var mom = new Date();

	var pmonth = mom.getMonth();
	var pday = mom.getDate();
	var pyear = mom.getFullYear();

	pmonth = pmonth + 1;

	var mday = 15;
	var oday = mday - 1;
	var mmonth = pmonth + 1;
	if (mmonth == 13) {
		mmonth == '01'
	};
	var myear = pyear - 1;
	var oyear = myear - 1;

	if (pday < 10) {pday = '0' + pday};
	if (pmonth < 10) {pmonth = '0' + pmonth};
	if (mday < 10) {mday = '0' + mday};
	if (mmonth < 10) {mmonth = '0' + mmonth};
	if (oday < 10) {oday = '0' + oday};

	var tickurl1 = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22'+tickercode+'%22%20and%20startDate%20%3D%20%22'+myear+'-'+mmonth+'-'+mday+'%22%20and%20endDate%20%3D%20%22'+pyear+'-'+pmonth+'-'+pday+'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
	var tickurl2 = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22'+tickercode+'%22%20and%20startDate%20%3D%20%22'+oyear+'-'+mmonth+'-'+oday+'%22%20and%20endDate%20%3D%20%22'+myear+'-'+mmonth+'-'+oday+'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

	Parse.Cloud.httpRequest(
		{
			url: tickurl1,
			datatype: 'jsonp',
			jsonp: "callback",
    		jsonpCallback: "quote",
		})
		.then(function (res1) {

			Parse.Cloud.httpRequest(
				{
					url: tickurl2,
					datatype: 'jsonp',
					jsonp: "callback",
		    		jsonpCallback: "quote",
				})
				.then(function (res2) {

					runalgo(res1,res2,ticker,j,response,newres);
			    	
				},
				function(err) {
					console.error('YAHOO API 2 ERROR: ' + tickercode);
					runalgo(res1,null,ticker,j,response,newres);
					//response.error(err);
				});	
		},
		function(err) {
			console.error('YAHOO API ERROR: ' + tickercode);
			runalgo(null,null,ticker,j,response,newres);
			//response.error(err);
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
Parse.Cloud.job("generateAlertsProd", function(request, response) {

	var dayoweek = moment().format('dddd');
	var weekRay = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

	if (weekRay.indexOf(dayoweek) >= 0) {

		var tickers = [];

		var momit = moment.utc().startOf('day').subtract(4, 'h').toDate();

		// Pull Active Tickers
		var Ticker = Parse.Object.extend('Tickers');
		var tickquery = new Parse.Query(Ticker);
		tickquery.equalTo('isUsed', true);
		tickquery.lessThan('updatedAt',momit);
		tickquery.limit(1000);
		tickquery.find({
			success: function(res) {

				if (res[0]){
					var j = 0;
					tickerftndev(res,j,response);
				} else {
					response.success('no tickers');
				}

			},
			error: function(err) {
				console.error(err);
				response.error(err);
			}
		});

	} else {
		response.success("Not Today!");
	};

});

// ALGO
function runalgo(res1,res2,ticker,j,response,newres) {

	if (res1 && res1.data.query.results) {

		if (res2 && res2.data.query.results) {
			var sh = res1.data.query.results.quote.concat(res2.data.query.results.quote);
		} else {
			var sh = res1.data.query.results.quote;
		};

		var adjclose = [];
		var volume = [];
		var dateray = [];
		var isETF = ticker.get('isETF');

		// ANALYSIS LOOP
		for (var i = sh.length-1; i >= 0; i--) {

			adjclose.push(Number(sh[i].Adj_Close).toFixed(2));
			volume.push(Number(sh[i].Volume));
			dateray.push(sh[i].Date);

			if (i == sh.length-1) {
				var high = adjclose[adjclose.length-1];
				var low = adjclose[adjclose.length-1];
				var rangehigh = adjclose[adjclose.length-1];
				var rangelow = adjclose[adjclose.length-1];
				var supp = [];
				var resist = [];
				var tp = 0;
				var tv = 0;
				var tsupp = null;
				var tresist = null;
				var twentySum = [adjclose[adjclose.length-1]/20];
				var fiftySum = [adjclose[adjclose.length-1]/50];
				var hundySum = [adjclose[adjclose.length-1]/100];
				var onefiftySum = [adjclose[adjclose.length-1]/150];
				var twoSum = [adjclose[adjclose.length-1]/200];
				var volSum = volume[volume.length-1] / 50;
				var istwentySum = false;
				var isfiftySum = false;
				var istwoSum = false;
				var ishundySum = false;
				var isonefiftySum = false;
				var isvolSum = false;
				var hasresist = false;
				var hassupport = false;
			} else if (i < sh.length-1) {

				if (i < sh.length-200) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150) - (adjclose[adjclose.length-151]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200) - (adjclose[adjclose.length-201]/200));
					istwoSum = true;
				} else if (i < sh.length-150) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150) - (adjclose[adjclose.length-151]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					isonefiftySum = true;
				} else if (i < sh.length-100) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					ishundySum = true;
				} else if (i < sh.length-50) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					isvolSum = true;
					isfiftySum = true;
				} else if (i < sh.length-20) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					istwentySum = true;
				} else {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
				};

				if (i < 50) {
					volSum += volume[volume.length-1] / 50;
				};

				if (adjclose[adjclose.length-1] > high) {
					high = adjclose[adjclose.length-1];
				} else if (adjclose[adjclose.length-1] < low){
					low = adjclose[adjclose.length-1];
				} else if (adjclose[adjclose.length-1] < rangelow){
					rangelow = adjclose[adjclose.length-1];
				} else if (adjclose[adjclose.length-1] > rangehigh){
					rangehigh = adjclose[adjclose.length-1];
				};

				
				if (i == 0) { // STOCK NOTIFICATIONS

					twentySum[twentySum.length-1] = +(twentySum[twentySum.length-1].toFixed(2));
					fiftySum[fiftySum.length-1] = +(fiftySum[fiftySum.length-1].toFixed(2));
					hundySum[hundySum.length-1] = +(hundySum[hundySum.length-1].toFixed(2));
					onefiftySum[onefiftySum.length-1] = +(onefiftySum[onefiftySum.length-1].toFixed(2));
					twoSum[twoSum.length-1] = +(twoSum[twoSum.length-1].toFixed(2));

					var maalerts = [];
					//console.log(isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01);

					if (isETF) {

						// PRICE OVER 50
						if (isfiftySum && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] < 1.02 && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
							// P/50 BEAR APP ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isfiftySum && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] < 1.02 && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
							// P/50 BULL APP ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isfiftySum && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] < 1 && fiftySum[fiftySum.length-2]/adjclose[sh.length-2] >= 1) {
							// P/50 BULL CROSS ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isfiftySum && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] < 1 && adjclose[sh.length-2]/fiftySum[fiftySum.length-2] >= 1) {
							// P/50 BEAR CROSS ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						};

						// PRICE OVER 100
						if (ishundySum && adjclose[sh.length-1]/hundySum[hundySum.length-1] < 1.02 && adjclose[sh.length-1]/hundySum[hundySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
							// P/100 BEAR APP ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (ishundySum && hundySum[hundySum.length-1]/adjclose[sh.length-1] < 1.02 && hundySum[hundySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
							// P/100 BULL APP ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (ishundySum && hundySum[hundySum.length-1]/adjclose[sh.length-1] < 1 && hundySum[hundySum.length-2]/adjclose[sh.length-2] >= 1) {
							// P/100 BULL CROSS ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (ishundySum && adjclose[sh.length-1]/hundySum[hundySum.length-1] < 1 && adjclose[sh.length-2]/hundySum[hundySum.length-2] >= 1) {
							// P/100 BEAR CROSS ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						};

						// PRICE OVER 150
						if (isonefiftySum && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] < 1.02 && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
							// P/150 BEAR APP ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isonefiftySum && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] < 1.02 && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
							// P/150 BULL APP ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isonefiftySum && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] < 1 && onefiftySum[onefiftySum.length-2]/adjclose[sh.length-2] >= 1) {
							// P/150 BULL CROSS ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isonefiftySum && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] < 1 && adjclose[sh.length-2]/onefiftySum[onefiftySum.length-2] >= 1) {
							// P/150 BEAR CROSS ALERT
							maalerts.push({
								mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('Ticker'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						};

					};

					// PRICE OVER 200
					if (istwoSum && adjclose[sh.length-1]/twoSum[twoSum.length-1] < 1.02 && adjclose[sh.length-1]/twoSum[twoSum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
						// P/200 BEAR APP ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (istwoSum && twoSum[twoSum.length-1]/adjclose[sh.length-1] < 1.02 && twoSum[twoSum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
						// P/200 BULL APP ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (istwoSum && twoSum[twoSum.length-1]/adjclose[sh.length-1] < 1 && twoSum[twoSum.length-2]/adjclose[sh.length-2] >= 1) {
						// P/200 BULL CROSS ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (istwoSum && adjclose[sh.length-1]/twoSum[twoSum.length-1] < 1 && adjclose[sh.length-2]/twoSum[twoSum.length-2] >= 1) {
						// P/200 BEAR CROSS ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					};


					// 50 OVER 200
					if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 50/200 BEAR APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
						// 50/200 BULL APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 50/200 BEAR CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-2]/twoSum[twoSum.length-2] <= 1) {
						// 50/200 BULL CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					};

					// 50 OVER 100
					// if (isfiftySum && ishundySum && fiftySum[fiftySum.length-1]/hundySum[hundySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/hundySum[hundySum.length-1] > 1 && fiftySum[fiftySum.length-5]/hundySum[hundySum.length-5] > 1.01) {
					// 	// 50/100 BEAR APP ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (isfiftySum && ishundySum && hundySum[hundySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && hundySum[hundySum.length-1]/fiftySum[fiftySum.length-1] > 1 && hundySum[hundySum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
					// 	// 50/100 BULL APP ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (isfiftySum && ishundySum && hundySum[hundySum.length-1]/fiftySum[fiftySum.length-1] > 1 && hundySum[hundySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
					// 	// 50/100 BEAR CROSS ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (isfiftySum && ishundySum && fiftySum[fiftySum.length-1]/hundySum[hundySum.length-1] > 1 && fiftySum[fiftySum.length-2]/hundySum[hundySum.length-2] <= 1) {
					// 	// 50/100 BULL CROSS ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// };

					// // 50 OVER 150
					// if (isfiftySum && isonefiftySum && fiftySum[fiftySum.length-1]/onefiftySum[onefiftySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && fiftySum[fiftySum.length-5]/onefiftySum[onefiftySum.length-5] > 1.01) {
					// 	// 50/150 BEAR APP ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (isfiftySum && isonefiftySum && onefiftySum[onefiftySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && onefiftySum[onefiftySum.length-1]/fiftySum[fiftySum.length-1] > 1 && onefiftySum[onefiftySum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
					// 	// 50/150 BULL APP ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (isfiftySum && isonefiftySum && onefiftySum[onefiftySum.length-1]/fiftySum[fiftySum.length-1] > 1 && onefiftySum[onefiftySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
					// 	// 50/150 BEAR CROSS ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (isfiftySum && isonefiftySum && fiftySum[fiftySum.length-1]/onefiftySum[onefiftySum.length-1] > 1 && fiftySum[fiftySum.length-2]/onefiftySum[onefiftySum.length-2] <= 1) {
					// 	// 50/150 BULL CROSS ALERT
					// 	maalerts.push({
					// 		mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: onefiftySum[onefiftySum.length-1],
					// 		lowmap: fiftySum[fiftySum.length-1],
					// 		highmat: '150',
					// 		lowmat: '50',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// };

					// 20 OVER 50
					if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 20/50 BEAR APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twentySum[twentySum.length-5] > 1.01) {
						// 20/50 BULL APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-2]/twentySum[twentySum.length-2] <= 1) {
						// 20/50 BEAR CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && twentySum[twentySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 20/50 BULL CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('Ticker'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					};

					// 20 OVER 100
					// if (ishundySum && istwentySum && twentySum[twentySum.length-1]/hundySum[hundySum.length-1] < 1.01 && twentySum[twentySum.length-1]/hundySum[hundySum.length-1] > 1 && hundySum[hundySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
					// 	// 20/100 BEAR APP ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (ishundySum && istwentySum && hundySum[hundySum.length-1]/twentySum[twentySum.length-1] < 1.01 && hundySum[hundySum.length-1]/twentySum[twentySum.length-1] > 1 && hundySum[hundySum.length-5]/twentySum[twentySum.length-5] > 1.01) {
					// 	// 20/100 BULL APP ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (ishundySum && istwentySum && hundySum[hundySum.length-1]/twentySum[twentySum.length-1] > 1 && hundySum[hundySum.length-2]/twentySum[twentySum.length-2] <= 1) {
					// 	// 20/100 BEAR CROSS ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (ishundySum && istwentySum && twentySum[twentySum.length-1]/hundySum[hundySum.length-1] > 1 && twentySum[twentySum.length-2]/hundySum[hundySum.length-2] <= 1) {
					// 	// 20/100 BULL CROSS ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: hundySum[hundySum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '100',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// };

					// // 20 OVER 200
					// if (istwoSum && istwentySum && twentySum[twentySum.length-1]/twoSum[twoSum.length-1] < 1.01 && twentySum[twentySum.length-1]/twoSum[twoSum.length-1] > 1 && twoSum[twoSum.length-5]/twoSum[twoSum.length-5] > 1.01) {
					// 	// 20/200 BEAR APP ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (istwoSum && istwentySum && twoSum[twoSum.length-1]/twentySum[twentySum.length-1] < 1.01 && twoSum[twoSum.length-1]/twentySum[twentySum.length-1] > 1 && twoSum[twoSum.length-5]/twentySum[twentySum.length-5] > 1.01) {
					// 	// 20/200 BULL APP ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (istwoSum && istwentySum && twoSum[twoSum.length-1]/twentySum[twentySum.length-1] > 1 && twoSum[twoSum.length-2]/twentySum[twentySum.length-2] <= 1) {
					// 	// 20/200 BEAR CROSS ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (istwoSum && istwentySum && twentySum[twentySum.length-1]/twoSum[twoSum.length-1] > 1 && twentySum[twentySum.length-2]/twoSum[twoSum.length-2] <= 1) {
					// 	// 20/200 BULL CROSS ALERT
					// 	maalerts.push({
					// 		mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: twentySum[twentySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '20',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// };

					// // 100 OVER 200
					// if (istwoSum && ishundySum && hundySum[hundySum.length-1]/twoSum[twoSum.length-1] < 1.01 && hundySum[hundySum.length-1]/twoSum[twoSum.length-1] > 1 && twoSum[twoSum.length-5]/twoSum[twoSum.length-5] > 1.01) {
					// 	// 100/200 BEAR APP ALERT
					// 	maalerts.push({
					// 		mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: hundySum[hundySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '100',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (istwoSum && ishundySum && twoSum[twoSum.length-1]/hundySum[hundySum.length-1] < 1.01 && twoSum[twoSum.length-1]/hundySum[hundySum.length-1] > 1 && twoSum[twoSum.length-5]/hundySum[hundySum.length-5] > 1.01) {
					// 	// 100/200 BULL APP ALERT
					// 	maalerts.push({
					// 		mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: hundySum[hundySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '100',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (istwoSum && ishundySum && twoSum[twoSum.length-1]/hundySum[hundySum.length-1] > 1 && twoSum[twoSum.length-2]/hundySum[hundySum.length-2] <= 1) {
					// 	// 100/200 BEAR CROSS ALERT
					// 	maalerts.push({
					// 		mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: hundySum[hundySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '100',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// } else if (istwoSum && ishundySum && hundySum[hundySum.length-1]/twoSum[twoSum.length-1] > 1 && hundySum[hundySum.length-2]/twoSum[twoSum.length-2] <= 1) {
					// 	// 100/200 BULL CROSS ALERT
					// 	maalerts.push({
					// 		mess: '100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
					// 		ticker: ticker.get('Ticker'),
					// 		highmap: twoSum[twoSum.length-1],
					// 		lowmap: hundySum[hundySum.length-1],
					// 		highmat: '200',
					// 		lowmat: '100',
					// 		price: adjclose[sh.length-1],
					// 		date: dateray[sh.length-1],
					// 		volume: volume[sh.length-1]
					// 	});
					// };

					// SUPPORT / RESISTANCE
					var support = ticker.get('SupportVal');
					var resist = ticker.get('ResistVal');
					if (!isETF && support && support > 0 && adjclose[sh.length-1]/support < 1.03 && adjclose[sh.length-1]/support > 1) {
						// NEAR SUPPORT ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is near support ($ ' + support + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (!isETF && support && support > 0 && adjclose[sh.length-1]/support < 1 && adjclose[sh.length-2]/support > 1) {
						// BROKE SUPPORT ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') broke support ($ ' + support + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
						ticker.set('LevelTrigger', true);
					} else if (!isETF && resist && resist > 0 && resist/adjclose[sh.length-1] < 1.03 && resist/adjclose[sh.length-1] > 1) {
						// NEAR RESIST ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') is near resistance ($ ' + resist + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (!isETF && resist && resist > 0 && resist/adjclose[sh.length-1] < 1 && resist/adjclose[sh.length-2] > 1) {
						// BROKE RESIST ALERT
						maalerts.push({
							mess: ticker.get('Ticker') + ' ($ ' + adjclose[sh.length-1] + ') broke resistance ($ ' + resist + ')',
							ticker: ticker.get('Ticker'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
						ticker.set('LevelTrigger', true);
					};

					// Set Level Trigger True
					if (adjclose[sh.length-1] > adjclose[sh.length-2] && adjclose[sh.length-3] > adjclose[sh.length-2]) {
						ticker.set('LevelTrigger', true);
					} else if (adjclose[sh.length-1] < adjclose[sh.length-2] && adjclose[sh.length-3] < adjclose[sh.length-2]) {
						ticker.set('LevelTrigger', true);
					};

					// Std. Dev
					if (sh.length > 49) {
						var sdlen = 50;
					} else {
						var sdlen = volume.length;
					};

					//volumeVariance
					var v = 0;
					for (var k = 0; k < sdlen; k++) {
						v = v + ((volume[sh.length-1-k] - volSum) * (volume[sh.length-1-k] - volSum) / 50);
					};

					//volatilityVariance
					var volivar = 0;
					for (var l = 0; l < sdlen; l++) {
						volivar = volivar + ((adjclose[sh.length-1-l] - fiftySum[fiftySum.length-1]) * (adjclose[sh.length-1-l] - fiftySum[fiftySum.length-1]) / 50);
					};

					//STDev
					var sd = Math.sqrt(v);
					var volisd = Math.sqrt(volivar);

					//Volume Alert

					if (!isETF && isvolSum && sd && (volume[sh.length-1] - volSum) > (sd)) {
						var volalert = {
							mess: 'High trading volume on ' + commaSeparateNumber(volume[sh.length-1]) + ' shares traded compared to an average of ' + commaSeparateNumber(Math.round(volSum)) + ' shares traded',
							ticker: ticker.get('Ticker'),
							meanvol: volSum,
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						};
						maalerts.push(volalert);
					} else {
						var volalert = null;
					};

					ticker.set('maAlerts', maalerts);
					ticker.set('volAlert', volalert);
					ticker.set('Close', +(adjclose[sh.length-1]));
					ticker.set('Change', +(adjclose[sh.length-1] - adjclose[sh.length-2]).toFixed(2));
					ticker.set('pctChange', +((adjclose[sh.length-1] / adjclose[sh.length-2] - 1) * 100).toFixed(2));
					ticker.set('avgVolume', Math.round(volSum));
					ticker.set('Volume', +(volume[sh.length-1].toFixed(2)));
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
								tickerftndev(newres,j+1,response);
							},
							error: function(error) {
								console.log(error);
								response.error('error in ticker save');
							}
						});
					};
				};
			};
		};

	} else {

		if (ticker.get('Ticker')) {
			console.error('FAILED TICKER: ' + ticker.get('Ticker'));
		};

		if (j == newres.length-1) {

			response.success('SUCCESS');

		} else {

			tickerftndev(newres,j+1,response);

		};

	};
}