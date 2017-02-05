var moment = require('moment');
// NEW TICKER DATA

Parse.Cloud.job("getNewTickerData", function(request, response) {

	//var dayoweek = moment().format('dddd');
	var weekRay = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

	// URL CREATION
	var trytickers = [];
	var alphabet = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

	var currtickers = [];

	var Ticker = Parse.Object.extend('Ticker');
	var tquery = new Parse.Query(Ticker);
	tquery.each(function(tres) {
		currtickers.push({parseticker: tres, tickerstr: tres.get('TickerCode')});
		}).then(function() {
	    // Set the job's success status
	    console.log('currtickers: ' + currtickers.length);

		for (var i = 25; i < alphabet.length; i++) {
			//trytickers.push(alphabet[i]);
			for (var j = 25; j < alphabet.length; j++) {
				//trytickers.push(alphabet[i] + alphabet[j]);
				for (var k = 0; k < alphabet.length; k++) {
					//trytickers.push(alphabet[i] + alphabet[j] + alphabet[k]);
					for (var l = 0; l < alphabet.length; l++) {
						trytickers.push(alphabet[i] + alphabet[j] + alphabet[k] + alphabet[l]);

						if (i == 25 && l ==25 && k == 25 && j ==25) {
						//if (l ==25 && k == 25 && j ==25) {

							console.log('trytickers: ' + trytickers[trytickers.length-1]);
							// START QUERYING
							var n = 0;

							runYQLTests(trytickers, n, response, currtickers);

						};

					};
				};
			};
		};

	}, function(error) {
	    // Set the job's error status
	});	

});

Parse.Cloud.job("getTopTickerData", function(request, response) {

	var dayoweek = moment().format('dddd');
	var weekRay = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

	//if (weekRay.indexOf(dayoweek) >= 0) {

		var dstart = moment.utc().startOf('day').toDate();

		// console.log(dstart);
		// console.log(moment.utc().toDate());

		// URL CREATION
		var trytickers = [];
		var currtickers = [];

		var Ticker = Parse.Object.extend('Ticker');
		var tquery = new Parse.Query(Ticker);
		tquery.equalTo('isActive', true);
		tquery.equalTo('isCompany', true);
		//tquery.greaterThan('MarketCapitalization', 250000000)
		tquery.lessThan('RefreshedDate', dstart);
		//tquery.equalTo('TickerCode','AAPL');
		//tquery.equalTo('RefreshedDate', undefined);
		tquery.each(function(tres) {
			currtickers.push({parseticker: tres, tickerstr: tres.get('TickerCode')});
			trytickers.push(tres.get('TickerCode'));
			}).then(function() {
			
				console.log('currtickers: ' + currtickers.length);

				// START QUERYING
				if (trytickers.length > 0) {

					var n = 0;
					runYQLTests(trytickers, n, response, currtickers);

				} else {
					response.success('No Tickers To Refresh');
				}

		}, function(error) {
		    // Set the job's error status
		    response.error('Failed to Get currtickers');
		});

	// } else {
	// 	response.success("Not Today!");
	// };

});

function runYQLTests(tickers, n, response, currtickers) {

	var trialtickers = tickers.slice(n,n+5);

	var escurl = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22';

	for (var i = 0; i < trialtickers.length; i++) {
		if (i == trialtickers.length-1) {
			
			escurl = escurl + trialtickers[i] + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

			Parse.Cloud.httpRequest(
				{
					url: escurl,
					datatype: 'jsonp',
					jsonp: "callback",
		    		jsonpCallback: "quote",
				})
				.then(function (res1) {

					parseTickers(res1,tickers,n,response,currtickers);
			    	
				},
				function(err) {
					console.error('YAHOO API QUOTE ERROR');
					response.error(n.toString());
				});	

		} else {
			escurl = escurl + trialtickers[i] + '%22%2C%22';
		};
		
	};

}

