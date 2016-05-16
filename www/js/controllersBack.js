angular.module('app.controllers', [])

// .controller('menuCtrl', function($scope,$http) {


// $scope.restcall = function(){
// 	var call = '{ "statements" : [ { "statement" : "MATCH (n) RETURN n" } ] }';
//   	$http({
//                 method: 'POST',
//                 url: 'http://localhost:7474/db/data/transaction/commit',
//                 data: call
//  	})
//  	.success(function (data, status) {
//                         $scope.status = status;
//                         $scope.response = data.results;
//                         $scope.items = data.results[0].data
//             })
//  	.error(function (data, status) {
//                         $scope.response = data || "Request failed";
//                         $scope.status = status;
//             })
// 	}

// })
.service('servicioIngredientes',function(){
    var ingredientes = [];

    var agregarProducto = function(nuevo){
        ingredientes.push(nuevo);
    }

    var getProductos = function(){
        return ingredientes;
    }

    return{
        agregarProducto: agregarProducto,
        getProductos: getProductos
    }
})

.service('badges',function($rootScope){
    var totalProductosElaborados = 0;

    var agregarProducto = function(){
        totalProductosElaborados++;
        $rootScope.$broadcast('update');
    }
    var setTotal= function(cantidad){
        totalProductosElaborados = cantidad;
        $rootScope.$broadcast('update');
    }
    var quitarProducto = function(){
        if(!totalProductosElaborados==0)
            totalProductosElaborados--;
        $rootScope.$broadcast('update');
    }

    var getProductos = function(){
        return totalProductosElaborados;
    }

    return{
        agregarProducto: agregarProducto,
        quitarProducto: quitarProducto,
        setTotal: setTotal,
        getProductos: getProductos
    }
})

.service('conexion',function($http){
    this.getResultados = function(query){
      return $http({
          method: 'POST',
          url: 'http://localhost:7474/db/data/transaction/commit',
          data: query
      })
    }
})


.controller('menuCtrl', function($scope,$http,$state,$ionicPopup,badges) {
    $scope.agregar = false;
    $scope.setAgregar = function(){
        $scope.agregar = true;
    }
    $scope.cambia = function(item){
        if(!$scope.agregar)
            $state.go('tabsController.receta',{recetaID: item.row[1]});
        else{
            $scope.loadInventario(item);
            $scope.agregar = false;
        }
    }

    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta) where ID(r) = '+item.row[1]+' detach delete r" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: llamada
        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items.splice($scope.items.indexOf(item),1);
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };
    $scope.comparaInventarios = function(item){
        var x = 0;
        var y = 0;
            var call = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto)-[e:Existe]->(i:Inventario) where id(r) = '+item.row[1]+' and (r)-[l]->(p)-[e]->(i)  match(r)-[w:Lleva]->(x:Producto)  return count(distinct x), count(distinct p);" } ] }';
            $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call
            })
            .success(function (data, status) {
                $scope.status = status;
                $scope.response = data.results;
                $scope.cuentas = data.results[0].data;
                if($scope.cuentas[0].row[0] == $scope.cuentas[0].row[1]){
                    $scope.checaInventario(item);
                }
                else{
                    var alertPopup = $ionicPopup.alert({
                        title: 'Error',
                        template: 'No hay suficientes ingredientes en el inventario.'
                    });
                }

            })
            .error(function (data, status) {
                $scope.response = data || "Request failed";
                $scope.status = status;
            })



        // if($scope.item1 == $scope.item2){
        //     $scope.checaInventario(item);
        //     console.log($scope.item1.row);
        //     console.log($scope.item2.row);
        // }
        // else{
        //     console.log($scope.item1.row);
        //     console.log($scope.item2.row);
        //     var alertPopup = $ionicPopup.alert({
        //             title: 'Error',
        //             template: 'No hay suficientes ingredientes en el inventario.'
        //     });
        // };

    }
    $scope.loadInventario = function(item) {
        var call = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto),(i:Inventario) where (r)-[l]->(p)-[:Existe]-(i) and id(r) = '+item.row[1]+' return i.cantidad,id(i),l.cantidad,id(p);" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.loadedInventario = data.results[0].data
            $scope.comparaInventarios(item);
            // $scope.checaInventario(item);
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };
    $scope.checaInventario = function(item) {
        var sePuede = true;
        var temporal;
        console.log($scope.loadedInventario);
        for(i = 0; i < Object.keys($scope.loadedInventario).length; i++){
            temporal = $scope.loadedInventario[i].row[3];
            console.log($scope.loadedInventario[i]);
            if($scope.loadedInventario[i].row[2] > $scope.loadedInventario[i].row[0]){
                if(!$scope.loadedInventario[i+1]){
                    sePuede = false;
                    break;
                }
                if(temporal != $scope.loadedInventario[i+1].row[3]){
                    sePuede = false;
                    break;
                }
            }
        }
        if(sePuede)
            $scope.creaProductoElaborado(item);
        else{
            var alertPopup = $ionicPopup.alert({
                    title: 'Error',
                    template: 'No hay suficientes ingredientes en el inventario.'
            });
        }
    };
    $scope.creaProductoElaborado = function(item){
        for(i = 0; i < Object.keys($scope.loadedInventario).length+1; i++){
            if(i == Object.keys($scope.loadedInventario).length)
                var call = '{ "statements" : [ { "statement" : "match(r:Receta) where id(r) = '+item.row[1]+' create (x:Producto_Elaborado) create(x)-[:Genero]->(r) " } ] }';
            else
                var call = '{ "statements" : [ { "statement" : "match (i:Inventario) where id(i) = '+$scope.loadedInventario[i].row[1]+' set i.cantidad = i.cantidad - '+$scope.loadedInventario[i].row[2]+' " } ] }';
            $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call
            })
            .success(function (data, status) {
                $scope.status = status;
                $scope.response = data.results;
            })
            .error(function (data, status) {
                $scope.response = data || "Request failed";
                $scope.status = status;
            })
        }
        badges.agregarProducto();
    };

    $scope.doRefresh = function() {
        var call = '{ "statements" : [ { "statement" : "MATCH (r:Receta) RETURN r ,id(r)" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items = data.results[0].data
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    };


})

