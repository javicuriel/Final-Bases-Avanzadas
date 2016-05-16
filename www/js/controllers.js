// Propiedad de Javier Curiel
angular.module('app.controllers', [])

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
    this.setCommand = function(query){
      return $http.post('http://localhost:7474/db/data/transaction/commit',query);
      }
})

.service('login',function($rootScope){
  var admin = false;
  var loged = false;
  var ID;
  var setAdmin = function(){
    admin = true;
  }
  var setLog= function(id){
    loged = true;
    ID = id;
  }
  var getAdmin = function(){
    return admin;
  }
  var getLog= function(){
    return loged;

  }
  var getID= function(){
    return ID;

  }
  var logOut = function(){
    admin = false;
    loged = false;
  }
  return{
      setAdmin: setAdmin,
      setLog: setLog,
      getAdmin: getAdmin,
      getLog: getLog,
      getID: getID,
      logOut: logOut
  }
})


.run(function ($rootScope,$location ,$state, login) {
  $rootScope.$on('$stateChangeStart', function (event,next, nextParams, fromState) {
      if ($location.path() !== '/login' && !login.getLog()) {
          $location.path('/login');
      }

  });
})

.controller('loginCtrl', function($scope,$rootScope,login,$state,conexion,$ionicHistory) {
  $scope.log = function(username,password){
    var llamada = '{ "statements" : [ { "statement" : "match (u:Usuario) where u.nombre = {username} and u.password = {password} return u.puesto,id(u)","parameters":{"username": \"'+username+'\","password": \"'+password+'\"} } ] }';
    conexion.setCommand(llamada).success(function(data){
      $scope.cuenta = data.results[0].data;
      if(Object.keys($scope.cuenta).length <= 0)
        return false;
      else {
        login.setLog($scope.cuenta[0].row[1]);
        if($scope.cuenta[0].row[0] == "administrador")
           login.setAdmin();
        }
        $state.go('tabsController.menu',{}, {reload: true});
    })
  }
})

