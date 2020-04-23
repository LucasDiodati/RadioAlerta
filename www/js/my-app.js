// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;
var app = new Framework7({
  // App root element
  root: '#app',
  // App Name
  name: 'Radio Alerta',
  // App id
  id: 'com.app.RadioAlerta',
  // Enable swipe panel
  panel: {
    swipe: 'left',
    swipe:'true',
    swipeOnlyClose:'true',
    closeByBackdropClick: 'true',
  },
  /******************************************************************************************************RUTAS*/
  routes: [{
    path: '/index/',
    url: 'index.html',
  }, {
    path: '/inicioSesion/',
    url: 'inicio-sesion.html',
}, {
    path: '/mapa/',
    url: 'mapa.html',
  }, {
    path: '/crearCuenta/',
    url: 'nueva-cuenta.html',
  }, {
    path: '/ubicacion/',
    url: 'ubicacion.html',
  }, {
    path: '/chats/',
    url: 'chats.html',
  }, {
    path: '/p-us/',
    url: 'perfil-usuario.html',
  }, {
    path: '/p-adm/',
    url: 'perfil-admin.html',
  }, {
    path: '/chat-general/',
    url: 'chat-general.html',
  }, ]
});
var mainView = app.views.create('.view-main');
var email, password, tituloChat, nombre, telefono, usuario, avatar, tipo, lat, lon, sinRuta;
// variable bandera para ingresar o crear cuenta
var nuevaCuenta = 0;
// para la ubicacion actual y el radio por defecto
var latUsuario=0, lonUsuario=0;
var radioActual = 1;
var radioAlerta = 300;
// para el autologin con recordar contraseña
var storage = window.localStorage;
var us = { "email": "", "clave": "" };
var usuarioLocal ="", claveLocal = "";
// BASE DE DATOS
var db, refUsuarios, refTiposUsuarios;
//AVATARES declaro estas variables por si el dia de mañana quiero agregar mas avatares
  var filas = 15;
  var fila = 1;
  var avatarN = 1;

 

