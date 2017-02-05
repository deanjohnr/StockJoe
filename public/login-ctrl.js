var userapp = angular.module('user',[
	'ui.bootstrap',
	]);

userapp.controller('loginCtrl', function ($scope) {

	$scope.signup = function() {

		var user = new Parse.User();
		user.set('username', $scope.email);
		user.set('password', $scope.password);
		user.set('email', $scope.email);

		// other fields can be set just like with Parse.Object
		user.set('myTickers', $scope.myTickers);

		user.signUp(null, {
			success: function(user) {
				// Hooray! Let them use the app now.
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

		Parse.User.logIn($scope.email, $scope.password, {
			success: function(user) {
				$rootScope.currentUser = Parse.User.current();
                if (typeof $scope.$close() == 'function') {
					$scope.$close(user);
                };
			},
			error: function(user, error) {
				console.log(error);
				// The login failed. Check error to see why.
				if (error == Parse.Error.EMAIL_NOT_FOUND) {
					$scope.loginalert = 'Email was not found, signup!'
				};		
			}
		});
		
	};

	$scope.resetPw = function() {

		Parse.User.requestPasswordReset($scope.email, {
			success: function() {
			    // Password reset request was sent successfully
			},
			error: function(error) {
			    // Show the error message somewhere
			    alert("Error: " + error.code + " " + error.message);
			}
		});

	};

	$scope.cancel = $scope.$dismiss;

});