.controller('menuCtrl', function(conexion,$scope,$state,$ionicPopup,badges,login,$ionicModal) {
    $scope.checarFecha = function(){
      $scope.today = new Date();
      $scope.dd = $scope.today.getDate();
      $scope.mm = $scope.today.getMonth()+1;
      $scope.yyyy = $scope.today.getFullYear();
      if($scope.dd<10)
          $scope.dd='0'+$scope.dd
      if($scope.mm<10)
          $scope.mm='0'+$scope.mm
      $scope.todayDate = String($scope.yyyy+"-"+$scope.mm+"-"+$scope.dd);
      var llamada = '{ "statements" : [ { "statement" : "MATCH (i:Inventario) where i.fecha_caducidad<\''+$scope.todayDate+'\' DETACH DELETE i" } ] }';
      conexion.setCommand(llamada);
    }
    $scope.logOut = function(){
      login.logOut();
      $state.go('login');
    }
    // Cambio de slide o agregar a Check out
    $scope.agregar = false;
    $scope.setAgregar = function(){
        $scope.agregar = true;
    };
    $scope.cambia = function(item){
        if(!$scope.agregar){
          if(login.getAdmin())
            $state.go('tabsController.receta',{recetaID: item.row[1]});
          }
        else{
            $scope.loadInventario(item);
            $scope.agregar = false;
        }
    };
    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta) where ID(r) = '+item.row[1]+' detach delete r" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items.splice($scope.items.indexOf(item),1);
          })
    };
    $scope.comparaInventarios = function(item){
            var llamada = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto)-[e:Existe]->(i:Inventario) where id(r) = '+item.row[1]+' and (r)-[l]->(p)-[e]->(i)  match(r)-[w:Lleva]->(x:Producto)  return count(distinct x), count(distinct p);" } ] }';
            conexion.setCommand(llamada).success(function(data){
              $scope.cuentas = data.results[0].data;
              if($scope.cuentas[0].row[0] == $scope.cuentas[0].row[1])
                  $scope.checaInventario(item);
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
    }
    $scope.loadInventario = function(item) {
        var llamada = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto),(i:Inventario) where (r)-[l]->(p)-[:Existe]-(i) and id(r) = '+item.row[1]+' return i.cantidad,id(i),l.cantidad,id(p);" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.loadedInventario = data.results[0].data
          $scope.comparaInventarios(item);
          })
    };
    $scope.checaInventario = function(item) {
        var sePuede = true;
        var temporal;
        for(i = 0; i < Object.keys($scope.loadedInventario).length; i++){
            temporal = $scope.loadedInventario[i].row[3];
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
                var llamada = '{ "statements" : [ { "statement" : "match(r:Receta),(u:Usuario) where id(r) = '+item.row[1]+' and id(u) = '+login.getID()+' create (u)-[:Ordeno]->(x:Producto_Elaborado) create(x)-[:Genero]->(r) " } ] }';
            else
                var llamada = '{ "statements" : [ { "statement" : "match (i:Inventario) where id(i) = '+$scope.loadedInventario[i].row[1]+' set i.cantidad = i.cantidad - '+$scope.loadedInventario[i].row[2]+' " } ] }';
            conexion.setCommand(llamada);
        }
        badges.agregarProducto();
    };
    $scope.doRefresh = function() {
      $scope.checarFecha();
      $scope.viewEdit = false;
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta) RETURN r ,id(r)" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items = data.results[0].data
          $scope.admin = login.getAdmin();
          $scope.viewEdit = login.getAdmin();
          if($scope.admin)
              $scope.view = "show";
          else
            $scope.view = "hide";
          })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    };
    $scope.saveName = {};
    $scope.saveCosto = {};
    $scope.setEditItem = function (item){
        $scope.editItem = item;
        $scope.saveName.nombre = item.row[0].nombre;
        $scope.saveCosto.costo = item.row[0].costo;
        $scope.nuevo = false;
        $scope.nuevoLabel = "Editar";
        $scope.openModal();
    };

    $ionicModal.fromTemplateUrl('templates/nuevaReceta.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.nuevaReceta = modal;
    });
    $scope.closeModal = function() {
        $scope.nuevaReceta.hide();
        $scope.saveName.nombre = "";
        $scope.saveCosto.costo = "";
    };
    $scope.openModal = function() {
        $scope.nuevaReceta.show();

    };
    $scope.nuevaRecetaModal = function() {
        $scope.nuevo = true;
        $scope.nuevoLabel = "Crear";
        $scope.nuevaReceta.show();
    };
    $scope.edit = function (nombre,costo) {
      if($scope.nuevo)
          var llamada = '{ "statements" : [ { "statement" : "create (r:Receta {nombre:{nombre},costo:'+costo+'})" ,"parameters":{"nombre": \"'+nombre+'\"} } ] }';
      else
          var llamada = '{ "statements" : [ { "statement" : "match(r:Receta) where id(r) = '+$scope.editItem.row[1]+' set r.nombre = {nombre}, r.costo ='+costo+'" ,"parameters":{"nombre": \"'+nombre+'\"} } ] }';
      console.log(llamada);
      conexion.setCommand(llamada);
      $scope.closeModal();
    }
})

.controller('recetaCtrl', function($scope,conexion,$stateParams,$ionicModal,$ionicSlideBoxDelegate) {
    $scope.current = $stateParams.recetaID;

    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta)-[l:Lleva]->(p:Producto) where ID(r) = '+$stateParams.recetaID+' and ID(p) = '+item.row[1]+' delete l" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items.splice($scope.items.indexOf(item),1);
          })
    };

    $scope.doRefresh = function() {
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta),(p:Producto) WHERE id(r) = '+$stateParams.recetaID+'  match (r)-[l:Lleva]->(p) RETURN p,id(p),l.cantidad;" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items = data.results[0].data
          })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    $scope.loadNuevos = function(){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta),(p:Producto) WHERE id(r) = '+$stateParams.recetaID+' and not (r)-[:Lleva]->(p) RETURN p,id(p);" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.nuevos = data.results[0].data
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
            var llamada = '{ "statements" : [ { "statement" : "match(r:Receta),(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$scope.seleccionados[i].row[1]+' create(r)-[l:Lleva {cantidad:'+$scope.cantidades[i].item+'}]->(p)" } ] }';
            conexion.setCommand(llamada);
        }
    };
})

  .controller('editRecetaCtrl', function($scope,conexion,$stateParams) {
    $scope.editar = function(nombre,costo){
        var llamar = '{ "statements" : [ { "statement" : "match(r:Receta) where id(r) = '+$stateParams.recetaID+' set r.nombre = {nombre}, r.costo = '+costo+'","parameters":{"nombre": \"'+nombre+'\"} } ] }';
        conexion.setCommand(llamada);
    }
    $scope.doRefresh = function(){
      var llamada = '{ "statements" : [ { "statement" : "match(r:Receta) where id(r) = '+$stateParams.recetaID+' return r ,id(r)" } ] }';
      conexion.setCommand(llamada).success(function(data){
        $scope.items = data.results[0].data;
        $scope.nombre = data.results[0].data[0].row[0].nombre;
        $scope.costo = data.results[0].data[0].row[0].costo;
        })
    }
})

