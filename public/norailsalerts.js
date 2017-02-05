'use strict'

Parse.initialize("goMHhGWfr1mSHV71ZGIhveepd3PoUcZyBoP4Ox0g", "ZzbuLz6uaS6FI56xDRXRUcLQWKaNLHe0GAVsfgVU");

var myapp = angular.module('mainapp',[
	'ui.router',
	'ui.bootstrap',
	'devMod'
	]);
//var myapp = angular.module('mainapp');

myapp.value('$anchorScroll', angular.noop)

myapp.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$anchorScrollProvider', '$provide', function($stateProvider, $urlRouterProvider, $locationProvider, $anchorScrollProvider, $provide) {

  $locationProvider
//  .html5Mode(true)
    .hashPrefix('!');

	// this is required for the root url to direct to /#/
	$urlRouterProvider
    .otherwise('/');
    
    $stateProvider
	
    // Home
    .state('home', {
      url: "/",
      templateUrl: 'partials/home.html',
      controller: 'mainCtrl',
      data: {
        requireLogin: false
      }
    })

	// Blog
    .state('blog', {
      url: "/blog",
      //abstract: true,
      templateUrl: 'partials/blog-archive.html',
      controller: 'blogCtrl',
      data: {
        requireLogin: false
      }
    })

    // Blog Entry
    .state('post', {
      url: "/post/:postid",
      templateUrl: 'partials/blog-post.html',
      controller: 'postCtrl',
      data: {
        requireLogin: false
      }
    })

    // Course
    .state('course', {
      url: "/course",
      //abstract: true,
      templateUrl: 'partials/course-archive.html',
      controller: 'courseCtrl',
      data: {
        requireLogin: false
      }
    })

    // Lesson
    .state('lesson', {
      url: "/lesson/:lessonid",
      templateUrl: 'partials/lesson.html',
      controller: 'lessonCtrl',
      data: {
        requireLogin: false
      }
    })

    // Home
    .state('privacy', {
      url: "/privacy",
      templateUrl: 'partials/privacy.html',
      controller: 'mainCtrl',
      data: {
        requireLogin: false
      }
    })

    // Home
    .state('terms', {
      url: "/terms",
      templateUrl: 'partials/terms.html',
      controller: 'mainCtrl',
      data: {
        requireLogin: false
      }
    })

    // Ask Joe
    .state('askjoe', {
      url: "/askjoe",
      templateUrl: 'partials/askjoe.html',
      controller: 'mainCtrl',
      data: {
        requireLogin: false
      }
    })

    // Account
    .state('account', {
      url: "/account/:userId",
      templateUrl: 'partials/account.html',
      controller: 'acctCtrl',
      data: {
        requireLogin: true
      }
    })

    // SUPPORT RESISTANCE
    .state('suppres', {
      url: "/supportcalculator",
      templateUrl: 'partials/supprespartial.html',
      controller: 'supprestool',
      data: {
      	requireLogin: false
      }
    })

    // Dev
    .state('dev', {
      url: "/dev",
      templateUrl: 'partials/dev.html',
      controller: 'devCtrl',
      data: {
        admin: true
      }
    })

}]);

myapp.service('loginModal', function ($modal, $rootScope) {

	function assignCurrentUser (user) {
		$rootScope.currentUser = user;
		return user;
	}

	return function() {
		var instance = $modal.open({
	  	templateUrl: 'partials/login-modal.html',
	  	controller: 'mainCtrl',
	  	controllerAs: 'mainCtrl'
		})

		return instance.result.then(assignCurrentUser);
	};

})

myapp.service('signupModal', function ($modal, $rootScope) {

    function assignCurrentUser (user) {
	    $rootScope.currentUser = user;
	    return user;
    }

    return function() {
	    var instance = $modal.open({
	        templateUrl: 'partials/signup-modal.html',
	        controller: 'mainCtrl',
	        controllerAs: 'mainCtrl',
	        resolve: {
	        	isnewbie: function () {
	        		return true;
	        	}
	        }
	    })

	    return instance.result.then(assignCurrentUser);
    };

})

