// EMAIL NOTIFICATIONS
var Mandrill = require('mandrill');
Mandrill.initialize('GDVGFlsqFB9prQ-MjgwOeQ');

var moment = require('moment');

Parse.Cloud.job("emailAlerts", function(request, response) {

	var dayoweek = moment().format('dddd');
	var weekRay = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

	if (weekRay.indexOf(dayoweek) >= 0) {

		var userRay = [];
		var tickerRay = [];
		var tickerAlerts = [];
		var lessons = [];

		// Get Lessons
		var Lesson = Parse.Object.extend('Lessons');
		var lessonquery = new Parse.Query(Lesson);
		lessonquery.ascending("LessonNumber");
		lessonquery.find({

			success: function(lessons) {

				// Pull Active Users
				var User = Parse.User
				var userquery = new Parse.Query(User);
				userquery.equalTo('isActivated',true);
				userquery.each(function(user) {
					userRay.push(user);
				},
				{
					success: function(users) {

						var momit = moment.utc().startOf('day').toDate();

						var Ticker = Parse.Object.extend('Ticker');
						var tickquery = new Parse.Query(Ticker);
						tickquery.equalTo('isActivated', true);
						tickquery.equalTo('isActive', true);
						tickquery.greaterThan('RefreshAlertDate',momit);
						tickquery.each(function(tick) {
							tickerRay.push(tick);
							var green = false;
							var red = false;
							if (tick.get('Change') > 0) {
								green = true;
							} else if (tick.get('Change') < 0) {
								red = true;
							};

							tickerAlerts.push(
							{
								tickercode: tick.get('TickerCode'),
								tickername: tick.get('TickerName'),
								maalerts: tick.get('maAlerts'),
								volalert: [tick.get('volAlert')],
								volialert: [tick.get('voliAlert')],
								close: tick.get('Close'),
								change: tick.get('Change'),
								pctchange: tick.get('pctChange'),
								tickervolume: tick.get('Volume'),
								tickeravgvolume: tick.get('avgVolume'),
								red: red,
								green: green
							})
						},
						{
							success: function(tickers) {

								var Index = Parse.Object.extend('Indices');
								var ndxquery = new Parse.Query(Index);
								ndxquery.equalTo('Ticker','^GSPC');
								ndxquery.first({
									success: function(ndx) {

										var green = false;
										var red = false;
										if (ndx.get('Change') > 0) {
											green = true;
										} else if (ndx.get('Change') < 0) {
											red = true;
										};

										var theindex = {
											tickercode: ndx.get('TickerAlt'),
											tickername: ndx.get('Name'),
											maalerts: ndx.get('maAlerts'),
											close: ndx.get('Close'),
											change: ndx.get('Change'),
											pctchange: ndx.get('pctChange'),
											tickervolume: ndx.get('Volume'),
											tickeravgvolume: ndx.get('avgVolume'),
											red: red,
											green: green
										}

										var momit = moment.utc().startOf('day').toDate();

										var Why = Parse.Object.extend('Whys');
										var whyquery = new Parse.Query(Why);
										whyquery.greaterThan('WhyDate',momit);
										whyquery.notEqualTo('isUsed',true);
										whyquery.descending('updatedAt');
										whyquery.first({
											success: function(why) {

												if (why) {
													var thewhy = {
														whytitle: why.get('WhyTitle'),
														whymess: why.get('WhyContent')
													}
												};

												matchTickers(userRay,tickerAlerts,lessons,theindex,thewhy,why,response);

											},
											error: function(error) {
												response.error('Failed to get Fresh Brew');
											}
										});
										
									},
									error: function(error) {
										response.error('Failed to get Index');
									}
								})
							},
							error: function(error) {
								response.error('ERROR: Failed to get tickers');
							}
						})

					},
					error: function(error) {
						response.error(error);
					}
				});
			
			},
			error: function(error) {
				response.error(error)
			}

		});

	} else {
		response.success("Not Today!");
	};

});