.controller('editProductoCtrl', function($scope,conexion,$stateParams) {
    $scope.editar = function(cantidad){
        var llamar = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$stateParams.productoID+' set l.cantidad = '+cantidad+'" } ] }';
        conexion.setCommand(llamada);
    }
    $scope.doRefresh = function(){
      var llamada = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$stateParams.productoID+' return l ,id(l)" } ] }';
      conexion.setCommand(llamada).success(function(data){
        $scope.items = data.results[0].data;
        $scope.cantidad = data.results[0].data[0].row[0].cantidad;
        })
    }
})

.controller('productoCtrl', function($scope,conexion,$stateParams) {
    $scope.doRefresh = function(){
      var llamada = '{ "statements" : [ { "statement" : "match(r:Receta)-[l:Lleva]->(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$stateParams.productoID+' return r,l,p" } ] }';
      conexion.setCommand(llamada).success(function(data){
        $scope.items = data.results[0].data;
        })
      var calc = '{ "statements" : [ { "statement" : "start p= node('+$stateParams.productoID+') match p-[:Existe*]->c return c" } ] }';
      conexion.setCommand(calc).success(function(data){
        $scope.calcula = data.results[0].data;
        })
    }

})

.controller('agregarIngreCtrl', function($scope,conexion,$stateParams,servicioIngredientes) {
    $scope.current = $stateParams.recetaID;
    $scope.select = function(){
        for(i = 0; i < Object.keys($scope.items).length; i++){
            if($scope.items[i].checked){
                servicioIngredientes.agregarProducto($scope.items[i]);
            }
        }
    }
    var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta),(p:Producto) WHERE id(r) = '+$stateParams.recetaID+' and not (r)-[:Lleva]->(p) RETURN p,id(p);" } ] }';
    conexion.setCommand(llamada).success(function(data){
      $scope.items = data.results[0].data;
      })
})

.controller('cantIngreCtrl', function($scope,conexion,$stateParams,servicioIngredientes) {
    $scope.items = servicioIngredientes.getProductos();
    $scope.current = $stateParams.recetaID;
    $scope.cantidades = {};
    $scope.save = function(){
        for(i = 0; i < Object.keys($scope.items).length; i++){
            var llamada = '{ "statements" : [ { "statement" : "match(r:Receta),(p:Producto) where id(r) = '+$stateParams.recetaID+' and id(p) = '+$scope.items[i].row[1]+' create(r)-[l:Lleva {cantidad:'+$scope.cantidades[i].item+'}]->(p)" } ] }';
            conexion.setCommand(llamada);
        }
    }
})