myapp.run(['$rootScope', '$location', '$window', '$state', '$stateParams', 'loginModal', 'signupModal', function($rootScope, $location, $window, $state, $stateParams, loginModal, signupModal) {

	// Parse is initialised by injecting the ParseService into the Angular app
	$rootScope.$state = $state;
  	$rootScope.$stateParams = $stateParams;
  	$rootScope.isViewLoading = true;
  	$rootScope.currentUser = Parse.User.current();

  	// Check Logged In
	var currentUser = Parse.User.current();

	if (currentUser) {

	    currentUser.fetch({
	    	success: function(user) {
	    		$rootScope.currentUser = user;
	    	},
	    	error: function(error) {
	    		$rootScope.currentUser = currentUser;
	    		console.log('error fetching');
	    	}
	    })

	} else {

		$rootScope.currentUser = Parse.User.current();

	}

    // loading animation
  	$rootScope.setLoading = function() {
	    $rootScope.isViewLoading = true;
	};
	$rootScope.unsetLoading = function() {
	    $rootScope.isViewLoading = false;
	};


	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, from, fromParams) {
		$rootScope.setLoading();
	    var requireLogin = toState.data.requireLogin;
	    var requireAdmin = toState.data.admin;
	    var isSignup = $rootScope.isSignup;

	    if (requireAdmin && $rootScope.currentUser && $rootScope.currentUser.id != 'RvJX4uQYYl') {
	    	event.preventDefault();
	    	$state.go('home');
	    } else if (requireAdmin && !$rootScope.currentUser) {
	    	event.preventDefault();
	    	$state.go('home');
	    };

	    if (requireLogin && !$rootScope.currentUser && isSignup == true) {
	      event.preventDefault();
	      // get me a login modal!
	        signupModal()
	          .then(function (user) {
	          	$rootScope.currentUser = Parse.User.current();
            	if ($rootScope.currentUser) {
		            toParams.userId = $rootScope.currentUser.id;
		            return $state.go(toState.name, toParams);
	            } else {
	            	$rootScope.isSignup = false;
	            	$state.go('account');
	            };
	            
	          })
	          .catch(function () {
	          	$rootScope.isSignup = null;
	            return $state.go('home');
	          });
	    } else if (!$rootScope.currentUser && requireLogin) {
	    	event.preventDefault();
	    	loginModal()
	          .then(function (user) {
	          	$rootScope.currentUser = Parse.User.current();
            	if ($rootScope.currentUser) {
		            toParams.userId = $rootScope.currentUser.id;
		            return $state.go(toState.name, toParams);
	            } else {
	            	$rootScope.isSignup = true;
	            	$state.go('account');
	            };
	          })
	          .catch(function () {
	          	$rootScope.isSignup = null;
	            return $state.go('home');
	          });
	    } else if ($rootScope.currentUser && requireLogin && toParams.userId != $rootScope.currentUser.id) {
	      event.preventDefault();
	      console.log('went home');
	      $state.go('home');
	    } else if (requireLogin && !toParams.userId) {
	      event.preventDefault();
	      console.log('went home');
	      $state.go('home');
	    } else if ($rootScope.currentUser && requireAdmin && $rootScope.currentUser.id != 'RvJX4uQYYl') {
	    	event.preventDefault();
	    	$state.go('home');
	    } else if (requireAdmin && !$rootScope.currentUser) {
	    	event.preventDefault();
	    	$rootScope.isSignup = false;
	        $state.go('account');
	    };

	});

	$rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
		$rootScope.unsetLoading();

		//console.log(to);

	    if (!$window.ga)
        	return;

    	$window.ga('send', 'pageview', { page: $location.path() });

	});

	$rootScope.$on('$stateChangeError', function (ev, to, toParams, from, fromParams, err) {
		console.log(err);
	});

}]);

