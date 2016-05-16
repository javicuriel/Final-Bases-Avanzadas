angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider



      .state('tabsController.menu', {
    url: '/page2',
    views: {
      'tab1': {
        templateUrl: 'templates/menu.html',
        controller: 'menuCtrl'
      }
    }
  })

  .state('tabsController.checkOut', {
    url: '/page3',
    views: {
      'tab2': {
        templateUrl: 'templates/checkOut.html',
        controller: 'checkOutCtrl'
      }
    }
  })

    .state('tabsController.receta', {
    url: '/page4/:recetaID',
    views: {
      'tab1': {
        templateUrl: 'templates/receta.html',
        controller: 'recetaCtrl'
      }
    }
  })

     .state('tabsController.editreceta', {
    url: '/page5/:recetaID',
    views: {
      'tab1': {
        templateUrl: 'templates/editarReceta.html',
        controller: 'editRecetaCtrl'
      }
    }
  })

     .state('tabsController.editproducto', {
    url: '/page6/:recetaID/:productoID',
    views: {
      'tab1': {
        templateUrl: 'templates/editarIngrediente.html',
        controller: 'editProductoCtrl'
      }
    }
  })
     .state('tabsController.producto', {
    url: '/page7/:recetaID/:productoID',
    views: {
      'tab1': {
        templateUrl: 'templates/ingrediente.html',
        controller: 'productoCtrl'
      }
    }
  })

.state('tabsController.agregarIngrediente', {
    url: '/page8/:recetaID',
    views: {
      'tab1': {
        templateUrl: 'templates/agregarIngredientes.html',
        controller: 'agregarIngreCtrl'
      }
    }
  })

.state('tabsController.cantidadIngredientes', {
    url: '/page9/:recetaID',
    views: {
      'tab1': {
        templateUrl: 'templates/cantidadIngredientes.html',
        controller: 'cantIngreCtrl'
      }
    }
  })

  .state('tabsController.todosIngredientes', {
    url: '/page10',
    views: {
      'tab3': {
        templateUrl: 'templates/todosIngredientes.html',
        controller: 'todosIngredientesCtrl'
      }
    }
  })
  .state('tabsController.cantidades', {
    url: '/page11/:productoID',
    views: {
      'tab3': {
        templateUrl: 'templates/cantidades.html',
        controller: 'cantidadesCtrl'
      }
    }
  })
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true,
    controller: 'tabsCtrl'
  })

$urlRouterProvider.otherwise('/page1/page3')



});
