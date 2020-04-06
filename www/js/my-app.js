  
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
    // Add default routes
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
    ]
    // ... other parameters
  });

var mainView = app.views.create('.view-main');

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");

});

// Option 1. Using one 'page:init' handler for all pages
$$(document).on('page:init', function (e) {
    // Do something here when page loaded and initialized
    console.log(e);
})

// Option 2. Using live 'page:init' event handlers for each page
$$(document).on('page:init', '.page[data-name="about"]', function (e) {
    // Do something here when page with data-name="about" attribute loaded and initialized
    console.log(e);
})

$$(document).on('page:init', '.page[data-name="inicioSesion"]', function (e) {
    // Do something here when page with data-name="about" attribute loaded and initialized
    console.log(e);

})

$$(document).on('page:init', '.page[data-name="crearCuenta"]', function (e) {
    // Do something here when page with data-name="about" attribute loaded and initialized
    console.log(e);



$$('.av').on('click',function(){avatarSeleccionado(this)});

function avatarSeleccionado(avatar){
//$$('.avatar').attr('src',avatar);
console.log(avatar);
};



$$('#avatar').on('click',cargarAvatares);
var filas = 15;
var fila = 1;
var avatar = 1;

function cargarAvatares(){
for (var i = 1; i <= filas; i++){
$$('#cargaAvatar').append('<div class="row fila'+fila+'">');
for (var j = 1; j <= 4; j++){
$$('.fila'+fila).append('<div class="col-25"><img src="img/'+avatar+'.png" class="av"></div>');
avatar++;
}
$$('#cargaAvatar').append('</div>'); 
fila++;
}
}



$$('#vaciarAv').on('click',function(){
$$('#cargaAvatar').html('<br/>');
fila = 1;
avatar = 1;
});



})

$$(document).on('page:init', '.page[data-name="ubicacion"]', function (e) {
    // Do something here when page with data-name="about" attribute loaded and initialized
    console.log(e);











})