.controller('todosIngredientesCtrl', function($scope,conexion,$ionicModal,$ionicPopup) {
    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (p:Producto) where id(p) = '+item.row[1]+' detach delete p" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items.splice($scope.items.indexOf(item),1);
          })
    };

    $scope.doRefresh = function(){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (p:Producto) RETURN p ,id(p)" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items = data.results[0].data
          })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    $scope.edit = function(nombre){
        if($scope.nuevo)
            var llamada = '{ "statements" : [ { "statement" : "create (p:Producto {nombre:{x}})" ,"parameters":{"x": \"'+nombre+'\"} } ] }';
        else
            var llamada = '{ "statements" : [ { "statement" : "match(p:Producto) where id(p) = '+$scope.editItem.row[1]+' set p.nombre = {x}" ,"parameters":{"x": \"'+nombre+'\"} } ] }';
        conexion.setCommand(llamada);
        $scope.closeModal();
    }

    $scope.checkBorrados = [];
    $scope.checkBorrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (r:Receta)-[l:Lleva]->(p:Producto)-[:Existe]->(i:Inventario) where id(p) = '+item.row[1]+' return distinct p,id(p)" } ] }';
        var checkInventario = '{ "statements" : [ { "statement" : "MATCH (p:Producto)-[e:Existe]->(i:Inventario) where id(p) = '+item.row[1]+' return distinct p,id(p)" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.checkBorrados = data.results[0].data
          })
        conexion.setCommand(checkInventario).success(function(data){
          $scope.checkBorrados2 = data.results[0].data
          if(Object.keys($scope.checkBorrados).length <= 0 && Object.keys($scope.checkBorrados2).length <= 0)
              $scope.borrar(item);
          else{
              var alertPopup = $ionicPopup.alert({
                  title: 'Error',
                  template: 'Este ingrediente es parte de una receta o aun esta en el inventario.'
              });
          }
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

.controller('cantidadesCtrl', function($scope,conexion,$stateParams,$ionicModal) {
    $scope.borrar = function(item){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (i:Inventario) where ID(i) = '+item.row[1]+' detach delete i" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items.splice($scope.items.indexOf(item),1);
          })
    };
    $scope.doRefresh = function(){
        var llamada = '{ "statements" : [ { "statement" : "MATCH (p:Producto),(i:Inventario) where id(p) = '+$stateParams.productoID+' and (p)-[:Existe]-(i) RETURN i ,id(i)" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items = data.results[0].data
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
            var llamada = '{ "statements" : [ { "statement" : "match(p:Producto) where id(p) = '+$stateParams.productoID+'  create (i:Inventario {cantidad:'+cantidad+',fecha_caducidad: \''+fecha_caducidad+'\'}) create (p)-[e:Existe]->(i)" } ] }';
        else
            var llamada = '{ "statements" : [ { "statement" : "MATCH (i:Inventario) where id(i)= '+$scope.editItem.row[1]+' set i.cantidad = '+cantidad+', i.fecha_caducidad = \''+fecha_caducidad+'\' " } ] }';
        conexion.setCommand(llamada);
        $scope.closeModal();
        }
    $scope.newCantidad = function(){
        $scope.openModal();
        $scope.nuevo = true;
        $scope.nuevoLabel = "Crear";
    }
})

.controller('tabsCtrl', function($scope,$rootScope,conexion,badges,login) {
    if(login.getAdmin())
      var llamada = '{ "statements" : [ { "statement" : " match (x:Producto_Elaborado)-[:Genero]->(r:Receta) optional MATCH (u:Usuario)-[:Ordeno]->(x)-[:Genero]->(r)  RETURN r ,id(x),u" } ] }';
    else {
      var llamada = '{ "statements" : [ { "statement" : "MATCH (u:Usuario)-[:Ordeno]->(x:Producto_Elaborado)-[:Genero]->(r:Receta) where id(u) = '+login.getID()+' RETURN r ,id(x)" } ] }';
    }
    conexion.setCommand(llamada).success(function(data){
      $scope.total = data.results[0].data;
      badges.setTotal(Object.keys($scope.total).length);
      if(login.getAdmin())
          $scope.view = "show";
      else
        $scope.view = "hide";
      })
    $scope.$on('update',function(){
           $scope.data = {
              badgeCount : badges.getProductos()
            };
       });

})

.controller('checkOutCtrl', function($scope,conexion,badges,login) {
    $scope.total = 0;
    $scope.borrar = function(item){
      if(login.getAdmin())
        var llamada = '{ "statements" : [ { "statement" : "MATCH (x:Producto_Elaborado) where id(x)='+item.row[1]+' detach delete x" } ] }';
      else
        var llamada = '{ "statements" : [ { "statement" : "MATCH (u:Usuario)-[o:Ordeno]->(x:Producto_Elaborado) where id(x)='+item.row[1]+' and id(u) = '+login.getID()+' delete o" } ] }';
        conexion.setCommand(llamada).success(function(data){
          $scope.items.splice($scope.items.indexOf(item),1);
          badges.quitarProducto();
          $scope.total -= item.row[0].costo;
          })

    };

    $scope.doRefresh = function(){
        $scope.total = 0;
        if(login.getAdmin()){
          var llamada = '{ "statements" : [ { "statement" : " match (x:Producto_Elaborado)-[:Genero]->(r:Receta) optional MATCH (u:Usuario)-[:Ordeno]->(x)-[:Genero]->(r)  RETURN r ,id(x),u" } ] }';
          $scope.view= true;
        }
        else{
          var llamada = '{ "statements" : [ { "statement" : "MATCH (u:Usuario)-[:Ordeno]->(x:Producto_Elaborado)-[:Genero]->(r:Receta) where id(u) = '+login.getID()+' RETURN r ,id(x),u" } ] }';
          $scope.view= false;
        }
        conexion.setCommand(llamada).success(function(data){
          $scope.items = data.results[0].data
          for(i = 0;i<Object.keys($scope.items).length;i++){
              $scope.total += $scope.items[i].row[0].costo;
          }
          })
        .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });

    }

})