myapp.controller('mainCtrl', ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {

	$('.nav a').on('click', function(){
	    $(".navbar-toggle").click();
	});

	//SIGN UP MODAL from Home
	$scope.signModalH = function () {

		ga('send','event','Signup','click','click-signupmodal-home',0);
		$rootScope.isSignup = true;
		$rootScope.isNewbie = false;
		if ($rootScope.currentUser) {
			$state.go('account', { userId: $rootScope.currentUser.id });
		} else {
			$state.go('account');
		};
		
	};

	//SIGN UP MODAL from Home
	$scope.signModalL = function () {

		ga('send','event','Signup','click','click-signupmodal-newbie',0);
		$rootScope.isSignup = true;
		$rootScope.isNewbie = true;
		if ($rootScope.currentUser) {
			$state.go('account', { userId: $rootScope.currentUser.id });
		} else {
			$state.go('account');
		};
		
	};


	//SIGN UP MODAL
	$scope.signModal = function () {

		ga('send','event','Signup','click','click-signupmodal',0);
		if (typeof $scope.$close() == 'function') {
			$rootScope.isSignup = true;
	        $scope.$close(null);
	    } else {
	    	$state.go('home');
	    };

	};

	//LOGIN MODAL
	$scope.logModal = function () {

		ga('send','event','Login','click','click-loginmodal',0);
		if (typeof $scope.$close() == 'function') {
			$rootScope.isSignup = false;
	        $scope.$close(null);
	    } else {
	    	$state.go('home');
	    };
		
	};


	$scope.cancel =	$scope.$dismiss;


	$scope.signup = function() {

		ga('send','event','Signup','click','click-signup',0);

		var user = new Parse.User();
		user.set('username', $scope.email);
		user.set('password', $scope.password);
		user.set('email', $scope.email);

		// other fields can be set just like with Parse.Object
		user.set('isActivated', true);

		if ($rootScope.isNewbie) {
			var mom = moment.utc().toDate();
			user.set('enrollDate',mom);
			user.set('wantsLessons',true);
			ga('send','event','Signup','click','click-signup-newbie',0);
		};

		user.set('TickerArray', [
			{"tickercode":"GOOG","tickerfull":"GOOG - Google Inc.","tickername":"Google Inc."},
			{"tickercode":"FB","tickerfull":"FB - Facebook, Inc.","tickername":"Facebook, Inc."},
			{"tickercode":"AMZN","tickerfull":"AMZN - Amazon.com, Inc.","tickername":"Amazon.com, Inc."}
		]);

		user.signUp(null, {
			success: function(user) {
				ga('send','event','Signup','click','submit-signup',1);
				console.log(user);
				$rootScope.currentUser = Parse.User.current();
                if (typeof $scope.$close() == 'function') {
					$scope.$close(user);
                };
			},
			error: function(user, error) {
				// Show the error message somewhere and let the user try again.
				alert("Error: " + error.code + " " + error.message);
			}
		});

	}

	// LOGIN/SIGNUP
	$scope.login = function() {

		ga('send','event','Login','click','click-login',0);
		Parse.User.logIn($scope.email, $scope.password, {
			success: function(user) {
				ga('send','event','Login','click','submit-login',0);
				$rootScope.currentUser = Parse.User.current();
				$rootScope.lessons = null;
                if (typeof $scope.$close() == 'function') {
					$scope.$close(user);
                };
			},
			error: function(res,error) {
				console.log(error);
				$scope.loginalert = 'Incorrect login information';
				$scope.$apply();
			}
		});
		
	};

	// RESET PASSWORD
	$scope.resetpw = function() {

		ga('send','event','PWReset','click','click-pwreset',0);
		Parse.User.requestPasswordReset($scope.email, {
			success: function() {
			    // Password reset request was sent successfully
			    ga('send','event','PWReset','click','submit-pwreset',0);
			    alert('An email has been sent to ' + $scope.email);
			},
			error: function(error) {
			    // Show the error message somewhere
			    alert(error.message);
			}
		});

	};

}]);

myapp.controller('supprestool', ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {

	$('.nav a').on('click', function(){
	    $(".navbar-toggle").click();
	});

	// TYPEAHEAD TICKER DROPDOWN
	$scope.loadingtickers = true;
	var Tickers = Parse.Object.extend('Ticker');
	var query = new Parse.Query(Tickers);
	query.equalTo('isActive', true);
	$scope.tickers = [];
	query.each(
		function(res) {
			$scope.tickers.push({
	    		tickerid: res.get('objectId'),
	    		tickercode: res.get('TickerCode'),
	    		tickername: res.get('TickerName'),
	    		tickerfull: res.get('TickerCode') + ' - ' + res.get('TickerName'),
	    		tickerres: res.get('Resist'),
	    		tickersupp: res.get('Support'),
	    		tickerclose: res.get('Close')
	    	});
		}
		,{
		success: function(fres) {
			$scope.loadingtickers = false;
			$scope.$apply();
		},
		error: function(err) {
			console.log(err);
		}
	});

	$scope.mySupport = "SUPPORT";
	$scope.myRes = "RESISTANCE";
	$scope.myClose = "Last Close";
	$scope.myTickCode = "TICKER";

	//ADD TICKER
	$scope.myTicker = undefined;
	$scope.calcSupp = function() {

		if ($scope.myTicker) {

			ga('send','event','SupportRes','click','click-ticker',0);

			$scope.tempTicker = $scope.tickers.filter(function (el) {
				return  el.tickerfull == $scope.myTicker;
			});

			if ($scope.tempTicker[0]) {

				var tmpsupp = 0
				var tmpres = 10000

				for (var i = $scope.tempTicker[0].tickersupp.length - 1; i >= 0; i--) {

					if (Number($scope.tempTicker[0].tickersupp[i].price) > Number(tmpsupp) && Number($scope.tempTicker[0].tickersupp[i].price) < Number($scope.tempTicker[0].tickerclose)) {
						tmpsupp = $scope.tempTicker[0].tickersupp[i].price;
					}
					if (i == 0) {

						if (tmpsupp > 0) {
							$scope.mySupport = Number(tmpsupp).toFixed(2);
						} else {
							$scope.mySupport = "NO SUPPORT";
						}

					}

				};

				for (var j = $scope.tempTicker[0].tickerres.length - 1; j >= 0; j--) {

					if (Number($scope.tempTicker[0].tickerres[j].price) < Number(tmpres) && Number($scope.tempTicker[0].tickerres[j].price) > Number($scope.tempTicker[0].tickerclose)) {
						tmpres = $scope.tempTicker[0].tickerres[j].price;
						console.log(tmpres);
					}

					if (j == 0) {

						if (tmpres < 10000) {
							$scope.myRes = Number(tmpres).toFixed(2);
						} else {
							$scope.myRes = "NO RESISTANCE";
						}

					}

				};

				//$scope.mySupport = $scope.tempTicker[0].tickersupp.toFixed(2);
				//$scope.myRes = $scope.tempTicker[0].tickerres.toFixed(2);
				$scope.myClose = Number($scope.tempTicker[0].tickerclose).toFixed(2);
				$scope.myTickCode = $scope.tempTicker[0].tickercode;
				$scope.myTicker = null;
				ga('send','event','SupportRes','click','submit-ticker',0);

			} else {

				$scope.myTicker = null;
				ga('send','event','SupportRes','click','reject-ticker',0);

			};

		};

	};

}]);