function matchTickers(userRay,tickerAlerts,lessons,theindex,thewhy,why,response) {

	var useremailRay = [];
	var userEmails = [];
	var userTags = [];

	var welcomecont = 'Welcome to Stock Joe! Below you will find a daily update on the market and your portfolio. If you chose to enroll in the lessons, you will also see a lesson a day to teach you the basics of the stock market. Do not worry if you do not understand everything to start. The lessons and market updates will cover everything you need to know. Focus on understanding why stock prices move the way they do. Feel free to ask Joe (askjoe@stockjoe.com) literally any question you might have. Enjoy!'

	for (var i = 0; i < userRay.length; i++) {

	//if (userRay[i].id == '5jHIxtFtJ9') {

		var usertickers = userRay[i].get('TickerArray');
		var useracctlink = 'http://www.stockjoe.com/#!/account/' + userRay[i].id
		var userenrolldate = userRay[i].get('enrollDate');
		var userwantslessons = userRay[i].get('wantsLessons');

		if (userenrolldate && userwantslessons) {

			var mom = new Date;

			var userenrolldateday = userenrolldate.getDay();

			var momenroll = moment(userenrolldate);
			var momnow = moment.utc();
			var dateday = moment().day();
			var origdaycount = momnow.diff(momenroll, 'days', true) // 1
			var daymod = 0;

			origdaycount = Math.ceil(origdaycount);

			var daycount = origdaycount

			if (userenrolldateday == 6) {

				daycount = daycount + 1;

			} else if (userenrolldateday == 0) {
				
				daycount = daycount + 2;

			}

			if (daycount - dateday > 6) {
				daymod = 4;
			} else if (daycount - dateday > 1) {
				daymod = 2;
			} else {
				daymod = 0;
			};

			daycount = daycount - daymod;

		} else {

			var daycount = null;

		};

		var userstockupdate = {};
		var usertickerRay = [];
		var usermaalerts = [];
		var uservolalert = {};

		for (var j = 0; j < usertickers.length; j++) {

			if (usertickers[j] && usertickers[j].tickercode) {

				var tempticker = tickerAlerts.filter(function (el) {
					return  el.tickercode == usertickers[j].tickercode;
				});

				if (tempticker[0]) {

					if (tempticker[0].close) {

						usertickerRay.push(tempticker[0]);

					};

				} else {
				
					console.log('Failed tempticker: ' + usertickers[j].tickercode);

				};

				if (j == usertickers.length-1) {

					if (usertickerRay.length > 0) {

						if (daycount && daycount == 0) {
							daycount = 1;
						};

						if (daycount && daycount == 1) {
							var welcont = welcomecont;
						} else {
							welcont = null;
						};

						if (daycount && lessons[daycount-1]) {
							var ltitle = lessons[daycount-1].get('LessonTitle');
							var lmess = lessons[daycount-1].get('LessonContent');
							var lnum = lessons[daycount-1].get('LessonNumber');
						} else {
							var ltitle = null;
							var lmess = null;
							var lnum = null;
						};

						useremailRay.push(
							{
								rcpt: userRay[i].get('email'),
								vars: [{
									name: 'tickers',
									content: usertickerRay
								},
								{
									name: 'acctlink',
									content: useracctlink
								},
								{
									name: 'lessontitle',
									content: ltitle
								},
								{
									name: 'lessonnum',
									content: lnum
								},
								{
									name: 'lessonmess',
									content: lmess
								},
								{
									name: 'welcome',
									content: welcont
								},
								{
									name: 'index',
									content: theindex
								},
								{
									name: 'why',
									content: thewhy
								}]
							}
						);

						if (userRay[i].get('email')) {
							var thetag = 'enrolled';
						} else {
							var thetag = 'unenrolled';
						}

						userEmails.push(
							{
								email: userRay[i].get('email'),
							}
						);

						userTags.push(thetag);

					};

					if (i == userRay.length-1) {
						sendEmail(userEmails,useremailRay,userTags,why,response);
					};

				};

			} else {

				if (i == userRay.length-1) {
					sendEmail(userEmails,useremailRay,userTags,why,response);
				};

			};
			
		};

	};

}


function sendEmail(userEmails,theVars,userTags,why,response) {

	Mandrill.sendTemplate({
		template_name: "production-alerts",
	    template_content: [],
		message: {
			subject: 'Stock Joe - ' + moment().format('dddd, MMMM Do, YYYY'),
			from_email: "alerts@stockjoe.com",
			from_name: "Stock Joe",
			to: userEmails,
			track_opens: true,
        	track_clicks: true,
        	view_content_link: true,
        	merge_language: 'handlebars',
        	merge_vars: theVars,
        	tags: userTags
		},
		async: true
		},{
		success: function(httpResponse) {

			why.set('isUsed',true);
			why.save({
				success: function(res) {
					response.success('Emails sent!');
				}
			});

		},
		error: function(httpResponse) {
			console.error(httpResponse);
			response.error("Uh oh, something went wrong");
		}
	});

};