/************************************************************************************************DEVICE READY*/
// Handle Cordova Device Ready Event
$$(document).on('deviceready', function () {
  console.log("Device is ready!");

    consultarLocalStorage();

  var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
  if (app) {
    // PhoneGap application
    // traigo la posicion del GPS 
    var onSuccess = function (position) {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      console.log(" MOBILE LAT " + lat + " MOBILE LON " + lon);
    };
    // onError Callback receives a PositionError object
    //
    function onError(error) {
      alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  } else {
    // Web page
    lat = "-32.9467536";
    lon = "-60.6373007"; // Peatonal cordoba y san martin

   console.log("LAT COMPUTADORA: " + lat + " LON COMPUTADORA: " + lon);
  }
  /* seteo variables de BD */
  db = firebase.firestore();
  refUsuarios = db.collection("USUARIOS");
  refTiposUsuarios = db.collection("TIPOS_USUARIOS");
  var iniciarDatos = 0;
  if (iniciarDatos == 1) {
    fnIniciarDatos();
  }

});

// Option 1. Using one 'page:init' handler for all pages
$$(document).on('page:init', function (e) {
  // Do something here when page loaded and initialized
  console.log(e);
})
/**********************************************************************************************************MAPA*/
$$(document).on('page:init', '.page[data-name="mapa"]', function (e) {

    panelIzq();

if(radioActual == 1){
$$('.cajaUbicacion').addClass('oculto');
//Agregar el selector de rango y trackearlo con una funcion
$$('.radioAlerta').removeClass('oculto');
  //Si entro a ver mi radio actual solo puedo modificar el rango de radio y confirmar que es mi ubicación
$$('#ubicacionAceptada').on('click',function(){
/* guardar los cambios en el rango si lo hubiese y redireccionar a /chats/*/});

$$('.radioAlerta').on('range:change', function (e) {
  var range = app.range.get(e.target);
radioAlerta = range.value;
console.log(radioAlerta);
});
}else{
$$('.cajaUbicacion').removeClass('oculto');
//Saco el selector y agrego el textbox de ubicaciones
$$('.radioAlerta').addClass('oculto');

infoBubbles();
}
   mapaConUI();
})
/*****************************************************************************************************UBICACION*/
$$(document).on('page:init', '.page[data-name="ubicacion"]', function (e) {
  console.log(e);
      

  /** Voy a mostrar la latitud y longitud actual del usuario hasta que pueda incorporar el mapa**/
  $$('.latitud').append(lat);
  $$('.longitud').append(lon);
  console.log("donde tiene que mostrar confirmacion de lat " + lat + " y lon " + lon);
  $$('#ubicacionAceptada').on('click', function () {
    cargarDatosUsuario();
    mainView.router.navigate('/chats/');
  });
   mapaConUI();
})
/********************************************************************************************************CHATS*/
$$(document).on('page:init', '.page[data-name="chats"]', function (e) {
    panelIzq();


  $$('#chatGeneral').on('click', function () {
    tituloChat = "Chat general";
    mainView.router.navigate('/chat-general/');
  });
  $$('#chatCasa').on('click', function () {
    tituloChat = "Casa";
    mainView.router.navigate('/chat-general/');
  });
  cargarDatosUsuario();
})

/***********************************************************************************************PERFIL USUARIO*/
$$(document).on('page:init', '.page[data-name="p-us"]', function (e) {
console.log("perfil");
    panelIzq();

})
/********************************************************************************************************INDEX*/
$$(document).on('page:init', '.page[data-name="index"]', function (e) {
    console.log(e);
  // Variable bandera para entrar a crear cuenta
  $$('#nuevaCuenta').on('click', function () {
    nuevaCuenta = 1;
    mainView.router.navigate('/inicioSesion/');
  });
  $$('#iniciarSesion').on('click', function () {
    nuevaCuenta = 0;
    mainView.router.navigate('/inicioSesion/');
  });

// ESTO DESPUES LO VOY A TENER QUE PASAR A CREAR CUENTA Y CHATS YA QUE SON LINKS INTERNOS
$$('#radioActual').on('click', function () {
    radioActual = 1;
    mainView.router.navigate('/mapa/');
  });
$$('#ubicacionesGuardadas').on('click', function () {
    radioActual = 0;
    mainView.router.navigate('/mapa/');
  });

})
/*************************************************************************INICIO SESION Y CREAR CUENTA CON AUTH*/
$$(document).on('page:init', '.page[data-name="inicioSesion"]', function (e) {
    console.log(e);
  /*******************CREAR CUENTA********************/
  // Voy a usar esta misma vista para crear la cuenta con el servicio de autenticacion
  if (nuevaCuenta == 1) {
    if ($$('#colorEncabezado').hasClass('azul')) {
      $$('#colorEncabezado').removeClass('azul').addClass('rojo');
      $$('#tituloLogin').text('Crear cuenta');
      $$('#olvideContrasena').addClass('oculto');
    }
    $$('#ingresar').on('click', function () {
      email = $$('#emailLogin').val();
      password = $$('#passwordLogin').val();
      crearUsuario();
    });
  
/***********************LOGIN*************************/
// sign in con firebase auth
  } else {
    if ($$('#colorEncabezado').hasClass('rojo')) {
      $$('#colorEncabezado').removeClass('rojo').addClass('azul');
      $$('#tituloLogin').text('Iniciar sesión');
      $$('#olvideContrasena').removeClass('oculto');
    }
    // log in con firebase auth
    $$('#ingresar').on('click', function () {
loginConEmail();
    });
  }
})
/***************************************************************************************CREAR CUENTA 2DA VISTA*/
$$(document).on('page:init', '.page[data-name="crearCuenta"]', function (e) {
  console.log(e);
  //llamada para crear el usuario almacenandolo en firebase y redireccionar a ubicacion
  $$('#crearUsuario').on('click', function () {
    fnGuardarDP();
  });
  //llamada a la carga de avatares dentro del popup dinamicamente
  $$('#modalAvatares').on('click', cargarAvatares);
  //llamada a vaciar el popup de los avatares cuando cierro o selecciono
  $$('#vaciarAv').on('click', vaciarAv);
  //llamada para seleccionar el avatar clickeado pasandole el src del clickeado a avatarSeleccionado()
  $$('#cargaAvatar').on('mouseenter', function () {
    $$('.av').on('click', function () {
      avatarSeleccionado(this.src);
    });
  });
  
})
/*************************************************************************************************CHAT GENERAL*/
$$(document).on('page:init', '.page[data-name="chat-general"]', function (e) {
    panelIzq();


  $$('#tituloChat').text(tituloChat);
  // Init Messages
  var messages = app.messages.create({
    el: '.messages',
    // First message rule
    firstMessageRule: function (message, previousMessage, nextMessage) {
      // Skip if title
      if (message.isTitle) return false;
      /* if:
      - there is no previous message
      - or previous message type (send/received) is different
      - or previous message sender name is different
    */
      if (!previousMessage || previousMessage.type !== message.type || previousMessage.name !== message.name) return true;
      return false;
    },
    // Last message rule
    lastMessageRule: function (message, previousMessage, nextMessage) {
      // Skip if title
      if (message.isTitle) return false;
      /* if:
      - there is no next message
      - or next message type (send/received) is different
      - or next message sender name is different
    */
      if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name) return true;
      return false;
    },
    // Last message rule
    tailMessageRule: function (message, previousMessage, nextMessage) {
      // Skip if title
      if (message.isTitle) return false;
      /* if (bascially same as lastMessageRule):
      - there is no next message
      - or next message type (send/received) is different
      - or next message sender name is different
    */
      if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name) return true;
      return false;
    }
  });
  // Init Messagebar
  var messagebar = app.messagebar.create({
    el: '.messagebar'
  });
  // Response flag
  var responseInProgress = false;
  // Send Message
  $$('.send-link').on('click', function () {
    var text = messagebar.getValue().replace(/\n/g, '<br>').trim();
    // return if empty message
    if (!text.length) return;
    // Clear area
    messagebar.clear();
    // Return focus to area
    messagebar.focus();
    // Add message to messages
    messages.addMessage({
      text: text,
    });
    if (responseInProgress) return;
    // Receive dummy message
    receiveMessage();
  });

  // Dummy response
  var answers = ['Yes!', 'No', 'Hm...', 'I am not sure', 'And what about you?', 'May be ;)', 'Lorem ipsum dolor sit amet, consectetur', 'What?', 'Are you sure?', 'Of course', 'Need to think about it', 'Amazing!!!']
  var people = [{
    name: 'Kate Johnson',
    avatar: 'https://cdn.framework7.io/placeholder/people-100x100-9.jpg'
  }, {
    name: 'Blue Ninja',
    avatar: 'https://cdn.framework7.io/placeholder/people-100x100-7.jpg'
  }];

  function receiveMessage() {
    responseInProgress = true;
    setTimeout(function () {
      // Get random answer and random person
      var answer = answers[Math.floor(Math.random() * answers.length)];
      var person = people[Math.floor(Math.random() * people.length)];
      // Show typing indicator
      messages.showTyping({
        header: person.name + ' está escribiendo',
        avatar: person.avatar
      });
      setTimeout(function () {
        // Add received dummy message
        messages.addMessage({
          text: answer,
          type: 'received',
          name: person.name,
          avatar: person.avatar
        });
        // Hide typing indicator
        messages.hideTyping();
        responseInProgress = false;
      }, 4000);
    }, 1000);
  }


})