myapp.controller('acctCtrl', ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {

	$('.nav a').on('click', function(){
	    $(".navbar-toggle").click();
	});

	//GET USER TICKERS
	$scope.myTickers = $rootScope.currentUser.get('TickerArray');

	//GET USER EMAIL STATUS
	$scope.isActivated = $rootScope.currentUser.get('isActivated');

	//GET USER LESSONS STATUS
	$scope.isEnrolled = $rootScope.currentUser.get('wantsLessons');

	if (!$scope.myTickers) {
		$scope.myTickers = [];
	};

	$scope.saveAlert;
	$scope.saveDisable = true;

	// LOGOUT
	$scope.logout = function() {

		ga('send','event','Logout','click','click-logout',0);
		Parse.User.logOut()
			.then(function() {
				$rootScope.currentUser = Parse.User.current();
				ga('send','event','Logout','click','submit-logout',0);
                $state.go('home');
			});
		
	};

	// TYPEAHEAD TICKER DROPDOWN
	$scope.loadingtickers = true;
	var Tickers = Parse.Object.extend('Ticker');
	var query = new Parse.Query(Tickers);
	query.equalTo('isActive', true);
	$scope.tickers = [];
	query.each(
		function(res) {
			$scope.tickers.push({
	    		tickerid: res.get('objectId'),
	    		tickercode: res.get('TickerCode'),
	    		tickername: res.get('TickerName'),
	    		tickerfull: res.get('TickerCode') + ' - ' + res.get('TickerName')
	    	});
		}
		,{
		success: function(fres) {
			$scope.loadingtickers = false;
			$scope.$apply();
		},
		error: function(err) {
			console.log(err);
		}
	});

	//ADD TICKER
	$scope.myTicker = undefined;
	$scope.addTicker = function() {

		if ($scope.myTicker) {

			ga('send','event','Ticker','click','click-addticker',0);
			if ($scope.myTickers.length < 15) {

				$scope.tempTicker = $scope.tickers.filter(function (el) {
					return  el.tickerfull == $scope.myTicker;
				});

				var len = $scope.myTickers.length;

				if (len > 0) {

					for (var n = 0; n < len; n++) {
						
						if ($scope.myTickers[n].tickerfull == $scope.myTicker) {
							$scope.tickerAlert = true;
							$scope.myTicker = null;
							n = len;
						} else if (n == $scope.myTickers.length-1) {
							if ($scope.tempTicker[0]) {
								$scope.myTickers.unshift($scope.tempTicker[0]);
								$scope.saveDisable = false;
								$scope.saveAlert = false;
								$scope.myTicker = null;
								ga('send','event','Ticker','click','submit-addticker',0);
								saveTickers(true);
							};
						};

					};

				} else {

					if ($scope.tempTicker[0]) {

						$scope.myTickers.unshift($scope.tempTicker[0]);
						$scope.saveDisable = false;
						$scope.saveAlert = false;
						$scope.myTicker = null;
						ga('send','event','Ticker','click','submit-addticker',0);
						saveTickers(true);

					};
				};

			} else {

				ga('send','event','Ticker','click','reject-addticker',0);
				alert('You reached our current 15 ticker limit');

			};

		};

	};

	$scope.delTicker = function(ndx) {

		if ($scope.myTickers.length > 1) {

			$scope.myTickers.splice(ndx, 1);
			$scope.saveAlert = false;
			$scope.saveDisable = false;
			ga('send','event','Ticker','click','submit-delticker',0);
			saveTickers(false);

		} else {

			ga('send','event','Ticker','click','reject-delticker',0);
			alert('You need tickers to receive emails');

		}
	};

	function saveTickers(acti) {
		$scope.saving = true;
		ga('send','event','Ticker','click','click-saveticker',0);
		if (!$scope.isActivated) {
			$rootScope.currentUser.set('isActivated', true);
			$scope.isActivated = true;
		};
		$rootScope.currentUser.set('TickerArray',$scope.myTickers);
		$rootScope.currentUser.save(null, {
			success: function(user) {
				ga('send','event','Ticker','click','submit-saveticker',0);
				if (acti) {
					Parse.Cloud.run('activateTickers', {
						addtickers: $scope.myTickers
					}, {
						success: function(message) {
							ga('send','event','Ticker','click','submit-activateticker',0);
						},
						error: function(res,error) {
							console.log(res);
						}
					});
				};
				$scope.saving = false;
				$scope.saveDisable = true;
				$scope.saveAlert = true;
				$scope.$apply();
			},
			error: function(user, error) {
				console.log(error);
			}
		});
	};

	$scope.deactivate = function() {

		$scope.activateload = true;
		ga('send','event','Activate','click','click-deactivate',0);
		$rootScope.currentUser.set('isActivated',false);
		$rootScope.currentUser.save(null, {
			success: function(user) {
				ga('send','event','Activate','click','submit-deactivate',-1);
				$scope.activateload = false;
				$scope.isActivated = false;
				$scope.$apply();
			},
			error: function(user, error) {
				console.log(error);
			}
		});
		
	};

	$scope.activate = function() {

		$scope.activateload = true;
		ga('send','event','Activate','click','click-activate',0);
		$rootScope.currentUser.set('isActivated',true);
		$rootScope.currentUser.save(null, {
			success: function(user) {
				ga('send','event','Activate','click','submit-activate',1);
				$scope.activateload = false;
				$scope.isActivated = true;
				$scope.$apply();
			},
			error: function(user, error) {
				console.log(error);
			}
		});
		
	};

	$scope.courseEnroll = function() {

		console.log('enroll');

		ga('send','event','Enroll','click','click-enroll-account',0);
		//var tempuser = Parse.User.current();
		var mom = moment.utc().toDate();
		var userenrolldate = $rootScope.currentUser.get('enrollDate');
		if (!userenrolldate) {
			$rootScope.currentUser.set('enrollDate',mom);
		};
		$rootScope.currentUser.set('wantsLessons',true);
		$rootScope.currentUser.save(null, {
			success: function(res) {
				ga('send','event','Enroll','submit','submit-enroll-account',0);
				$scope.isEnrolled = true;
				console.log($scope.isEnrolled);
				$scope.$apply();
			},
			error: function(user, error) {
				console.log(error);
			}
		})

	}

	$scope.courseUnenroll = function() {

		console.log('unenroll');

		ga('send','event','Enroll','click','click-unenroll-account',0);
		//var tempuser = Parse.User.current();
		var mom = moment.utc().toDate();
		$rootScope.currentUser.set('wantsLessons',false);
		$rootScope.currentUser.save(null, {
			success: function(res) {
				ga('send','event','Enroll','submit','submit-unenroll-account',0);
				$scope.isEnrolled = false;
				console.log($scope.isEnrolled);
				$scope.$apply();
			},
			error: function(user, error) {
				console.log(error);
			}
		})

	}

}]);

