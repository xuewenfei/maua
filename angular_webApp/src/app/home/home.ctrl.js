/**
 * Created by Jose on 5/8/14.
 */
app.controller('HomeController', function ($scope,$rootScope,$route) {
    $scope.setView= function(activeView){

        $rootScope.view =activeView;
        $route.reload();
    };
});