/***************************************************************************************************************/
/***************************************************************************************************************/
/***********************************************FUNCIONES*******************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/


// cuando abro el popup de los avatares creo las filas y los avatares de manera dinámica
  function cargarAvatares() {
    console.log("CARGAR AVATARES");
    for (var i = 1; i <= filas; i++) {
      $$('#cargaAvatar').append('<div class="row fila' + fila + '">');
      for (var j = 1; j <= 4; j++) {
        $$('.fila' + fila).append('<div class="col-25"><img src="img/min/' + avatarN + '.png" class="av"></div>');
        avatarN++;
      }
      $$('#cargaAvatar').append('</div>');
      fila++;
    }
  };
  // cuando cierro el popup de los avatares vacío el html
  function vaciarAv() {
    $$('#cargaAvatar').html('<br/>');
    fila = 1;
    avatarN = 1;
  };
  //paso el src del avatar seleccionado a la vista de crear la cuenta, llamo a cerrar el popup y lo vacio
  function avatarSeleccionado(avatar) {
    $$('.avatarSeleccionado').attr('src', avatar).addClass('elegido');
    $$('.subtitulo').addClass('oculto');
    $$('.abrirAvatares').addClass('bordeAv');
    // Tuve que hacer un cambio de fondo porque una imagen png hacia contraste con el background-color
    sinRuta = avatar.split('/');
    if (sinRuta[5] == "39.png") {
      $$('.abrirAvatares').addClass('fondoBlanco');
    } else {
      $$('.abrirAvatares').removeClass('fondoBlanco');
    }
    app.popup.close();
    vaciarAv();
    console.log("avatar seleccionado: " + avatar);
  };


/*************************FUNCIONES QUE TOME PRESTADAS DE JORGE**********************/
function fnGuardarDP() {
  nombre = $$('#nombre').val();
  telefono = $$('#telefono').val();
  usuario = $$('#usuario').val();
  var avatarLimpio = sinRuta[sinRuta.length - 1];
  console.log("avatar limpio: " + avatarLimpio);
  // clave: variable de datos
  var data = {
    nombre: nombre,
    telefono: telefono,
    usuario: usuario,
    avatar: "img/min/" + avatarLimpio,
    latitud: lat,
    longitud: lon,
    tipo: "VIS"
  }
  refUsuarios.doc(email).set(data);
  mainView.router.navigate('/chats/');
}

