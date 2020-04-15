// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var app = new Framework7({
    // App root element
    root: '#app',
    // App Name
    name: 'My App',
    // App id
    id: 'com.myapp.test',
    // Enable swipe panel
    panel: {
      swipe: 'left',
    },
    // *****************RUTAS*********************
    routes: [
      {
        path: '/about/',
        url: 'about.html',
      },
     {
        path: '/inicioSesion/',
        url: 'inicio-sesion.html',
      },
      {
        path: '/crearCuenta/',
        url: 'nueva-cuenta.html',
      },
      {
        path: '/ubicacion/',
        url: 'ubicacion.html',
      },
      {
        path: '/chats/',
        url: 'chats.html',
      },
      {
        path: '/chat-general/',
        url: 'chat-general.html',
      },
    ]
    // ... other parameters
  });

var mainView = app.views.create('.view-main');

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");

var email , password, tituloChat;

});

// Option 1. Using one 'page:init' handler for all pages
$$(document).on('page:init', function (e) {
    // Do something here when page loaded and initialized
    console.log(e);
})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="index"]', function (e) {
    console.log(e);
})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="about"]', function (e) {
    console.log(e);
})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="inicioSesion"]', function (e) {
    console.log(e);

// login con firebase

$$('#ingresar').on('click',function(){

// email = $$('#emailLogin').val();
// password = $$('#passwordLogin').val();
// Estoy puenteando el login para trabajar más comodo con las vistas
 email = "programacion21@live.com";
 password = "kat13579";

//Se declara la variable huboError (bandera)
        var huboError = 0;
firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(function(error) {
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
                mainView.router.navigate('/chats/');
            }
        }); 
        }); 
// segun la documentacion de firebase hay que poner un observador para ver si se hizo el login
/*firebase.auth().onAuthStateChanged(function(user) {
  console.log('state change');
  if (user) { 
    // User is signed in.
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    console.log('Success!! email '+email);
    // ...
  } else {
    // User is signed out.
    // ...
    console.log('User is signed out');
  }
});
*/

})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="crearCuenta"]', function (e) {
    console.log(e);
// declaro estas variables por si el dia de mañana quiero agregar mas avatares
var filas = 15;
var fila = 1;
var avatar = 1;
//llamada a la carga de avatares dentro del popup dinamicamente
$$('#avatar').on('click',cargarAvatares);
//llamada a vaciar el popup de los avatares cuando cierro o selecciono
$$('#vaciarAv').on('click',vaciarAv);
//llamada para seleccionar el avatar clickeado pasandole el src del clickeado a avatarSeleccionado()
$$('#cargaAvatar').on('mouseenter',function(){
$$('.av').on('click',function(){avatarSeleccionado(this.src);});
});
//llamada para crear el usuario almacenandolo en firebase
$$('#crearUsuario').on('click',crearUsuario);

// cuando abro el popup de los avatares creo las filas y los avatares de manera dinámica
function cargarAvatares(){
for (var i = 1; i <= filas; i++){
$$('#cargaAvatar').append('<div class="row fila'+fila+'">');
for (var j = 1; j <= 4; j++){
$$('.fila'+fila).append('<div class="col-25"><img src="img/min/'+avatar+'.png" class="av"></div>');
avatar++;
}
$$('#cargaAvatar').append('</div>'); 
fila++;
}
}

// cuando cierro el popup de los avatares vacío el html
function vaciarAv(){
$$('#cargaAvatar').html('<br/>');
fila = 1;
avatar = 1;
};

//paso el src del avatar seleccionado a la vista de crear la cuenta, llamo a cerrar el popup y lo vacio
function avatarSeleccionado(avatar){
$$('.avatarSeleccionado').attr('src',avatar).addClass('elegido');
$$('.subtitulo').addClass('oculto');
$$('.abrirAvatares').addClass('bordeAv');
// Tuve que hacer un cambio de fondo porque una imagen png hacia contraste con el background-color
const cortado = avatar.split('/');
if(cortado[5] == "39.png"){
  $$('.abrirAvatares').addClass('fondoBlanco');
}else{
  $$('.abrirAvatares').removeClass('fondoBlanco');
}
app.popup.close();
vaciarAv();
};

// toma los valores de email y contraseña y crea la conexión con firebase para almacenarla
function crearUsuario(){
var email = $$('#email').val();
var password = $$('#password').val();

firebase.auth().createUserWithEmailAndPassword(email, password)
.catch(function(error) {
// Handle Errors here.
var errorCode = error.code;
var errorMessage = error.message;
if (errorCode == 'auth/weak-password') {
alert('Clave muy débil.');
} else {
alert(errorMessage);
}
console.log(error);
});
};



})
/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="ubicacion"]', function (e) {
    console.log(e);

// aunque declaro variables fuera de la funcion el console log solo muestra dentro del scope
var lat, lon;
    var onSuccess = function(position) {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
        alert('Latitude: '          + position.coords.latitude          + '\n' +
              'Longitude: '         + position.coords.longitude         + '\n' +
              'Altitude: '          + position.coords.altitude          + '\n' +
              'Accuracy: '          + position.coords.accuracy          + '\n' +
              'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
              'Heading: '           + position.coords.heading           + '\n' +
              'Speed: '             + position.coords.speed             + '\n' +
              'Timestamp: '         + position.timestamp                + '\n');
lat = lat.toFixed(2);
lon = lon.toFixed(2);
console.log("lat "+lat+" lon "+lon);
};
    
 /*codigo de la api de mapas, supongo**/

})

/****************************************************************************************/
$$(document).on('page:init', '.page[data-name="chats"]', function (e) {

$$('#chatGeneral').on('click',function(){tituloChat = "Chat general"; mainView.router.navigate('/chat-general/');});
$$('#chatCasa').on('click',function(){tituloChat = "Casa"; mainView.router.navigate('/chat-general/'); });




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
var answers = [
  'Yes!',
  'No',
  'Hm...',
  'I am not sure',
  'And what about you?',
  'May be ;)',
  'Lorem ipsum dolor sit amet, consectetur',
  'What?',
  'Are you sure?',
  'Of course',
  'Need to think about it',
  'Amazing!!!'
]
var people = [
  {
    name: 'Kate Johnson',
    avatar: 'https://cdn.framework7.io/placeholder/people-100x100-9.jpg'
  },
  {
    name: 'Blue Ninja',
    avatar: 'https://cdn.framework7.io/placeholder/people-100x100-7.jpg'
  }
];
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