function parseTickers(res1,tickers,n,response,currtickers) {

	// Parse Results
	if (res1 && res1.data.query.results) {

		var tickerdata = res1.data.query.results.quote

		for (var m = 0; m < tickerdata.length; m++) {
			
			var tempdata = currtickers.filter(function(el){
				return el.tickerstr == tickerdata[m].Symbol;
			});

			var d = moment().utc().toDate();
			var dminus = moment().subtract(2, 'days').utc().toDate();

			if (tempdata[0]) {

				var targticker = tempdata[0].parseticker;

				if (tickerdata[m].Bid && tickerdata[m].Ask && tickerdata[m].Name && tickerdata[m].StockExchange && tickerdata[m].StockExchange != 'PNK') {

					targticker.set('isActive', true);

					targticker.set('RefreshedDate', d);

					targticker.set('PEGRatio', tickerdata[m].PEGRatio);
					targticker.set('PriceEPSEstimateCurrentYear', tickerdata[m].PriceEPSEstimateCurrentYear);
					targticker.set('PriceEPSEstimateNextYear', tickerdata[m].PriceEPSEstimateNextYear);
					targticker.set('ShortRatio', tickerdata[m].ShortRatio);
					targticker.set('OneyrTargetPrice', tickerdata[m].OneyrTargetPrice);
					targticker.set('DividendYield', Number(tickerdata[m].DividendYield));
					targticker.set('PERatio', tickerdata[m].PERatio);
					targticker.set('ExDividendDate', tickerdata[m].ExDividendDate);
					targticker.set('DividendPayDate', tickerdata[m].DividendPayDate);
					targticker.set('PriceBook', tickerdata[m].PriceBook);
					targticker.set('PriceSales', tickerdata[m].PriceSales);
					targticker.set('EBITDA', toFullNum(tickerdata[m].EBITDA));
					targticker.set('MarketCapitalization', toFullNum(tickerdata[m].MarketCapitalization));
					targticker.set('YearHigh', tickerdata[m].YearHigh);
					targticker.set('YearLow', tickerdata[m].YearLow);
					targticker.set('EPSEstimateCurrentYear', tickerdata[m].EPSEstimateCurrentYear);
					targticker.set('EPSEstimateNextYear', tickerdata[m].EPSEstimateNextYear);
					targticker.set('EPSEstimateNextQuarter', tickerdata[m].EPSEstimateNextQuarter);
					targticker.set('EarningsShare', tickerdata[m].EarningsShare);
					targticker.set('BookValue', Number(tickerdata[m].BookValue));
					targticker.set('AverageDailyVolume', Number(tickerdata[m].AverageDailyVolume));
					targticker.set('DividendShare', Number(tickerdata[m].DividendShare));
					targticker.set('DaysLow', Number(tickerdata[m].DaysLow));
					targticker.set('DaysHigh', Number(tickerdata[m].DaysHigh));
					targticker.set('StockExchange', tickerdata[m].StockExchange)

					targticker.save({
						success: function(res) {

						},
						error: function(res, error) {

							console.log(error);

						}
					});

				} else {

					targticker.set('isActive', false);

					targticker.set('RefreshedDate', d);

					targticker.save({
						success: function(res) {

						},
						error: function(res) {

							console.log('Failed To Deactivate Ticker');

						}
					});

				};

			} else if (tickerdata[m].MarketCapitalization && tickerdata[m].PriceSales && tickerdata[m].EBITDA && tickerdata[m].Name) {

				var Ticker = Parse.Object.extend('Ticker');
				var newticker = new Ticker();

				newticker.set('isActive', true);

				newticker.set('RefreshedDate', d);
				newticker.set('RefreshAlertDate', dminus);

				newticker.set('isCompany', true);
				newticker.set('isETF', false);

				newticker.set('TickerCode', tickerdata[m].Symbol);
				newticker.set('TickerName', tickerdata[m].Name);
				newticker.set('PEGRatio', tickerdata[m].PEGRatio);
				newticker.set('PriceEPSEstimateCurrentYear', tickerdata[m].PriceEPSEstimateCurrentYear);
				newticker.set('PriceEPSEstimateNextYear', tickerdata[m].PriceEPSEstimateNextYear);
				newticker.set('ShortRatio', tickerdata[m].ShortRatio);
				newticker.set('OneyrTargetPrice', tickerdata[m].OneyrTargetPrice);
				newticker.set('DividendYield', Number(tickerdata[m].DividendYield));
				newticker.set('PERatio', tickerdata[m].PERatio);
				newticker.set('ExDividendDate', tickerdata[m].ExDividendDate);
				newticker.set('DividendPayDate', tickerdata[m].DividendPayDate);
				newticker.set('PriceBook', tickerdata[m].PriceBook);
				newticker.set('PriceSales', tickerdata[m].PriceSales);
				newticker.set('EBITDA', toFullNum(tickerdata[m].EBITDA));
				newticker.set('MarketCapitalization', toFullNum(tickerdata[m].MarketCapitalization));
				newticker.set('YearHigh', tickerdata[m].YearHigh);
				newticker.set('YearLow', tickerdata[m].YearLow);
				newticker.set('EPSEstimateCurrentYear', tickerdata[m].EPSEstimateCurrentYear);
				newticker.set('EPSEstimateNextYear', tickerdata[m].EPSEstimateNextYear);
				newticker.set('EPSEstimateNextQuarter', tickerdata[m].EPSEstimateNextQuarter);
				newticker.set('EarningsShare', tickerdata[m].EarningsShare);
				newticker.set('BookValue', Number(tickerdata[m].BookValue));
				newticker.set('AverageDailyVolume', Number(tickerdata[m].AverageDailyVolume));
				newticker.set('DividendShare', Number(tickerdata[m].DividendShare));
				newticker.set('DaysLow', Number(tickerdata[m].DaysLow));
				newticker.set('DaysHigh', Number(tickerdata[m].DaysHigh));
				newticker.set('StockExchange', tickerdata[m].StockExchange);

				newticker.save({
					success: function(res) {

					},
					error: function(res,error) {

						console.log(error);

					}
				});

			} else if (tickerdata[m].Bid && tickerdata[m].Ask && tickerdata[m].Name) {

				var Ticker = Parse.Object.extend('Ticker');
				var newticker = new Ticker();

				newticker.set('isActive', true);

				newticker.set('RefreshedDate', d);
				newticker.set('RefreshAlertDate', dminus);

				newticker.set('isCompany', false);
				newticker.set('isETF', true);

				newticker.set('TickerCode', tickerdata[m].Symbol);
				newticker.set('TickerName', tickerdata[m].Name);
				newticker.set('PEGRatio', tickerdata[m].PEGRatio);
				newticker.set('PriceEPSEstimateCurrentYear', tickerdata[m].PriceEPSEstimateCurrentYear);
				newticker.set('PriceEPSEstimateNextYear', tickerdata[m].PriceEPSEstimateNextYear);
				newticker.set('ShortRatio', tickerdata[m].ShortRatio);
				newticker.set('OneyrTargetPrice', tickerdata[m].OneyrTargetPrice);
				newticker.set('DividendYield', Number(tickerdata[m].DividendYield));
				newticker.set('PERatio', tickerdata[m].PERatio);
				newticker.set('ExDividendDate', tickerdata[m].ExDividendDate);
				newticker.set('DividendPayDate', tickerdata[m].DividendPayDate);
				newticker.set('PriceBook', tickerdata[m].PriceBook);
				newticker.set('PriceSales', tickerdata[m].PriceSales);
				newticker.set('EBITDA', toFullNum(tickerdata[m].EBITDA));
				newticker.set('MarketCapitalization', toFullNum(tickerdata[m].MarketCapitalization));
				newticker.set('YearHigh', tickerdata[m].YearHigh);
				newticker.set('YearLow', tickerdata[m].YearLow);
				newticker.set('EPSEstimateCurrentYear', tickerdata[m].EPSEstimateCurrentYear);
				newticker.set('EPSEstimateNextYear', tickerdata[m].EPSEstimateNextYear);
				newticker.set('EPSEstimateNextQuarter', tickerdata[m].EPSEstimateNextQuarter);
				newticker.set('EarningsShare', tickerdata[m].EarningsShare);
				newticker.set('BookValue', Number(tickerdata[m].BookValue));
				newticker.set('AverageDailyVolume', Number(tickerdata[m].AverageDailyVolume));
				newticker.set('DividendShare', Number(tickerdata[m].DividendShare));
				newticker.set('DaysLow', Number(tickerdata[m].DaysLow));
				newticker.set('DaysHigh', Number(tickerdata[m].DaysHigh));
				newticker.set('StockExchange', tickerdata[m].StockExchange);

				newticker.save({
					success: function(res) {

					},
					error: function(res,error) {

						console.log(error);

					}
				});

			}

			if (m == tickerdata.length-1) {

				if (n >= tickers.length-6) {

					console.log(tickers.length);
					response.success('REFRESHED TICKERS');

				} else {

					runYQLTests(tickers, n+5, response, currtickers);

				};

			};

		};

	} else {

		runYQLTests(tickers, n+5, response, currtickers);

	};

}


function toFullNum(preNum) {

	console.log(preNum);

	if (preNum && preNum.indexOf('M') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum) * 1000000;

		return theNum

	} else if (preNum && preNum.indexOf('B') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum) * 1000000000;

		return theNum

	} else if (preNum && preNum.indexOf('K') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum) * 1000;

		return theNum

	} else if (preNum && preNum.indexOf('.') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum);

		return theNum

	} else {
		
		return preNum
		
	};

};

	