function fnIniciarDatos() {
  codido = "VIS";
  tipo = "Visitante";
  saludo = "Hola visitante!";
  var data = {
    tipo: tipo,
    saludo: saludo
  }
  refTiposUsuarios.doc(codido).set(data);
  codido = "ADM";
  tipo = "Administrador";
  saludo = "Hola Mr. Admin";
  var data = {
    tipo: tipo,
    saludo: saludo
  }
  refTiposUsuarios.doc(codido).set(data);
  codido = "COM";
  tipo = "Comercio";
  saludo = "Hola comercio";
  var data = {
    tipo: tipo,
    saludo: saludo
  }
  refTiposUsuarios.doc(codido).set(data);
  var data = {
    nombre: "Admin",
    telefono: "1234",
    usuario: "lucasD",
    avatar: "/img/min/1.png",
    latitud: "00.00",
    longitud: "00.00",
    tipo: "ADM"
  }
  refUsuarios.doc("programacion21@live.com").set(data);
};


/**********************HACER LA QUERY A LA BD Y CARGAR TODA LA INFO DE USUARIO AL PANEL**************************/
function cargarDatosUsuario() {
  // REF: https://firebase.google.com/docs/firestore/query-data/get-data
  // TITULO: Obtén un documento
  refUsuarios.doc(email).get().then(function (doc) {
    if (doc.exists) {
      //console.log("Document data:", doc.data());
      //console.log("Tipo de Usuario: " + doc.data().tipo );
      var user = doc.data().usuario;
      $$('.nombreMenu').text("@" + user);
      $$('.menuAvatar').attr("src", doc.data().avatar);
      tipoUsuario = doc.data().tipo;
      if (tipoUsuario == "VIS") {
        // carga los chats de usuario
      }
      if (tipoUsuario == "ADM") {
        // carga los chat de admin y el acceso al panel de control
      }
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  }).catch(function (error) {
    console.log("Error getting document:", error);
  });
};
/**********************FIN DE HACER LA QUERY A LA BD Y CARGAR TODA LA INFO DE USUARIO AL PANEL*******************/


/******************************************* MAPA DE HERE CON UI ************************************************/
// Aca: https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/map-controls-ui.html
function mapaConUI(){
//Initialize the Platform object:
    var platform = new H.service.Platform({
        'apikey': '0RTLydGJnLLp5DlfAFU0ctJ3CUbIiBHqs4K-qMAxFlY'
    });

    // Get the default map types from the Platform object:
    var defaultLayers = platform.createDefaultLayers();

    // Instantiate the map:
    var map = new H.Map(
        document.getElementById('mapContainer'),
        defaultLayers.vector.normal.map,
        {
            zoom: 16,
            center: { lng: lon, lat: lat },
              pixelRatio: window.devicePixelRatio || 1
        });
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);

var mapSettings = ui.getControl('mapsettings');
var zoom = ui.getControl('zoom');
var scalebar = ui.getControl('scalebar');

mapSettings.setAlignment('top-left');
zoom.setAlignment('top-left');
scalebar.setVisibility(false); 


if(radioActual == 1){
/*AGREGO UN CIRCULO EDITABLE SOBRE LA POSICION ACTUAL*/
circuloModificable();
}else{
$$('#ubicacionAceptada').on('click',geocodificador);
/*AGREGO UN CIRCULO COMUN*/
circuloComun();
// Agrego burbujas de texto
bubblesTexto();
}





/*****************FUNCION INFO BUBBLES CON TEXTO ********************/
function bubblesTexto(){

// Create an info bubble object at a specific geographic location:
var bubble = new H.ui.InfoBubble({ lng: lon, lat: lat }, {
                content: '<b>Casa!</b>'
             });

// Add info bubble to the UI:
ui.addBubble(bubble);


function openBubble(position, text){
    if(!bubble){
        bubble =  new H.ui.InfoBubble(
            position,
            // The FO property holds the province name.
            {content: '<small>' + text+ '</small>'});
        ui.addBubble(bubble);
    } else {
        bubble.setPosition(position);
        bubble.setContent('<small>' + text+ '</small>');
        bubble.open();
    }
}


}

/********************FIN INFO BUBBLES CON TEXTO**********************/
/************************GEOCODIFICACION*****************************/
function geocodificador(){

var busqueda = $$('#busquedaUbicacion').val();

// GEOCODER ES UN SERVICIO DE REST
// Utilizar API Key de REST

// https://developer.here.com/api-explorer/rest/geocoder
url = 'https://geocoder.ls.hereapi.com/6.2/geocode.json';
app.request.json(url, {
    searchtext: busqueda,
    apiKey: 'Gz-JLm7EYGkMQZ2XuuU8feRF-CQYjqVUDFqtICVtQwU',
    gen: '9'
  }, function (data) {
     // hacer algo con data
     console.log("geo:" + JSON.stringify(data));

    // POSICION GEOCODIFICADA de la direccion
    latitud = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
    longitud = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
    //alert(latitud + " / " + longitud);
        coordsG = {lat: latitud, lng: longitud},
        markerG = new H.map.Marker(coordsG);
        map.addObject(markerG);
    //     alert(JSON.stringify(data));


}, function(xhr, status) { console.log("error geo: "+status); }   );

};
/***********************FIN GEOCODIFICACION*****************************/
/******************FUNCION INFO BUBBLES EN GRUPOS***********************/
//Esto lo paso Jorge para que podamos agrupar los marcadores

function infoBubbles(){
var lat2 = "-32.9456869";
var lon2 = "-60.6445324";
var lat3 = "-32.9456448";
var lon3 = "-60.6445155";


function addInfoBubble(map) {
  var group = new H.map.Group();
  map.addObject(group);
 addMarkerToGroup(group, {lat: lat , lng: lon});
 addMarkerToGroup(group, {lat: lat2 , lng: lon2});
 addMarkerToGroup(group, {lat: lat3 , lng: lon3});
}
    function addMarkerToGroup(group, coordinate, html) {
      var marker = new H.map.Marker(coordinate);
      group.addObject(marker);     
    }


addInfoBubble(map);
}

/*********************FIN INFO BUBBLES EN GRUPOS***********************/

/*****************FUNCION CIRCULO COMUN *******************************/
function circuloComun(){
// https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/geo-shapes.html
// Agregar el "radio"
// Instantiate a circle object (using the default style):
var circle = new H.map.Circle({lat: lat, lng: lon}, 300);
// Add the circle to the map:
map.addObject(circle);
}
/***********************FIN CIRCULO COMUN *****************************/

/*******************FUNCION DRAGGABLE CIRCLE **************************/
// Aca https://developer.here.com/documentation/examples/maps-js/resizable-geoshapes/resizable-circle
function circuloModificable(){

/**
 * Adds resizable geo shapes to map
 *
 * @param {H.Map} map                      A HERE Map instance within the application
 */
function createResizableCircle(map) {
  var circle = new H.map.Circle(
        {lat: lat, lng: lon},
        radioAlerta,
        {
          style: {fillColor: 'rgba(250, 250, 0, 0.7)', lineWidth: 0}
        }
      ),
      circleOutline = new H.map.Polyline(
        circle.getGeometry().getExterior(),
        {
          style: {lineWidth: 6, strokeColor: 'rgba(255, 0, 0, 0)'}
        }
      ),
      circleGroup = new H.map.Group({
        volatility: true, // mark the group as volatile for smooth dragging of all it's objects
        objects: [circle, circleOutline]
      }),
      circleTimeout;
     

  // ensure that the objects can receive drag events
  circle.draggable = true;
  circleOutline.draggable = true;

  // extract first point of the circle outline polyline's LineString and
  // push it to the end, so the outline has a closed geometry
  circleOutline.getGeometry().pushPoint(circleOutline.getGeometry().extractPoint(0));

  // add group with circle and it's outline (polyline)
  map.addObject(circleGroup);

  // event listener for circle group to show outline (polyline) if moved in with mouse (or touched on touch devices)
  circleGroup.addEventListener('pointerenter', function(evt) {
    var currentStyle = circleOutline.getStyle(),
        newStyle = currentStyle.getCopy({
          strokeColor: 'rgb(255, 0, 0)'
        });

    if (circleTimeout) {
      clearTimeout(circleTimeout);
      circleTimeout = null;
    }
    // show outline
    circleOutline.setStyle(newStyle);
  }, true);

  // event listener for circle group to hide outline if moved out with mouse (or released finger on touch devices)
  // the outline is hidden on touch devices after specific timeout
  circleGroup.addEventListener('pointerleave', function(evt) {
    var currentStyle = circleOutline.getStyle(),
        newStyle = currentStyle.getCopy({
          strokeColor: 'rgba(255, 0, 0, 0)'
        }),
        timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

    circleTimeout = setTimeout(function() {
      circleOutline.setStyle(newStyle);
    }, timeout);
    document.body.style.cursor = 'default';
  }, true);

  // event listener for circle group to change the cursor if mouse position is over the outline polyline (resizing is allowed)
  circleGroup.addEventListener('pointermove', function(evt) {
    if (evt.target instanceof H.map.Polyline) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default'
    }
  }, true);

  // event listener for circle group to resize the geo circle object if dragging over outline polyline
  circleGroup.addEventListener('drag', function(evt) {
    var pointer = evt.currentPointer,
        distanceFromCenterInMeters = circle.getCenter().distance(map.screenToGeo(pointer.viewportX, pointer.viewportY));

    // if resizing is alloved, set the circle's radius
    if (evt.target instanceof H.map.Polyline) {
      circle.setRadius(distanceFromCenterInMeters);
      radioAlerta = round5(parseInt(circle.getRadius(distanceFromCenterInMeters)));
      console.log(radioAlerta);

      // use circle's updated geometry for outline polyline
      var outlineLinestring = circle.getGeometry().getExterior();
      // extract first point of the outline LineString and push it to the end, so the outline has a closed geometry
      outlineLinestring.pushPoint(outlineLinestring.extractPoint(0));
      circleOutline.setGeometry(outlineLinestring);

      // prevent event from bubling, so map doesn't receive this event and doesn't pan
      evt.stopPropagation();
    }
  }, true);

}

createResizableCircle(map);

// Una funcion que redondea a multiplos de 5 para el radio
function round5(x)
{
    return (x % 5) >= 2.5 ? parseInt(x / 5) * 5 + 5 : parseInt(x / 5) * 5;
}

}
/************************FIN DE CIRCULO DRAGGABLE***************************/

}