.controller('recetaCtrl', function($scope,$http,$stateParams,$ionicModal,$ionicSlideBoxDelegate) {
    $scope.current = $stateParams.recetaID;

    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta)-[l:Lleva]->(p:Producto) where ID(r) = '+$stateParams.recetaID+' and ID(p) = '+item.row[1]+' delete l" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: llamada

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items.splice($scope.items.indexOf(item),1);
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };

    $scope.doRefresh = function() {
        var call = '{ "statements" : [ { "statement" : "MATCH (r:Receta),(p:Producto) WHERE id(r) = '+$stateParams.recetaID+'  match (r)-[l:Lleva]->(p) RETURN p,id(p),l.cantidad;" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call
        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items = data.results[0].data
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    $scope.loadNuevos = function(){
        var call = '{ "statements" : [ { "statement" : "MATCH (r:Receta),(p:Producto) WHERE id(r) = '+$stateParams.recetaID+' and not (r)-[:Lleva]->(p) RETURN p,id(p);" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.nuevos = data.results[0].data
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };

    $ionicModal.fromTemplateUrl('templates/selectModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.selectModal = modal;
            $scope.selectModalSlider = $ionicSlideBoxDelegate.$getByHandle('modalSlider');
            $scope.selectModalSlider.enableSlide(false);
    });

    $scope.seleccionados =[];
    $scope.cantidades = {};
    $scope.closeSelectModal = function() {
        if ($scope.selectModalSlider.currentIndex() == 0){
            $scope.selectModal.hide();
        }
        else{
            $scope.selectModalSlider.previous();
        }
        $scope.seleccionados =[];
        $scope.cantidades = {};
    };

    $scope.openSelectModal = function() {
        $scope.selectModalSlider.slide(0);
        $scope.itemSelected = false;
        $scope.selectModal.show();
        $scope.loadNuevos();
    };

    $scope.cambiaSlide = function() {
        if ($scope.selectModalSlider.currentIndex() == 0){
            for(i = 0; i < Object.keys($scope.nuevos).length; i++){
                    if($scope.nuevos[i].checked){
                        $scope.seleccionados.push($scope.nuevos[i]);
                    }
                }
            $ionicSlideBoxDelegate.$getByHandle('modalSlider').next();
        }
        else{
            $scope.save();
            $scope.selectModal.hide();
        }
    };

    $scope.save = function(){
        for(i = 0; i < Object.keys($scope.seleccionados).length; i++){
            var call = '{ "statements" : [ { "statement" : "match(r:Receta),(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$scope.seleccionados[i].row[1]+' create(r)-[l:Lleva {cantidad:'+$scope.cantidades[i].item+'}]->(p)" } ] }';
            $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call
            })
            .success(function (data, status) {
                $scope.status = status;
                $scope.response = data.results;
            })
            .error(function (data, status) {
                $scope.response = data || "Request failed";
                $scope.status = status;
            })
        }
    };

    //Modal para editar

  //   $scope.editItem;
  //   $scope.cantidad = {};
  //   $scope.setEditItem = function (item){
  //       $scope.cantidad = {};
  //       $scope.editItem = item;
  //       $scope.cantidad = item.row[2];
  //       console.log($scope.cantidad);
  //       $scope.openEditarIngrediente();
  //   };
  //   $ionicModal.fromTemplateUrl('templates/editarIngredienteX.html', {
  //   scope: $scope,
  //   animation: 'slide-in-up'
  // }).then(function(modal) {
  //   $scope.editarIngrediente = modal;
  // });
  // $scope.closeEditarIngrediente = function() {
  //   $scope.editarIngrediente.hide();
  //   $scope.cantidad = {};
  // };
  // $scope.openEditarIngrediente = function() {
  //   $scope.editarIngrediente.show();
  // };
  // $scope.editar = function(){

  //       var llamar = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$scope.editItem.row[1]+' set l.cantidad = '+$scope.cantidad+'" } ] }';
  //       $http({
  //               method: 'POST',
  //               url: 'http://localhost:7474/db/data/transaction/commit',
  //               data: llamar

  //   })

  //   .success(function (data, status) {
  //                       $scope.status = status;
  //                       $scope.response = data.results;
  //           })
  //   .error(function (data, status) {
  //                       $scope.response = data || "Request failed";
  //                       $scope.status = status;
  //           })
  //   $scope.closeEditarIngrediente();
  //   console.log(llamar);
  //   }




})

  .controller('editRecetaCtrl', function($scope,$http,$stateParams) {
    $scope.editar = function(nombre,costo){
        var llamar = '{ "statements" : [ { "statement" : "match(r:Receta) where id(r) = '+$stateParams.recetaID+' set r.nombre = {nombre}, r.costo = '+costo+'","parameters":{"nombre": \"'+nombre+'\"} } ] }';
        $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: llamar

    })

    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })
    }

    var call = '{ "statements" : [ { "statement" : "match(r:Receta) where id(r) = '+$stateParams.recetaID+' return r ,id(r)" } ] }';
    $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call

    })
    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
                        $scope.items = data.results[0].data;
                        $scope.nombre = data.results[0].data[0].row[0].nombre;
                        $scope.costo = data.results[0].data[0].row[0].costo;
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })




})
.controller('editProductoCtrl', function($scope,$http,$stateParams) {
    $scope.editar = function(cantidad){
        var llamar = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$stateParams.productoID+' set l.cantidad = '+cantidad+'" } ] }';
        $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: llamar

    })

    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })
    }

    var call = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$stateParams.productoID+' return l ,id(l)" } ] }';
    $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call

    })
    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
                        $scope.items = data.results[0].data;
                        $scope.cantidad = data.results[0].data[0].row[0].cantidad;
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })



})

