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
  },
  // *****************RUTAS*********************
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
    path: '/chat-general/',
    url: 'chat-general.html',
  }, ]
});
var mainView = app.views.create('.view-main');
var email, password, tituloChat, nombre, telefono, usuario, avatar, tipo, lat, lon, sinRuta;
var nuevaCuenta = 0;

var latUsuario=0, lonUsuario=0;


/* BASE DE DATOS */
var db, refUsuarios, refTiposUsuarios;
// Handle Cordova Device Ready Event
$$(document).on('deviceready', function () {
  console.log("Device is ready!");
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
    lat = "00.0";
    lon = "00.0";
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
/****************************************************************************************/

$$(document).on('page:init', '.page[data-name="mapa"]', function (e) {
    // Inicio del mapa

    var  lati = -32.95;
    var  longi = -60.68;

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
     console.log("geo:" + data);


    // POSICION GEOCODIFICADA de la direccion
    latitud = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
    longitud = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
    //alert(latitud + " / " + longitud);
        coordsG = {lat: latitud, lng: longitud},
        markerG = new H.map.Marker(coordsG);
        map.addObject(markerG);
    //     alert(JSON.stringify(data));
    }, function(xhr, status) { console.log("error geo: "+status); }   );

})
/****************************************************************************************/
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


// Obtain the default map types from the platform object:
var defaultLayers = platform.createDefaultLayers();

// Instantiate (and display) a map object:
var map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
      zoom: 10,
      center: { lat: 52.5, lng: 13.4 }
    });




    // Inicio del mapa
  /*
      lati = -32.95;
      longi = -60.68;
console.log(" UBI LAT "+lat+" UBI LON "+lon);
console.log(" UBI LATI "+lati+" UBI LONGI "+longi);*/
  /*
// https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/get-started.html
      // Initialize the platform object:
      var platform = new H.service.Platform({
        'apikey': '4_90d8Tk8rlVGD_FGjyc9P2Goqme3ZyHUmSCF30Xui8'
      });

     
var defaultLayers = platform.createDefaultLayers();

  var map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
      zoom: 10,
      center: { lat: 52.5, lng: 13.4 }
    });
*/
  /*
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
*/
  /*
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

    if (lat!=0 && lon!=0) {
        coordsUsu = {lat: lat, lng: lon},
        markerUsu = new H.map.Marker(coordsUsu);
        map.addObject(markerUsu);
    }


// GEOCODER ES UN SERVICIO DE REST
url = 'https://geocoder.ls.hereapi.com/6.2/geocode.json';
app.request.json(url, {
    searchtext: 'Cordoba 3201, rosario, santa fe',
    apiKey: 'tLErOtbWQ2j43tAD09DGq_01sXxVLKJbtDt7O7qN6AM',
    gen: '9'
  }, function (data) {
     // hacer algo con data
     console.log("geo:" + data);


    // POSICION GEOCODIFICADA de la direccion
    latitud = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
    longitud = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
    //alert(latitud + " / " + longitud);
        coordsG = {lat: latitud, lng: longitud},
        markerG = new H.map.Marker(coordsG);
        map.addObject(markerG);
    //     alert(JSON.stringify(data));
    }, function(xhr, status) { console.log("error geo: "+status); }   );


*/
})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="chats"]', function (e) {
  $$('#chatGeneral').on('click', function () {
    tituloChat = "Chat general";
    mainView.router.navigate('/chat-general/');
  });
  $$('#chatCasa').on('click', function () {
    tituloChat = "Casa";
    mainView.router.navigate('/chat-general/');
  });
  cargarDatosUsuario();
  $$('#cerrarSesion').on('click', cerrarSesion);
})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="chat-general"]', function (e) {
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
        header: person.name + ' is typing',
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
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="index"]', function (e) {
  //  console.log(e);
  // Variable bandera para entrar a crear cuenta
  $$('#nuevaCuenta').on('click', function () {
    nuevaCuenta = 1;
    mainView.router.navigate('/inicioSesion/');
  });
  $$('#iniciarSesion').on('click', function () {
    nuevaCuenta = 0;
    mainView.router.navigate('/inicioSesion/');
  });
})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="inicioSesion"]', function (e) {
  //  console.log(e);
  // Voy a usar esta misma vista para crear la cuenta con el servicio de autenticacion
  // sign in con firebase auth
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
      });
      mainView.router.navigate('/crearCuenta/');
    };
    /****************************************************************************************/
  } else {
    if ($$('#colorEncabezado').hasClass('rojo')) {
      $$('#colorEncabezado').removeClass('rojo').addClass('azul');
      $$('#tituloLogin').text('Iniciar sesión');
      $$('#olvideContrasena').removeClass('oculto');
    }
    // log in con firebase auth
    $$('#ingresar').on('click', function () {
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
          mainView.router.navigate('/chats/');
        }
      });
    });
  }
})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="crearCuenta"]', function (e) {
  console.log(e);
  // declaro estas variables por si el dia de mañana quiero agregar mas avatares
  var filas = 15;
  var fila = 1;
  var avatarN = 1;
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
})
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
  mainView.router.navigate('/ubicacion/');
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
/*HACER LA QUERY A LA BD Y CARGAR TODA LA INFO DE USUARIO AL PANEL*/
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
/********************************************************************************/
/*codigo de la api de mapas*/
function mapApi(la, lo) {
  lat = la;
  lon = lo;
  console.log("latitud: " + la);
  console.log("longitud: " + lo);
  // Por el momento voy a guardar en la base de datos la latitud y longitud
  /*
/// NO me deja setearlo igual que abajo asi que lo hago con un update
 var data = {
    latitud: lat,
    longitud: lon
  }

//  refUsuarios.doc(email).set(data);
 refUsuarios.doc(email).set(data);
*/
  // Tampoco anda..
  refUsuarios.doc(email).update({
    latitud: lat,
    longitud: lon
  }).then(function () {
    console.log("actualizado ok");
  }).catch(function (error) {
    console.log("Error: " + error);
  });
};

function cerrarSesion() {
  firebase.auth().signOut().then(function () {
    // Sign-out successful.
    //reestablesco todas las variables
    email = "", password = "", tituloChat = "", nombre = "", telefono = "", usuario = "", avatar = "", tipo = "", lat = "", lon = "", sinRuta = "";
    //voy al index
    mainView.router.navigate('/index/');
    app.panel.close().destroy();
    //me tira error de consola el destroy() pero es la secuencia que funciona al parecer
  }).catch(function (error) {
    // An error happened.
  });
};