myapp.controller('blogCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$location', function ($rootScope, $scope, $state, $stateParams, $location) {

	$('.nav a').on('click', function(){
	    $(".navbar-toggle").click();
	});

	if (!$rootScope.posts) {
		var Whys = Parse.Object.extend('Whys');
		var bquery = new Parse.Query(Whys);
		bquery.descending('WhyDate');
		bquery.lessThan('WhyDate',moment.utc().toDate());
		bquery.equalTo('isUsed',true);
		$rootScope.posts = [];
		var ndx = 1;
		bquery.find({
			success: function(res) {

				for (var i = 0; i < res.length; i++) {

					$rootScope.posts.push({
			    		postid: res[i].id,
			    		posttitle: res[i].get('unWhyTitle'),
			    		postcontent: res[i].get('unWhyContent'),
			    		postdate: moment(res[i].get('WhyDate')).format('MMMM Do YYYY'),
			    		postndx: i+1
			    	});

					if (i == res.length-1) {

						if ($rootScope.$stateParams.postid) {

							var tempthepost = $rootScope.posts.filter(function (el) {
								return  el.postid == $rootScope.$stateParams.postid;
							});

							if (tempthepost[0]) {

								$scope.thepost = tempthepost[0];

								$scope.lastpost = $rootScope.posts.filter(function (el) {
									return  el.postndx == $scope.thepost.postndx - 1;
								});

								$scope.nextpost = $rootScope.posts.filter(function (el) {
									return  el.postndx == $scope.thepost.postndx + 1;
								});

								$state.go('post',{postid: $scope.thepost.postid});

							} else {

								$state.go('post',{postid: $rootScope.posts[0].postid});

							}

						} else if ($rootScope.searchpost) {

							var tempthepost = $rootScope.posts.filter(function (el) {
								return  el.postid == $rootScope.searchpost;
							});

							if (tempthepost[0]) {

								$scope.thepost = tempthepost[0];

								$scope.lastpost = $rootScope.posts.filter(function (el) {
									return  el.postndx == $scope.thepost.postndx - 1;
								});

								$scope.nextpost = $rootScope.posts.filter(function (el) {
									return  el.postndx == $scope.thepost.postndx + 1;
								});

								$state.go('post',{postid: $scope.thepost.postid});

							} else {

								$rootScope.searchpost = null;
								$state.go('post',{postid: $rootScope.posts[0].postid});

							};
						
						} else {

							var tempthepost = $rootScope.posts.filter(function (el) {
								return  el.postid == $rootScope.posts[0].postid;
							});

							$scope.thepost = tempthepost[0];

							$scope.lastpost = $rootScope.posts.filter(function (el) {
								return  el.postndx == $scope.thepost.postndx - 1;
							});

							$scope.nextpost = $rootScope.posts.filter(function (el) {
								return  el.postndx == $scope.thepost.postndx + 1;
							});

							$state.go('post',{postid: $scope.thepost.postid});
						
						};

					};

				};

			},
			error: function(err) {
				console.log(err);
			}
		});
	} else if (!$rootScope.$stateParams.postid) {
		
		var tempthepost = $rootScope.posts.filter(function (el) {
			return  el.postid == $rootScope.posts[0].postid;
		});

		if (tempthepost[0]) {

			$scope.thepost = tempthepost[0];

			$scope.lastpost = $rootScope.posts.filter(function (el) {
				return  el.postndx == $scope.thepost.postndx - 1;
			});

			$scope.nextpost = $rootScope.posts.filter(function (el) {
				return  el.postndx == $scope.thepost.postndx + 1;
			});

			$state.go('post',{postid: $scope.thepost.postid});

		};

	} else if ($rootScope.$stateParams.postid && $rootScope.posts) {

		var tempthepost = $rootScope.posts.filter(function (el) {
			return  el.postid == $rootScope.$stateParams.postid;
		});

		if (tempthepost[0]) {

			$scope.thepost = tempthepost[0];

			$scope.lastpost = $rootScope.posts.filter(function (el) {
				return  el.postndx == $scope.thepost.postndx - 1;
			});

			$scope.nextpost = $rootScope.posts.filter(function (el) {
				return  el.postndx == $scope.thepost.postndx + 1;
			});

			$state.go('post',{postid: $scope.thepost.postid});

		} else {

			$state.go('blog');
			
		}

	}

}]);