// TEST EMAIL FUNCTION
Parse.Cloud.define("testemail", function(request, response) {

	var dayoweek = moment().format('dddd');
	var weekRay = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

	var userRay = [];
	var tickerRay = [];
	var tickerAlerts = [];

	var juserRay = [];
	var jtickerRay = [];
	var jtickerAlerts = [];

	var lessons = [];

	// Get Lessons
	var Lesson = Parse.Object.extend('Lessons');
	var lessonquery = new Parse.Query(Lesson);
	lessonquery.ascending("LessonNumber");
	lessonquery.find({
			success: function(lessons) {

				// Pull Active Users
				var User = Parse.User
				var userquery = new Parse.Query(User);
				userquery.equalTo('objectId','RvJX4uQYYl'); // Alt:fSf6VtVHs7  --  Prim: RvJX4uQYYl -- Jordan:5jHIxtFtJ9
				userquery.first({
					success: function(user) {

						userRay.push(user);

						var momit = moment.utc().startOf('day').toDate();

						var Ticker = Parse.Object.extend('Ticker');
						var tickquery = new Parse.Query(Ticker);
						tickquery.equalTo('isActivated', true);
						//tickquery.equalTo('isActive', true);
						tickquery.greaterThan('RefreshAlertDate',momit);
						tickquery.each(function(tick) {
							tickerRay.push(tick);
							var green = false;
							var red = false;
							if (tick.get('Change') > 0) {
								green = true;
							} else if (tick.get('Change') < 0) {
								red = true;
							};
							tickerAlerts.push(
							{
								tickercode: tick.get('TickerCode'),
								tickername: tick.get('Name'),
								maalerts: tick.get('maAlerts'),
								volalert: [tick.get('volAlert')],
								volialert: [tick.get('voliAlert')],
								close: tick.get('Close'),
								change: tick.get('Change'),
								pctchange: tick.get('pctChange'),
								tickervolume: tick.get('Volume'),
								tickeravgvolume: tick.get('avgVolume'),
								red: red,
								green: green
							});

						},
						{
							success: function(tickers) {

								var Index = Parse.Object.extend('Indices');
								var ndxquery = new Parse.Query(Index);
								ndxquery.equalTo('Ticker','^GSPC');
								ndxquery.first({
									success: function(ndx) {

										var green = false;
										var red = false;
										if (ndx.get('Change') > 0) {
											green = true;
										} else if (ndx.get('Change') < 0) {
											red = true;
										};

										var theindex = {
											tickercode: ndx.get('TickerAlt'),
											tickername: ndx.get('Name'),
											maalerts: ndx.get('maAlerts'),
											close: ndx.get('Close'),
											change: ndx.get('Change'),
											pctchange: ndx.get('pctChange'),
											tickervolume: ndx.get('Volume'),
											tickeravgvolume: ndx.get('avgVolume'),
											red: red,
											green: green
										}

										var momit = moment.utc().startOf('day').toDate();

										var Why = Parse.Object.extend('Whys');
										var whyquery = new Parse.Query(Why);
										whyquery.greaterThan('WhyDate',momit);
										whyquery.notEqualTo('isUsed',true);
										whyquery.descending('updatedAt');
										whyquery.first({
											success: function(why) {

												if (why) {
													var thewhy = {
														whytitle: why.get('WhyTitle'),
														whymess: why.get('WhyContent')
													}
												};

												devmatchTickers(userRay,tickerAlerts,lessons,theindex,thewhy,response);

											},
											error: function(error) {
												devmatchTickers(userRay,tickerAlerts,lessons,theindex,null,response);
											}
										});
										
									},
									error: function(error) {
										devmatchTickers(userRay,tickerAlerts,lessons,null,null,response);
									}
								})
								
							},
							error: function(error) {
								response.error(error);
							}
						})

					},
					error: function(error) {
						response.error(error);
					}
				});

			},
			error: function(error) {
				response.error(error);
			}
		}

	);

	

});