/********************************** FIN DE MAPA DE HERE CON UI ***********************************************/



/*************************************MAPA DE JORGE *********************************************************/
function mapaDeJorge(){


 // Inicio del mapa

    var  lati = lat;
    var  longi = lon;

// https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/get-started.html
      // Initialize the platform object:
      var platform = new H.service.Platform({
        'apikey': '0RTLydGJnLLp5DlfAFU0ctJ3CUbIiBHqs4K-qMAxFlY'
      });

      // Obtain the default map types from the platform object
      var maptypes = platform.createDefaultLayers();

      // Instantiate (and display) a map object:
      var map = new H.Map(
        document.getElementById('mapContainer'),
        maptypes.vector.normal.map,
        {
          zoom: 13,
          center: {lat: lati, lng: longi}
        
        });

// https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/marker-objects.html
var svgMarkup = '<svg width="24" height="24" ' +
    'xmlns="http://www.w3.org/2000/svg">' +
    '<rect stroke="white" fill="#1b468d" x="1" y="1" width="22" ' +
    'height="22" /><text x="12" y="18" font-size="12pt" ' +
    'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
    'fill="white">H</text></svg>';
var icon = new H.map.Icon(svgMarkup),
    coords = {lat: lati, lng: longi},
    marker = new H.map.Marker(coords, {icon: icon});

// Add the marker to the map and center the map at the location of the marker:
map.addObject(marker);
map.setCenter(coords); // centrar el mapa en una coordenada.


    lati2 = -32.958;
    longi2 = -60.689;
    coords2 = {lat: lati2, lng: longi2},
    marker2 = new H.map.Marker(coords2);
    map.addObject(marker2);

    if (latUsuario!=0 && lonUsuario!=0) {
        coordsUsu = {lat: latUsuario, lng: lonUsuario},
        markerUsu = new H.map.Marker(coordsUsu);
        map.addObject(markerUsu);
    }

// GEOCODER ES UN SERVICIO DE REST
url = 'https://geocoder.ls.hereapi.com/6.2/geocode.json';
app.request.json(url, {
    searchtext: 'Cordoba 3201, rosario, santa fe',
    apiKey: 'Gz-JLm7EYGkMQZ2XuuU8feRF-CQYjqVUDFqtICVtQwU',
    gen: '9'
  }, function (data) {
     // hacer algo con data
     console.log("geo:" + JSON.stringify(data));


    // POSICION GEOCODIFICADA de la direccion
    latitud = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
    longitud = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
    //alert(latitud + " / " + longitud);
        coordsG = {lat: latitud, lng: longitud},
        markerG = new H.map.Marker(coordsG);
        map.addObject(markerG);
    //     alert(JSON.stringify(data));
    }, function(xhr, status) { console.log("error geo: "+status); }   );

}

