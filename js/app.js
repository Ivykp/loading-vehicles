function xlsx_to_json(fileData){
  var res = {};
  var workbook = XLSX.read(fileData, { type: 'binary' });
  workbook.SheetNames.forEach( (name) => {
    res[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
  } );
  return res;
}

var app = angular.module('app', []);

/**
 * Took from http://odetocode.com/blogs/scott/archive/2013/07/03/building-a-filereader-service-for-angularjs-the-service.aspx
 */
(function (module) {

  var fileReader = function ($q, $log) {

    var onLoad = function (reader, deferred, scope) {
      return function () {
        scope.$apply(function () {
          deferred.resolve(reader.result);
        });
      };
    };

    var onError = function (reader, deferred, scope) {
      return function () {
        scope.$apply(function () {
          deferred.reject(reader.result);
        });
      };
    };

    var onProgress = function (reader, scope) {
      return function (event) {
        scope.$broadcast("fileProgress",
          {
            total: event.total,
            loaded: event.loaded
          });
      };
    };
    var getReader = function (deferred, scope) {

      var reader = new FileReader();
      reader.onload = onLoad(reader, deferred, scope);
      reader.onerror = onError(reader, deferred, scope);
      reader.onprogress = onProgress(reader, scope);
      return reader;
    };

    var readAsDataURL = function (file, scope) {
      var deferred = $q.defer();

      var reader = getReader(deferred, scope);
      reader.readAsDataURL(file);

      return deferred.promise;
    };

    var readAsBinaryString = function (file, scope) {
      var deferred = $q.defer();

      var reader = getReader(deferred, scope);
      reader.readAsBinaryString(file);

      return deferred.promise;
    }

    return {
      readAsDataUrl: readAsDataURL,
      readAsBinaryString: readAsBinaryString
    };
  };

  module.factory("fileReader",
    ["$q", "$log", fileReader]);

} (angular.module("app")));

var emptyObject = {
  num1: 0,
  num2: 0,
  num3: 0,
  num4: 0
}

var schemaKeys = Object.keys(emptyObject); 

/**
 * Directive taken from http://stackoverflow.com/questions/17922557/angularjs-how-to-check-for-changes-in-file-input-fields
 */
app.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeHandler);
    }
  };
})
.controller('parseFile', ['$scope', 'fileReader', function($scope, fileReader){
  $scope.file = {};
  $scope.result = undefined;
  $scope.error = '';
  $scope.keys = [];
  $scope.schemaKeys = schemaKeys;
  $scope.data = {
    model: { }
  };

  $scope.readFile = function(){
    fileReader.readAsBinaryString($scope.file, $scope)
      .then((res) => {
        $scope.result = xlsx_to_json(res);
        $scope.getKeys();
      })
      .catch((err) => $scope.error = err);
  };

  $scope.fileChanged = function(e){
    $scope.file = e.target.files[0];
  };

  $scope.getKeys = function(){
    var firstSheet = Object.keys($scope.result)[0];
    $scope.keys = Object.keys($scope.result[firstSheet][0]);
  };

  $scope.replaceKeysByModel = function(object, model){
    var res = Object.assign({}, object);
    var sKeys = [];
    
    for(var key in model) {
      sKeys.push(model[key]);
    }

    sKeys.forEach( (key) => {
      var oldKey = Object.keys(model).filter( (myKey) => { return model[myKey] === key })[0];
      res[key] = res[oldKey];
      delete res[oldKey]
    } );
    return res;
  };

  $scope.generate = function(){
    var final = [];
    var firstSheet = Object.keys($scope.result)[0];
    var sheet = $scope.result[firstSheet];
    
    sheet.forEach( (item) => {
      final.push($scope.replaceKeysByModel(item, $scope.data.model));
    } )
    
    console.log(final);
  }
}]);