.controller('productoCtrl', function($scope,$http,$stateParams) {
    $scope.calcula = function(){
        var llamar = '{ "statements" : [ { "statement" : "start p= node('+$stateParams.productoID+') match p-[:Existe*]->c return c" } ] }';
        $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: llamar

    })

        .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
                        $scope.calcula =data.results[0].data
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })
    }

    var call = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$stateParams.productoID+' return r,l,p" } ] }';
    $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call

    })
    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
                        $scope.items = data.results[0].data
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })

})

.controller('agregarIngreCtrl', function($scope,$http,$stateParams,servicioIngredientes) {
    $scope.current = $stateParams.recetaID;
    $scope.select = function(){
        for(i = 0; i < Object.keys($scope.items).length; i++){
            if($scope.items[i].checked){
                servicioIngredientes.agregarProducto($scope.items[i]);
            }
        }
    }
    var call = '{ "statements" : [ { "statement" : "MATCH (r:Receta),(p:Producto) WHERE id(r) = '+$stateParams.recetaID+' and not (r)-[:Lleva]->(p) RETURN p,id(p);" } ] }';
    $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call

    })
    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
                        $scope.items = data.results[0].data
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })

})

.controller('cantIngreCtrl', function($scope,$http,$stateParams,servicioIngredientes) {
    $scope.items = servicioIngredientes.getProductos();
    $scope.current = $stateParams.recetaID;
    $scope.cantidades = {};
    $scope.save = function(){
        for(i = 0; i < Object.keys($scope.items).length; i++){
            var call = '{ "statements" : [ { "statement" : "match(r:Receta),(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$scope.items[i].row[1]+' create(r)-[l:Lleva {cantidad:'+$scope.cantidades[i].item+'}]->(p)" } ] }';
    $http({
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: call

    })
    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })
        }

    }

})