/********************************FIN DEL MAPA DE JORGE ************************************************/

/********************************AUTO LOGIN CON SESSION STORAGE ***************************************/

function consultarLocalStorage(){
        if(localStorage.getItem("us") === null){/*no hago nada*/}else{
        var usuarioGuardado = storage.getItem("us");
        usuarioGuardado = JSON.parse(usuarioGuardado);
        // convertimos el string en JSON

        if (usuarioGuardado.email == ""){
          console.log("no hay datos en el local");
        } else {
        
        console.log(" usuarioguardado.email: " + usuarioGuardado.email);
        console.log(" usuarioguardado.clave: " + usuarioGuardado.clave);
  //pasar los datos del json a dos variables independientes
        email = usuarioGuardado.email;
        password = usuarioGuardado.clave;
        console.log("usuariolocal + clavelocal: " + email + password)
  //si la variable tiene datos llamamos a una funcion de login pasandole las variables como parametros
        
        if ( usuarioGuardado != null){
          LoguearseConLocal(email, password);
        };
      };
    };
    };

    function LoguearseConLocal(u,c ){
             console.log("loguearseconlocal, u+c"+u+c)
             
        //Se declara la variable huboError (bandera)
        var huboError = 0;     
        firebase.auth().signInWithEmailAndPassword(u, c)
            .catch(function(error){
                //Si hubo algun error, ponemos un valor referenciable en la variable huboError
                huboError = 1;
                var errorCode = error.code;
                var errorMessage = error.message;
                console.error(errorMessage);
                console.log(errorCode);

                
            })
            .then(function(){   
                //En caso de que esté correcto el inicio de sesión y no haya errores, se dirige a la siguiente página
                if(huboError == 0){
                  console.log("te logueaste");
                  cargarDatosUsuario();
          mainView.router.navigate('/p-us/');

                }
            }); 
      
    };