myapp.controller('postCtrl', ['$rootScope', '$scope', '$state', '$stateParams', function ($rootScope, $scope, $state, $stateParams) {

	$('.nav a').on('click', function(){
	    $(".navbar-toggle").click();
	});

	if (!$rootScope.posts || !$rootScope.$stateParams.postid) {

		if ($rootScope.$stateParams.postid) {
			$rootScope.searchpost = $rootScope.$stateParams.postid;
		};

		$state.go('blog');
	};

	if ($rootScope.posts) {

		var tempthepost = $rootScope.posts.filter(function (el) {
			return  el.postid == $rootScope.$stateParams.postid;
		});

		if (tempthepost[0]) {

			$scope.thepost = tempthepost[0];

			$scope.lastpost = $rootScope.posts.filter(function (el) {
				return  el.postndx == $scope.thepost.postndx - 1;
			});

			$scope.nextpost = $rootScope.posts.filter(function (el) {
				return  el.postndx == $scope.thepost.postndx + 1;
			});

		} else {

			$state.go('post',{postid: $rootScope.posts[0].postid});
			
		}

	};

	$scope.rightarrow = function() {

		if ($scope.nextpost[0].postndx - 1 == $scope.thepost.postndx) {

			$state.go('post',{postid: $scope.nextpost[0].postid});

		};

	}

	$scope.leftarrow = function() {

		if ($scope.lastpost[0].postndx + 1 == $scope.thepost.postndx) {

			$state.go('post',{postid: $scope.lastpost[0].postid});

		};

	}

	$scope.gotoPost = function(targpost) {

		$state.go('post',{postid: targpost});

	}

	//SIGN UP MODAL from Home
	$scope.signModalA = function () {

		ga('send','event','Signup','click','click-signupmodal-archive',0);
		$rootScope.isSignup = true;
		$rootScope.isNewbie = false;
		if ($rootScope.currentUser) {
			$state.go('account', { userId: $rootScope.currentUser.id });
		} else {
			$state.go('account');
		};
		
	};

}]);