.controller('todosIngredientesCtrl', function($scope,$http,$ionicModal,$ionicPopup) {
    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta) where ID(r) = '+item.row[1]+' detach delete r" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: llamada
        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items.splice($scope.items.indexOf(item),1);
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };

    $scope.doRefresh = function(){
        var call = '{ "statements" : [ { "statement" : "MATCH (p:Producto) RETURN p ,id(p)" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items = data.results[0].data
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    $scope.edit = function(nombre){
        if($scope.nuevo)
            var call = '{ "statements" : [ { "statement" : "create (p:Producto {nombre:{x}})" ,"parameters":{"x": \"'+nombre+'\"} } ] }';
        else
            var call = '{ "statements" : [ { "statement" : "match(p:Producto) where id(p) = '+$scope.editItem.row[1]+' set p.nombre = {x}" ,"parameters":{"x": \"'+nombre+'\"} } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
        $scope.closeModal();
    }

    $scope.borrar = function(item){
        var call = '{ "statements" : [ { "statement" : "MATCH (p:Producto) where id(p) = '+item.row[1]+' detach delete p" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items.splice($scope.items.indexOf(item),1);
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    }
    $scope.checkBorrados = [];
    $scope.checkBorrar = function(item){
        var call = '{ "statements" : [ { "statement" : "MATCH (r:Receta)-[l:Lleva]->(p:Producto)-[:Existe]->(i:Inventario) where id(p) = '+item.row[1]+' return distinct p,id(p)" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.checkBorrados = data.results[0].data
            if(Object.keys($scope.checkBorrados).length <= 0)
                $scope.borrar(item);
            else{
                var alertPopup = $ionicPopup.alert({
                    title: 'Error',
                    template: 'Este ingrediente es parte de una receta o aun esta en el inventario.'
                });
            }
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };

    $scope.saveName = {};
    $scope.setEditItem = function (item){
        $scope.editItem = item;
        $scope.saveName.nombre = item.row[0].nombre;
        $scope.nuevo = false;
        $scope.nuevoLabel = "Editar";
        $scope.openModal();
    };

    $ionicModal.fromTemplateUrl('templates/nuevoIngrediente.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.nuevoIngrediente = modal;
    });
    $scope.closeModal = function() {
        $scope.nuevoIngrediente.hide();
        $scope.saveName.nombre = "";
    };
    $scope.openModal = function() {
        $scope.nuevoIngrediente.show();

    };
    $scope.nuevoIngredienteModal = function() {
        $scope.nuevo = true;
        $scope.nuevoLabel = "Crear";
        $scope.nuevoIngrediente.show();
    };


})