/*****************************FIN AUTO LOGIN CON SESSION STORAGE ***************************************/

function loginConEmail(){


      email = $$('#emailLogin').val();
      password = $$('#passwordLogin').val();
      // Estoy puenteando el login para trabajar más comodo con las vistas
      //email = "programacion21@live.com";
      //password = "kat13579";
      //Se declara la variable huboError (bandera)
      var huboError = 0;
      firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
        //Si hubo algun error, ponemos un valor referenciable en la variable huboError
        huboError = 1;
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error(errorMessage);
        console.log(errorCode);
      }).then(function () {
        //En caso de que esté correcto el inicio de sesión y no haya errores, se dirige a la siguiente página
        if (huboError == 0) {


if( $$("#recuerdame").is(":checked") ){
                   // id muy coco
                    us = { email: email, clave: password };
                    //storage.setItem("persona", persona); -> guardará [object Object]
                    var usuarioAGuardar = JSON.stringify(us);
                    // por eso convertimos el JSON en un string
                                       
                    storage.setItem("us", usuarioAGuardar);
                    console.log("usuarioAGuardar: " + usuarioAGuardar);
                    console.log("usuario: " + us.email + "password: " + us.clave);             
    }

          mainView.router.navigate('/chats/');
        }
      });

}

  // toma los valores de email y contraseña y crea la conexión con firebase para almacenarla
    function crearUsuario() {
      firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode == 'auth/weak-password') {
          alert('Clave muy débil.');
        } else {
          alert(errorMessage);
        }
        console.log(errorMessage);
      }).then(function(){

if( $$("#recuerdame").is(":checked") ){
                   // id muy coco
                    us = { email: email, clave: password };
                    //storage.setItem("persona", persona); -> guardará [object Object]
                    var usuarioAGuardar = JSON.stringify(us);
                    // por eso convertimos el JSON en un string
                                       
                    storage.setItem("us", usuarioAGuardar);
                    console.log("usuarioAGuardar: " + usuarioAGuardar);
                    console.log("usuario: " + us.email + "password: " + us.clave);             
    }
      mainView.router.navigate('/crearCuenta/');

      });
    };

    function cerrarSesion(){
      // y aca cierro sesion
firebase.auth().signOut()
  .then(function() {
  // Sign-out successful.
  })
  .catch(function(error) {
  // An error happened
  });
  // borro el local storage
storage.clear();
  // y redirecciono al index
  mainView.router.navigate('/index/');

app.panel.close();

console.log("cerrar sesion");

    }


function panelIzq(){
$$('#cerrarSesion').on('click', cerrarSesion);
}