myapp.controller('courseCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$location', function ($rootScope, $scope, $state, $stateParams, $location) {

	$('.nav a').on('click', function(){
	    $(".navbar-toggle").click();
	});

	if ($rootScope.currentUser) {

		$scope.needsignup = false;
		$scope.notenrolled = false;
		$scope.nolessons = false;
		$scope.courseloading = true;

		if (!$rootScope.lessons) {

			var userenrolldate = $rootScope.currentUser.get('enrollDate');

			console.log(userenrolldate);

			if (userenrolldate) {

				$scope.notenrolled = false;

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

				console.log(daycount);

				var Lessons = Parse.Object.extend('Lessons');
				var cquery = new Parse.Query(Lessons);
				cquery.ascending('LessonNumber');
				cquery.equalTo('LessonPlan', 1);
				cquery.lessThan('LessonNumber',daycount);
				$rootScope.lessons = [];
				var ndx = 1;
				cquery.find({
					success: function(res) {

						if (res.length > 0) {

							$scope.nolessons = false;

							for (var i = 0; i < res.length; i++) {

								$rootScope.lessons.push({
						    		lessonid: res[i].id,
						    		lessontitle: res[i].get('LessonTitle'),
						    		lessoncontent: res[i].get('LessonContent'),
						    		lessonndx: i+1
						    	});

								if (i == res.length-1) {

									if ($rootScope.$stateParams.lessonid) {

										var tempthelesson = $rootScope.lessons.filter(function (el) {
											return  el.lessonid == $rootScope.$stateParams.lessonid;
										});

										if (tempthelesson[0]) {

											$scope.thelesson = tempthelesson[0];

											$scope.lastlesson = $rootScope.lessons.filter(function (el) {
												return  el.lessonndx == $scope.thelesson.lessonndx - 1;
											});

											$scope.nextlesson = $rootScope.lessons.filter(function (el) {
												return  el.lessonndx == $scope.thelesson.lessonndx + 1;
											});

											$state.go('lesson',{lessonid: $scope.thelesson.lessonid});

										} else {

											console.log('lessonid was wrong -> default');

											$state.go('lesson',{lessonid: $rootScope.lessons[0].lessonid});

										}

									} else if ($rootScope.searchlesson) {
									
										console.log('searchlesson');

										var tempthelesson = $rootScope.lessons.filter(function (el) {
											return  el.lessonid == $rootScope.searchlesson;
										});

										if (tempthelesson[0]) {

											$scope.thelesson = tempthelesson[0];

											$scope.lastlesson = $rootScope.lessons.filter(function (el) {
												return  el.lessonndx == $scope.thelesson.lessonndx - 1;
											});

											$scope.nextlesson = $rootScope.lessons.filter(function (el) {
												return  el.lessonndx == $scope.thelesson.lessonndx + 1;
											});

											$state.go('lesson',{lessonid: $scope.thelesson.lessonid});

										} else {

											$rootScope.searchlesson = null;
											$state.go('lesson',{lessonid: $rootScope.lessons[0].lessonid});

										};
									
									} else {
									
										console.log('default lesson');

										var tempthelesson = $rootScope.lessons.filter(function (el) {
											return  el.lessonid == $rootScope.lessons[0].lessonid;
										});

										$scope.thelesson = tempthelesson[0];

										$scope.lastlesson = $rootScope.lessons.filter(function (el) {
											return  el.lessonndx == $scope.thelesson.lessonndx - 1;
										});

										$scope.nextlesson = $rootScope.lessons.filter(function (el) {
											return  el.lessonndx == $scope.thelesson.lessonndx + 1;
										});

										$state.go('lesson',{lessonid: $scope.thelesson.lessonid});
									
									};

								};

							};

						} else {

							$scope.courseloading = false;
							$scope.nolessons = true;
							$scope.$apply();

						};

					},
					error: function(err) {
						console.log(err);
					}
				});

			} else {

				$scope.courseloading = false;
				$scope.notenrolled = true;

			};

		} else if ($rootScope.lessons[0] && !$rootScope.$stateParams.lessonid) {
				
			var tempthelesson = $rootScope.lessons.filter(function (el) {
				return  el.lessonid == $rootScope.lessons[0].lessonid;
			});

			if (tempthelesson[0]) {

				$scope.thelesson = tempthelesson[0];

				$scope.lastlesson = $rootScope.lessons.filter(function (el) {
					return  el.lessonndx == $scope.thelesson.lessonndx - 1;
				});

				$scope.nextlesson = $rootScope.lessons.filter(function (el) {
					return  el.lessonndx == $scope.thelesson.lessonndx + 1;
				});

				$state.go('lesson',{lessonid: $scope.thelesson.lessonid});

			};

		} else if ($rootScope.$stateParams.lessonid && $rootScope.lessons[0]) {

			var tempthelesson = $rootScope.lessons.filter(function (el) {
				return  el.lessonid == $rootScope.$stateParams.lessonid;
			});

			if (tempthelesson[0]) {

				$scope.thelesson = tempthelesson[0];

				$scope.lastlesson = $rootScope.lessons.filter(function (el) {
					return  el.lessonndx == $scope.thelesson.lessonndx - 1;
				});

				$scope.nextlesson = $rootScope.lessons.filter(function (el) {
					return  el.lessonndx == $scope.thelesson.lessonndx + 1;
				});

				$state.go('lesson',{lessonid: $scope.thelesson.lessonid});

			} else {

				$state.go('course');
				
			}

		} else {

			$scope.courseloading = false;
			$scope.nolessons = true;

		}

	} else {

		$scope.courseloading = false;
		$scope.needsignup = true;

	}

	//SIGN UP MODAL from Course
	$scope.signModalL = function () {

		ga('send','event','Signup','click','click-signupmodal-coursenewbie',0);
		$rootScope.isSignup = true;
		$rootScope.isNewbie = true;
		if ($rootScope.currentUser) {
			$state.go('account', { userId: $rootScope.currentUser.id });
		} else {
			$state.go('account');
		};
		
	};

	$scope.courseEnroll = function() {

		ga('send','event','Enroll','click','click-enroll-course',0);
		var tempuser = Parse.User.current();
		var mom = moment.utc().toDate();
		tempuser.set('enrollDate',mom);
		tempuser.set('wantsLessons',true);
		tempuser.save({
			success: function(res) {
				ga('send','event','Enroll','submit','submit-enroll-course',0);
				$state.go('course');
			}
		})

	}

}]);