.controller('cantidadesCtrl', function($scope,$http,$stateParams,$ionicModal) {
    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (i:Inventario) where ID(i) = '+item.row[1]+' detach delete i" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: llamada
        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items.splice($scope.items.indexOf(item),1);
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };
    $scope.doRefresh = function(){
        var call = '{ "statements" : [ { "statement" : "MATCH (p:Producto),(i:Inventario) where id(p) = '+$stateParams.productoID+' and (p)-[:Existe]-(i) RETURN i ,id(i)" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call

        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items = data.results[0].data
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    //Modal para editar
    $scope.saveCantidad = {};
    $scope.saveFecha = {};
    $scope.setEditItem = function (item){
        $scope.editItem = item;
        $scope.saveCantidad.cantidad = item.row[0].cantidad;
        $scope.saveFecha.fecha_caducidad = item.row[0].fecha_caducidad;
        $scope.nuevo = false;
        $scope.nuevoLabel = "Editar";
        $scope.openModal();
    };
    $ionicModal.fromTemplateUrl('templates/editarCantidad.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.editarCantidad = modal;
    });
    $scope.closeModal = function() {
        $scope.editarCantidad.hide();
        $scope.saveCantidad.cantidad = "";
        $scope.saveFecha.fecha_caducidad = "";

    };
    $scope.openModal = function() {
        $scope.editarCantidad.show();
    };
    $scope.editar = function(cantidad,fecha_caducidad){
        if($scope.nuevo)
            var llamar = '{ "statements" : [ { "statement" : "match(p:Producto) where id(p) = '+$stateParams.productoID+'  create (i:Inventario {cantidad:'+cantidad+',fecha_caducidad: \''+fecha_caducidad+'\'}) create (p)-[e:Existe]->(i)" } ] }';
        else
            var llamar = '{ "statements" : [ { "statement" : "MATCH (i:Inventario) where id(i)= '+$scope.editItem.row[1]+' set i.cantidad = '+cantidad+', i.fecha_caducidad = \''+fecha_caducidad+'\' " } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: llamar
        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
            })
        $scope.closeModal();
        }
    $scope.newCantidad = function(){
        $scope.openModal();
        $scope.nuevo = true;
        $scope.nuevoLabel = "Crear";
    }
})

.controller('tabsCtrl', function($scope,$http,badges) {
    var call = '{ "statements" : [ { "statement" : "MATCH (x:Producto_Elaborado)-[:Genero]->(r:Receta) RETURN r ,id(x)" } ] }';
    $http({
        method: 'POST',
        url: 'http://localhost:7474/db/data/transaction/commit',
        data: call

    })
    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
                        $scope.total = data.results[0].data;
                        badges.setTotal(Object.keys($scope.total).length);
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })
    $scope.$on('update',function(){
           $scope.data = {
              badgeCount : badges.getProductos()
            };
       });

})

.controller('checkOutCtrl', function($scope,$http,badges) {
    $scope.total = 0;
    $scope.borrar = function(item){
        var call = '{ "statements" : [ { "statement" : "MATCH (x:Producto_Elaborado) where id(x)='+item.row[1]+' detach delete x" } ] }';
        $http({
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: call
        })
        .success(function (data, status) {
            $scope.status = status;
            $scope.response = data.results;
            $scope.items.splice($scope.items.indexOf(item),1);
            badges.quitarProducto();
            $scope.total -= item.row[0].costo;
        })
        .error(function (data, status) {
            $scope.response = data || "Request failed";
            $scope.status = status;
        })
    };

    $scope.doRefresh = function(){
         $scope.total = 0;
        var call = '{ "statements" : [ { "statement" : "MATCH (x:Producto_Elaborado)-[:Genero]->(r:Receta) RETURN r ,id(x)" } ] }';
    $http({
        method: 'POST',
        url: 'http://localhost:7474/db/data/transaction/commit',
        data: call

    })
    .success(function (data, status) {
                        $scope.status = status;
                        $scope.response = data.results;
                        $scope.items = data.results[0].data
                        for(i = 0;i<Object.keys($scope.items).length;i++){
                            $scope.total += $scope.items[i].row[0].costo;
                        }
            })
    .error(function (data, status) {
                        $scope.response = data || "Request failed";
                        $scope.status = status;
            })
    .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });

    }

})