function devmatchTickers(userRay,tickerAlerts,lessons,theindex,thewhy,response) {

	var useremailRay = [];
	var userEmails = [];

	var welcomecont = 'Welcome to Stock Joe! Below you will find a daily update on the market and your portfolio. If you chose to enroll in the lessons you will also see a lesson a day to teach you the basics of the stock market. Do not worry if you do not understand everything to start. The lessons and market updates will cover everything you need to know. Focus on understanding why stock prices move the way they do. Feel free to ask Joe (askjoe@stockjoe.com) literally any question you might have. Enjoy!'

	for (var i = 0; i < userRay.length; i++) {

		var usertickers = userRay[i].get('TickerArray');
		var useracctlink = 'http://www.stockjoe.com/#!/account/' + userRay[i].id
		var userenrolldate = userRay[i].get('enrollDate');
		var userwantslessons = userRay[i].get('wantsLessons');

		if (userenrolldate && userwantslessons) {

			var mom = new Date;

			var userenrolldateday = userenrolldate.getDay();

			var momenroll = moment(userenrolldate);
			var momnow = moment.utc();
			var dateday = moment().day();
			var origdaycount = momnow.diff(momenroll, 'days', true) // 1
			var daymod = 0;

			origdaycount = Math.ceil(origdaycount);

			var daycount = origdaycount

			if (userenrolldateday == 6) {

				daycount = daycount + 1;

			} else if (userenrolldateday == 0) {
				
				daycount = daycount + 2;

			}

			if (daycount - dateday > 6) {
				daymod = 4;
			} else if (daycount - dateday > 1) {
				daymod = 2;
			} else {
				daymod = 0;
			};

			daycount = daycount - daymod;

		};

		var userstockupdate = {};
		var usertickerRay = [];
		var usermaalerts = [];
		var uservolalert = {};

		for (var j = 0; j < usertickers.length; j++) {

			if (usertickers[j] && usertickers[j].tickercode) {

				var tempticker = tickerAlerts.filter(function (el) {
					return  el.tickercode == usertickers[j].tickercode;
				});

				if (tempticker[0]) {

					if (tempticker[0].close) {

						usertickerRay.push(tempticker[0]);

					};

				} else {
				
					console.log('Failed tempticker: ' + usertickers[j].tickercode);

				};

				if (j == usertickers.length-1) {

					if (usertickerRay.length > 0) {

						if (daycount && daycount == 0) {
							daycount = 1;
						};

						if (daycount && daycount == 1) {
							var welcont = welcomecont;
						} else {
							welcont = null;
						};

						if (daycount && lessons[daycount-1]) {
							var ltitle = lessons[daycount-1].get('LessonTitle');
							var lmess = lessons[daycount-1].get('LessonContent');
							var lnum = lessons[daycount-1].get('LessonNumber');
						} else {
							var ltitle = null;
							var lmess = null;
							var lnum = null;
						};

						useremailRay.push(
							{
								rcpt: userRay[i].get('email'),
								vars: [{
									name: 'tickers',
									content: usertickerRay
								},
								{
									name: 'acctlink',
									content: useracctlink
								},
								{
									name: 'lessontitle',
									content: ltitle
								},
								{
									name: 'lessonnum',
									content: lnum
								},
								{
									name: 'lessonmess',
									content: lmess
								},
								{
									name: 'welcome',
									content: welcont
								},
								{
									name: 'index',
									content: theindex
								},
								{
									name: 'why',
									content: thewhy
								}]
							}
						);

						userEmails.push(
							{
								email: userRay[i].get('email')
							}
						);

					};

					if (i == userRay.length-1) {
						sendEmailDev(userEmails,useremailRay,response);
					};

				};

			} else {

				if (i == userRay.length-1) {
					sendEmailDev(userEmails,useremailRay,response);
				};

			};
			
		};

	};

}


function sendEmailDev(userEmails,theVars,response) {

	Mandrill.sendTemplate({
		template_name: "dev-alerts",
	    template_content: [],
		message: {
			subject: 'Stock Joe - ' + moment().format('dddd, MMMM Do, YYYY'),
			from_email: "alerts@stockjoe.com",
			from_name: "Stock Joe",
			to: userEmails,
			track_opens: true,
        	track_clicks: true,
        	view_content_link: true,
        	merge_language: 'handlebars',
        	merge_vars: theVars,
        	tags: ['test']
		},
		async: true
		},{
		success: function(httpResponse) {
			response.success("Email sent!");
		},
		error: function(httpResponse) {
			console.error(httpResponse);
			response.error("Uh oh, something went wrong");
		}
	});

};