myapp.controller('lessonCtrl', ['$rootScope', '$scope', '$state', '$stateParams', function ($rootScope, $scope, $state, $stateParams) {

	$('.nav a').on('click', function(){
	    $(".navbar-toggle").click();
	});

	if (!$rootScope.lessons || !$rootScope.$stateParams.lessonid || !$rootScope.lessons[0]) {

		if ($rootScope.$stateParams.lessonid) {
			$rootScope.searchlesson = $rootScope.$stateParams.lessonid;
		};

		$state.go('course');
	};

	if ($rootScope.lessons && $rootScope.lessons[0]) {

		var tempthelesson = $rootScope.lessons.filter(function (el) {
			return  el.lessonid == $rootScope.$stateParams.lessonid;
		});

		if (tempthelesson[0]) {

			$scope.thelesson = tempthelesson[0];

			$scope.lastlesson = $rootScope.lessons.filter(function (el) {
				return  el.lessonndx == $scope.thelesson.lessonndx - 1;
			});

			$scope.nextlesson = $rootScope.lessons.filter(function (el) {
				return  el.lessonndx == $scope.thelesson.lessonndx + 1;
			});

		} else {

			$state.go('lesson',{lessonid: $rootScope.lessons[0].lessonid});
			
		}

	};

	$scope.rightarrow = function() {

		if ($scope.nextlesson[0].lessonndx - 1 == $scope.thelesson.lessonndx) {

			$state.go('lesson',{lessonid: $scope.nextlesson[0].lessonid});

		};

	}

	$scope.leftarrow = function() {

		if ($scope.lastlesson[0].lessonndx + 1 == $scope.thelesson.lessonndx) {

			$state.go('lesson',{lessonid: $scope.lastlesson[0].lessonid});

		};

	}

	$scope.gotoLesson = function(targlesson) {
		
		$state.go('lesson',{lessonid: targlesson});

	}

}]);




