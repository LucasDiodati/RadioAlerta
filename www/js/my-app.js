var $$ = Dom7;
var app = new Framework7({
    root: '#app',
    name: 'Radio Alerta',
    id: 'com.app.RadioAlerta',
    // Variables del panel lateral
    panel: {
        swipe: 'left',
        swipe: 'true',
        swipeOnlyClose: 'true',
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
        beforeLeave: function(routeTo, routeFrom, resolve, reject) {
            if (1 === 1) {
                // guardo la fecha de ultima conexion en bd
                guardarUltimaConexion();
                resolve();
            } else {
                // tbd
            }
        }
    }, ]
});
var mainView = app.views.create('.view-main');

var email, password, tituloChat, nombre, telefono, usuario, avatar, tipo, lat, lon, sinRuta,
    map, circle, circleOutline, circleTimeout, ubicacionGeodecodificada, nombrePuntero, marker, cargar, distancia;
var hayUbicaciones = 0;
var nuevaUbicacion = 0;
var latPuntero = "";
var lonPuntero = "";
var usuario = "no cargo el usuario";
// variable bandera para ingresar o crear cuenta
var nuevaCuenta = 0;
// para la ubicacion actual y el radio por defecto
var latUsuario = 0,
    lonUsuario = 0;
var latCerca, lonCerca;
var vistaMapa = 1;
var radioAlerta = 300;
var radioPuntero = 300;
var login = 0;
var coordsG, behavior, target;
var idChatPersonalizado;
// para el autologin con recordar contraseña
var storage = window.localStorage;
var us = {
    "email": "",
    "clave": ""
};
var usuarioLocal = "",
    claveLocal = "";
// BASE DE DATOS
var db, refUsuarios, refTiposUsuarios, refUbicaciones, refMensajes, refChats;
//AVATARES variables de orden de avatares para futura expansión
var filas = 15;
var fila = 1;
var avatarN = 1;
/************PARA LOS MENSAJES DE FRAMEWORK 7*************************/
var messages, ultimaConexion, rUsuario, rAvatar, r, messagebar, responseInProgress;
var contadorGlobal = 0;
var mensajesCargados;
var guardarConexion;
/******************************************************************************/
/************************************************************************************************DEVICE READY*/
// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");

    consultarLocalStorage();

    var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    if (app) {
        // PhoneGap application
        // traigo la posicion del GPS 
        var onSuccess = function(position) {
            lat = position.coords.latitude;
            lon = position.coords.longitude;
            console.log(" MOBILE LAT " + lat + " MOBILE LON " + lon);
        };
        // onError Callback receives a PositionError object
        function onError(error) {
            alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    } else {
        // Uso variables harcodeadas para servir la app desde pc
        // Peatonal cordoba y san martin
        latCerca = "-32.9467536";
        lonCerca = "-60.6373007";

        // Plaza pringles
        lat = "-32.9456448";
        lon = "-60.6445155";

        console.log("LAT COMPUTADORA: " + lat + " LON COMPUTADORA: " + lon);
    }
    /* seteo variables de BD */
    db = firebase.firestore();
    refUsuarios = db.collection("USUARIOS");
    refTiposUsuarios = db.collection("TIPOS_USUARIOS");
    refMensajes = db.collection("MENSAJES");
    refChats = db.collection("CHATS");

    var iniciarDatos = 0;
    if (iniciarDatos == 1) {
        fnIniciarDatos();
    }

});

$$(document).on('page:init', function(e) {
    console.log(e);
})
/**********************************************************************************************************MAPA*/
$$(document).on('page:init', '.page[data-name="mapa"]', function(e) {

    panelIzq(); // cargo el panel

    function vistaMapa4() {
        //Agregar el selector de rango
        //solo puedo modificar el rango de radio
        $$('#tituloMapa').text("Elegir el radio");
        $$('.siguienteMapa').text("Radio ok!");
        $$('.siguienteMapa').on('click', function() {
            //almaceno el radio
            console.log("radio del puntero: " + radioPuntero);
            console.log("posicion del puntero: lat" + latPuntero + " lon puntero" + lonPuntero);
            //Aca el prompt para ingresar el nombre
            // EN EL PROMPT TENGO QUE AGREGAR COMO VALUE Y TITULO EL NOMBRE DE LA UBICACION
            app.dialog.prompt('Puede modificarlo o dejarlo como está:', "Modificar el nombre:", function(name) {
                nombrePuntero = name;
                guardarUbicac();
            }, noGuardar(), nombrePuntero);

        });

        function guardarUbicac() {
            // UPDATE del radio y el nombre
            var data = {
                radio: radioPuntero,
                nombre: nombrePuntero
            };
            refUbicaciones.doc(idChatPersonalizado).update(data);
            mainView.router.navigate('/chats/');
        };

        function noGuardar() {
            // UPDATE del radio
            var data = {
                radio: radioPuntero
            };
            refUbicaciones.doc(idChatPersonalizado).update(data);
            mainView.router.navigate('/chats/');
        };

        $$('.cajaUbicacion').addClass('oculto');
        $$('.radioAlerta').removeClass('oculto');

        var range = app.range.create({
            el: '.radioAlerta',
            step: 5,
            label: true,
            min: 100,
            max: 800,
            scale: true,
            scaleSteps: 7,
            scaaleSubSteps: 4,
            on: {
                change: function() {
                    radioPuntero = range.value;
                    console.log('radioPuntero: ' + radioPuntero);
                    map.removeObject(circleGroup);
                    circuloModificable(latPuntero, lonPuntero, radioPuntero);
                    console.log("moviendo EL CIRCULO " + latPuntero + " " + lonPuntero);
                    mostrarRadio(radioPuntero);
                }
            }
        })


        console.log("CREANDO EL CIRCULO " + latPuntero + " " + lonPuntero);
        circuloModificable(latPuntero, lonPuntero, radioPuntero);
        //ACA FRENO AL PUNTERO
        marker.draggable = false;
        console.log("draggable? : " + marker.draggable);

    }

    function vistaMapa3() {
        //ANTES DE CARGAR EL MAPA TENGO QUE TRAER LA INFO GUARDADA DE LA BD

        refUbicaciones.doc(idChatPersonalizado).get()
            .then(function(doc) {
                latPuntero = doc.data().latitud;
                lonPuntero = doc.data().longitud;
                nombrePuntero = doc.data().nombre;
                radioPuntero = doc.data().radio;
                console.log("nombre " + nombrePuntero);
                mapaConUI(latPuntero, lonPuntero);

                // AGREGAR PUNTERO DRAGGABLE

                $$('#tituloMapa').text(nombrePuntero);
            })
            .catch(function(error) {
                console.log("Error en la consulta para editar ubicacion personalizada: ", error);
            });

        $$('.siguienteMapa').text("Ubicación ok!");
        $$('.siguienteMapa').on('click', function() {

            // ACTUALIZAR LAT Y LON DEL PUNTERO EN LA BD

            var data = {
                latitud: latPuntero,
                longitud: lonPuntero
            };
            refUbicaciones.doc(idChatPersonalizado).update(data);

            vistaMapa4();
        });

        $$('.cajaUbicacion').removeClass('oculto');
        //Saco el selector y agrego el textbox de ubicaciones
        $$('.radioAlerta').addClass('oculto');
    }

    function vistaMapa2() {
        /*******************MODIFICAR RADIO DE GLOBAL*****************************/
        mapaConUI(lat, lon);
        //Agregar el selector de rango
        //solo puedo modificar el rango de radio
        $$('#tituloMapa').text("Modificar el radio");
        $$('.siguienteMapa').text("Radio ok!");
        $$('.siguienteMapa').on('click', function() {
            //almaceno el radio
            // radioAlerta
            var data = {
                radio: radioAlerta
            };
            refUbicaciones.doc('GLOBAL').update(data);
            mainView.router.navigate('/chats/');
        });
        $$('.cajaUbicacion').addClass('oculto');
        $$('.radioAlerta').removeClass('oculto');

        var range = app.range.create({
            el: '.radioAlerta',
            step: 5,
            label: true,
            min: 100,
            max: 800,
            scale: true,
            scaleSteps: 7,
            scaaleSubSteps: 4,
            on: {
                change: function() {
                    radioAlerta = range.value;
                    console.log('radioPuntero: ' + radioAlerta);
                    map.removeObject(circleGroup);
                    circuloModificable(lat, lon, radioAlerta);
                    console.log("moviendo EL CIRCULO " + lat + " " + lon);
                    mostrarRadio(radioAlerta);
                }
            }
        })

        $$('#ubicacionAceptada').on('click', function() {
            // guardar los cambios en el rango
            actualizarPerfil("radio");
        });

    }

    function vistaMapa1() {
        /*******************SELECCIONAR RADIO*****************************/
        //Agregar el selector de rango
        //solo puedo modificar el rango de radio
        $$('#tituloMapa').text("Elegir el radio");
        $$('.siguienteMapa').text("Radio ok!");
        $$('.siguienteMapa').on('click', function() {
            //almaceno el radio
            console.log("radio del puntero: " + radioPuntero);
            console.log("posicion del puntero: lat" + latPuntero + " lon puntero" + lonPuntero);
            //Aca el prompt para ingresar el nombre
            app.dialog.prompt('Ingrese un nombre de ubicación:', 'Nueva ubicación', function(name) {
                nombrePuntero = name;
                guardarUbicac();
            });

        });

        function guardarUbicac() {
            agregarUbicacionPersonalizada(latPuntero, lonPuntero, nombrePuntero, radioPuntero);
            mainView.router.navigate('/chats/');
        };


        $$('.cajaUbicacion').addClass('oculto');
        $$('.radioAlerta').removeClass('oculto');

        var range = app.range.create({
            el: '.radioAlerta',
            step: 5,
            label: true,
            min: 100,
            max: 800,
            scale: true,
            scaleSteps: 7,
            scaaleSubSteps: 4,
            on: {
                change: function() {
                    radioPuntero = range.value;
                    console.log('radioPuntero: ' + radioPuntero);
                    map.removeObject(circleGroup);
                    circuloModificable(latPuntero, lonPuntero, radioPuntero);
                    console.log("moviendo EL CIRCULO " + latPuntero + " " + lonPuntero);
                    mostrarRadio(radioPuntero);
                }
            }
        })


        console.log("CREANDO EL CIRCULO " + latPuntero + " " + lonPuntero);
        circuloModificable(latPuntero, lonPuntero, radioPuntero);
        //ACA FRENO AL PUNTERO
        marker.draggable = false;
        console.log("draggable? : " + marker.draggable);

    }

    function vistaMapa0() {
        mapaConUI(lat, lon);
        /********************SELECCIONAR UBICACION************************/
        // mostrar un mapa donde se puede agregar un puntero escribiendo una dirección 
        // o clickeando el mapa y que sea arrastrable
        // click en "seleccionar radio" >> congela el puntero y me da el radio draggable con el selector de rango
        // click en Listo >> prompt "ingrese el nombre de la nueva ubicación"
        // en ok pasar los datos a >> agregarUbicacionPersonalizada(latU,lonU,nombreU,radioU);
        $$('#tituloMapa').text("Elegir ubicación");
        $$('.siguienteMapa').text("Ubicación ok!");
        $$('.siguienteMapa').on('click', function() {
            if (latPuntero !== "" && lonPuntero !== "") {
                console.log("posicion saliendo de la vista 0: lat " + latPuntero + " - lon " + lonPuntero);
                //elimino el puntero draggable
                vistaMapa1();
            } else {
                alert("Adelante, elegí tu ubicación..");
            }

        });
        $$('#ubicacionAceptada').on('click', function() {
            // guardar lat y lon en variables globales y pasar al selector del radio
            // avisar al selector de radio que es una nueva ubicacion
        });
        $$('.cajaUbicacion').removeClass('oculto');
        //Saco el selector y agrego el textbox de ubicaciones
        $$('.radioAlerta').addClass('oculto');
    }

    if (vistaMapa == 1) {
        vistaMapa1();
    } else if (vistaMapa == 0) {
        vistaMapa0();
    } else if (vistaMapa == 2) {
        vistaMapa2();
    } else if (vistaMapa == 3) {
        vistaMapa3();
    }

})
/***********************************************************************************************PERFIL USUARIO*/
$$(document).on('page:init', '.page[data-name="p-us"]', function(e) {
    console.log("perfil");
    panelIzq();
    cargarDatosUsuario();
    $$('#actualizarPerfil').on('click', function() {
        actualizarPerfil("perfil");
    });

    //llamada a la carga de avatares dentro del popup dinamicamente
    $$('#modalAvatares').on('click', cargarAvatares);
    //llamada a vaciar el popup de los avatares cuando cierro o selecciono
    $$('#vaciarAv').on('click', vaciarAv);
    //llamada para seleccionar el avatar clickeado pasandole el src del clickeado a avatarSeleccionado()
    $$('#cargaAvatar').on('mouseenter', function() {
        $$('.av').on('click', function() {
            avatarSeleccionado(this.src);
        });
    });

})
/********************************************************************************************************INDEX*/
$$(document).on('page:init', '.page[data-name="index"]', function(e) {
    console.log(e);
    // Variable bandera para entrar a crear cuenta
    $$('#nuevaCuenta').on('click', function() {
        nuevaCuenta = 1;
        mainView.router.navigate('/inicioSesion/');
    });
    $$('#iniciarSesion').on('click', function() {
        nuevaCuenta = 0;
        mainView.router.navigate('/inicioSesion/');
    });

})
/*************************************************************************INICIO SESION Y CREAR CUENTA CON AUTH*/
$$(document).on('page:init', '.page[data-name="inicioSesion"]', function(e) {
    console.log(e);
    /*******************CREAR CUENTA********************/
    // Voy a usar esta misma vista para crear la cuenta con el servicio de autenticacion
    if (nuevaCuenta == 1) {
        if ($$('#colorEncabezado').hasClass('azul')) {
            $$('#colorEncabezado').removeClass('azul').addClass('rojo');
            $$('#tituloLogin').text('Crear cuenta');
            $$('#olvideContrasena').addClass('oculto');
        }
        $$('#ingresar').on('click', function() {
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
        $$('#ingresar').on('click', function() {
            loginConEmail();
        });
    }
})
/***************************************************************************************CREAR CUENTA 2DA VISTA*/
$$(document).on('page:init', '.page[data-name="crearCuenta"]', function(e) {
    console.log(e);
    //llamada para crear el usuario almacenandolo en firebase y redireccionar a ubicacion
    $$('#crearUsuario').on('click', function() {
        fnGuardarDP();
    });
    //llamada a la carga de avatares dentro del popup dinamicamente
    $$('#modalAvatares').on('click', cargarAvatares);
    //llamada a vaciar el popup de los avatares cuando cierro o selecciono
    $$('#vaciarAv').on('click', vaciarAv);
    //llamada para seleccionar el avatar clickeado pasandole el src del clickeado a avatarSeleccionado()
    $$('#cargaAvatar').on('mouseenter', function() {
        $$('.av').on('click', function() {
            avatarSeleccionado(this.src);
        });
    });

})
/********************************************************************************************************CHATS*/
$$(document).on('page:init', '.page[data-name="chats"]', function(e) {
    panelIzq();
    cargarInfoUsuario(email);
    cargarChats();
    cargarDatosUsuario();
    app.on('swipeout', function(el) {
        idChatPersonalizado = el.id; //console.log('Swipe al chat con id: '+idElemento);
        // capturé el id en swipe y lo paso en el click de configuracion a las vistas de mapas
        $$('.configuracion').on('click', function() {
            console.log(idChatPersonalizado);
            vistaMapa = 3;

            mainView.router.navigate('/mapa/');
        });

    });

    app.on('swipeoutDeleted', function() {
        console.log(idChatPersonalizado);
        refUbicaciones.doc(idChatPersonalizado).delete()
            .then(function() {
                console.log("El chat fue eliminado de la bd");
            }).catch(function(error) {
                console.log("Error al borrar el chat");
            });

    });



    $$('#configGeneral').on('click', function() {
        vistaMapa = 2;
        mainView.router.navigate('/mapa/');
    });

    $$('#chatGeneral').on('click', function() {
        tituloChat = "Chat general";
        cargar = "global";
        mainView.router.navigate('/chat-general/');
    });
    $$('#ubicacionesFirestore').on('click', function() {
        //Y aca tengo que cargar los datos del chat personalizado para entrar en modo fantasma 
        tituloChat = "Chat general";
        cargar = "global";
        mainView.router.navigate('/chat-general/');
    });




    $$('#agregarUbicacion').on('click', function() {
        vistaMapa = 0;
        mainView.router.navigate('/mapa/');
    });

})
/*************************************************************************************************CHAT GENERAL*/
$$(document).on('page:init', '.page[data-name="chat-general"]', function(e) {
    panelIzq();
    $$('#tituloChat').text(tituloChat);
    $$('.send-link').on('click', enviarMensaje);
    ultimaConexion = "hoy";
    // Inicializo los mensajes
    messages = app.messages.create({
        el: '.messages',
        firstMessageRule: function(message, previousMessage, nextMessage) {
            if (message.isTitle) return false;
            if (!previousMessage || previousMessage.type !== message.type || previousMessage.name !== message.name) return true;
            return false;
        },
        lastMessageRule: function(message, previousMessage, nextMessage) {
            if (message.isTitle) return false;
            if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name) return true;
            return false;
        },
        tailMessageRule: function(message, previousMessage, nextMessage) {
            if (message.isTitle) return false;
            if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name) return true;
            return false;
        },

    });
    // Init Messagebar
    messagebar = app.messagebar.create({
        el: '.messagebar'
    });
    // Response flag
    responseInProgress = false;
    traerUltimaConexion();
    //Escucha asincronica a la bd en coleccion de mensajes
    escucharMensajes();

})
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/*************************************FUNCIONES DE LOS MENSAJES*************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************** CARGAR MENSAJES DESDE LA ULTIMA CONEXION Y ANTERIORES *******************************/
function cargarMensajes(timestamp) {
    var d = new Date(timestamp);
    mensajesCargados = new Array();
    var i;
    ultimaConexion =
        d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' - ' + d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds();

    if (cargar == "global") {
        // Traigo el radio alerta de la base de datos y tomo mi lat y lon actual para llamar a los mensajes que corresponda
        refUsuarios.doc(email).collection('UBICACIONES').doc('GLOBAL').get()
            .then(function(doc) {
                if (doc.data().radio !== undefined) {
                    radioAlerta = doc.data().radio;
                } else {
                    radioAlerta = 500; // Valor por defecto
                    //Si no registro nunca el radio manualmente se lo seteo en la bd la primera vez que entra al chat global
                    var data = {
                        radio: radioAlerta
                    };
                    refUsuarios.doc(email).collection('UBICACIONES').doc('GLOBAL').update(data);
                }
                console.log("desde la query al user tome el radio: " + radioAlerta);
            })
            .catch(function(error) {
                console.log("Le mensaje de error: " + error);
            });

        refMensajes.where("destinatario", "==", "global").orderBy("fecha", "asc").get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    var m = doc.data().mensaje;
                    var r = doc.data().remitente;
                    var u = doc.data().usuario;
                    var a = doc.data().avatar;
                    var la = doc.data().latitud;
                    var lo = doc.data().longitud;
                    var h = doc.data().fecha;
                    var idMensaje = doc.id;
                    var hm = new Date(h);
                    var horaMensaje = hm.getDate() + '/' + (hm.getMonth() + 1) + '/' + hm.getFullYear() + ' - ' + hm.getHours() + ':' + hm.getMinutes();

                    // Aca voy a usar el radio con la funcion de distancias y calculo si tomo el mensaje o no 
                    distancia = getDistanciaMetros(lat, lon, la, lo);
                    if (distancia > radioAlerta) {
                        console.log("el mensaje " + doc.id + " esta fuera de tu radio");
                    } else {
                        recibirCualquierMensaje(m, r, h, horaMensaje, idMensaje, u, a);

                    }
                });
            })
            .catch(function(error) {
                console.log("Error en la consulta: ", error);
            });
        // aca deberia imprimir la fecha de ultima conexion y un separador
        // tambien un focus() en el primer mensaje que cargue
    };
}
/************************* FIN CARGAR MENSAJES DESDE LA ULTIMA CONEXION Y ANTERIORES ******************************/
/******************************* RECIBO LOS MENSAJES DE FORMA ORDENADA DE LA BD ***********************************/
function recibirCualquierMensaje(m, r, h, horaMensaje, idMensaje, u, a) {
    var tipoM;
    var usuarioM = u;
    var avatarM = a;
    if (r == email) {
        tipoM = "sent";
        usuarioM = usuario;
        avatarM = sinRuta;
    } else {
        tipoM = "received";
    }

    messages.addMessage({
        text: m,
        type: tipoM,
        name: '@' + usuarioM,
        avatar: avatarM,
        textFooter: horaMensaje,
        cssClass: idMensaje
    });

    refMensajes.where("id", "==", "idMensaje").get().then(function(doc) {
            console.log(idMensaje);

            //traer nick y avatar del remitente
            refUsuarios.doc(r).get()
                .then(function(doc) {
                    usuarioM = doc.data().usuario;
                    avatarM = doc.data().avatar;
                    console.log("query: " + usuarioM);

                    // Despues de cargar los mensajes actualizo la info de remitente
                    $$('.' + idMensaje + ' .message-name').text("@" + usuarioM);
                    $$('.' + idMensaje + ' .message-avatar').css('background-image', 'url("' + avatarM + '")');

                })
                .catch(function(error) {
                    console.log("Error en la consulta al usuario: ", error);

                });

        })
        .catch(function(error) {
            console.log("Error en la consulta del id de mensaje: ", error);
        });
    guardarUltimaConexion();
}
/*************************** FIN RECIBO LOS MENSAJES DE FORMA ORDENADA DE LA BD ***********************************/
/********************************** BORRAR MENSAJES DE LA BASE DE DATOS *******************************************/
function borrarMensaje(id) {
    refMensajes.doc(id).delete()
        .then(
            function() {
                console.log("Documento borrado!");
                //esto elimina el mensaje de la vista de chat tambien // tengo que pasarle un selector como parametro
                messages.removeMessage(messages);
            }).catch(function(error) {
            console.log("Error al intentar borrar el mensaje: ", error);
        });
}
/****************************** FIN BORRAR MENSAJES DE LA BASE DE DATOS *******************************************/
function borrarTodosLosMensajes() {
    // Nada puede malir sal
    refMensajes.where("destinatario", "==", "global").get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                var id = doc.id;

                refMensajes.doc(id).delete()
                    .then(function() {
                        console.log("Documento borrado!");
                    }).catch(function(error) {
                        console.log("Error al intentar borrar el mensaje: ", error);
                    });
            })
        })
        .catch(function(error) {
            console.log("Error en la consulta: ", error);
        });
}

/************************ AGREGA AL CHAT UN GLOBO DE MENSAJE ENVIADO CON LOS PARAMETROS ***************************/
function recibirMiMensaje(usuario, m, sinRuta, horaMensaje) {
    messages.addMessage({
        text: m,
        type: 'sent',
        name: '@' + usuario,
        avatar: sinRuta,
        textFooter: horaMensaje
    });
};
/********************* FIN AGREGA AL CHAT UN GLOBO DE MENSAJE ENVIADO CON LOS PARAMETROS ***************************/
/********************** AGREGA AL CHAT UN GLOBO DE MENSAJE RECIBIDO CON LOS PARAMETROS *****************************/
function recibirMensajeYa(remitente, mensaje, avatar, horaMensaje) {
    messages.addMessage({
        text: mensaje,
        type: 'received',
        name: '@' + remitente,
        avatar: avatar,
        textFooter: horaMensaje
    });
};
/******************* FIN AGREGA AL CHAT UN GLOBO DE MENSAJE RECIBIDO CON LOS PARAMETROS ****************************/
/***************************** NUEVO MENSAJE GUARDA EL MENSAJE EN LA BASE DE DATOS **********************************/
function nuevoMensaje(mensaje, dest) {
    console.log(mensaje);
    // voy a guardar: con add() no uso clave para almacenarlos
    // texto del mensaje, o imagen si hago a tiempo
    // remitente (email)
    // timestamp (fecha y hora del mensaje)
    // lat y lon (esto lo voy a usar para geoubicar el mensaje)
    // destinatario (si va al principal es "global", sino asocio el mensaje a email (fav) o id (grupo o ubicacion pers))
    timestamp = Date.now();
    var data = {
        mensaje: mensaje,
        remitente: email,
        avatar: sinRuta,
        usuario: usuario,
        fecha: timestamp,
        latitud: lat,
        longitud: lon,
        destinatario: dest
    };
    refMensajes.add(data)
        .then(function(docRef) {
            console.log("ok con el ID: " + docRef.id);
        })
        .catch(function(error) {
            console.log("Error enviando el mensaje: " + error);
        });
};
/*************************** FIN NUEVO MENSAJE GUARDA EL MENSAJE EN LA BASE DE DATOS *********************************/
/****************** ESCUCHAR MENSAJES USA ONSNAPSHOT PARA CAPTURAR CAMBIOS EN COLECCION MENSAJES *********************/
function escucharMensajes() {
    // LA CARGA DE MENSAJES NUEVOS 
    refMensajes.where("fecha", ">", "guardarConexion").onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            var idMensaje = doc.id;

            console.log("El timestamp " + guardarConexion);
            var m = doc.data().mensaje;
            var r = doc.data().remitente;
            console.log("ID DEL MENSAJE ONSNAPSHOT: " + idMensaje);
            var h = doc.data().fecha;

            traerMensaje(idMensaje, r, m, h);

            console.log("Tenes nuevos mensajes!");
            contadorGlobal++;
            // actualizo hora de ultima conexion
            guardarUltimaConexion();
        });
    });
}
/************** FIN ESCUCHAR MENSAJES USA ONSNAPSHOT PARA CAPTURAR CAMBIOS EN COLECCION MENSAJES *********************/
/************** TRAER MENSAJE UNIFICA LOS RECIBIDOS Y ENVIADOS Y IMPRIME EL MENSAJE QUE LE PASE *******************/
function traerMensaje(idMensaje, r, m, h) {
    console.log("Traigo de la base de datos el mensaje con id " + idMensaje + " de " + r + " que dice: " + m);
    if (r == email) {
        // desde el onsnapshot no necesito cargar mensajes propios
    } else {
        //traer lo que necesito del mensaje
        refUsuarios.doc(r).get()
            .then(function(doc) {
                rUsuario = doc.data().usuario;
                rAvatar = doc.data().avatar;
                var hm = new Date(h);
                var horaMensaje = hm.getHours() + ":" + hm.getMinutes();
                // mensaje recibido
                recibirMensajeYa(rUsuario, m, rAvatar, horaMensaje)
            })
            .catch(function(error) {
                console.log("Error en la consulta: ", error);
            });
    }
}
/*********** FIN TRAER MENSAJE UNIFICA LOS RECIBIDOS Y ENVIADOS Y IMPRIME EL MENSAJE QUE LE PASE ******************/
/******************************* GUARDAR EN BD LA ULTIMA CONEXION AL CHAT ******************************************/
function guardarUltimaConexion() {
    guardarConexion = Date.now();

    if (cargar == "global") {
        var data = {
            ultimaConexion: guardarConexion
        }
        refUbicaciones.doc("GLOBAL").update(data);
        console.log("DESDE guardarUltimaConexion " + guardarConexion);
    }
}
/****************************** FIN GUARDAR EN BD LA ULTIMA CONEXION AL CHAT ***************************************/
/******************************* TRAER DE LA BD LA ULTIMA CONEXION AL CHAT *****************************************/
function traerUltimaConexion() {
    if (cargar == "global") {
        refUbicaciones.doc("GLOBAL").get().then(function(doc) {
                var d = new Date(doc.data().ultimaConexion);
                ultimaConexion = d.getDate() +
                    '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + " - " + d.getHours() + ":" + d.getMinutes() + "." + d.getSeconds();
                console.log("DESDE traerUltimaConexion " + ultimaConexion);
                $$('.ultimaConexion').html(
                    '<span style="font-size:1em; font-weight:bold;">Mensajes desde: ' + d.getDate() + '/' + (d.getMonth() + 1) +
                    ' - <b style="color:#2A52BE;">' + d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds() + '</b></span>');
                cargarMensajes(doc.data().ultimaConexion);
            })
            .catch(function(error) {
                console.log("Error en la consulta de ultima conexion: ", error);
            });
    }
}
/**************************** FIN TRAER DE LA BD LA ULTIMA CONEXION AL CHAT *****************************************/
/******************************* RECIBIR MENSAJE (FUNCION DE FRAMEWORK 7) ********************************************/
function recibirMensaje(remitente, mensaje, avatar) {
    responseInProgress = true;
    setTimeout(function() {
        // Get random answer and random person
        /*  var answer = answers[Math.floor(Math.random() * answers.length)];
          var person = people[Math.floor(Math.random() * people.length)];*/
        // Show typing indicator
        messages.showTyping({
            header: remitente + ' está escribiendo',
            avatar: avatar
        });
        setTimeout(function() {
            // Add received dummy message
            messages.addMessage({
                text: mensaje,
                type: 'received',
                name: remitente,
                avatar: avatar
            });
            // Hide typing indicator
            messages.hideTyping();
            responseInProgress = false;
        }, 4000);
    }, 1000);
};
/**************************** FIN RECIBIR MENSAJE (FUNCION DE FRAMEWORK 7) *******************************************/
/******************************* ENVIAR MENSAJE (FUNCION DE FRAMEWORK 7) *********************************************/
function enviarMensaje() {
    var timestamp = Date.now();
    var hm = new Date(timestamp);
    var horaMensaje = hm.getHours() + ":" + hm.getMinutes();
    // Send Message
    var mensaje = messagebar.getValue().replace(/\n/g, '<br>').trim();
    // return if empty message
    if (!mensaje.length) return;
    // Clear area
    messagebar.clear();
    // Return focus to area
    messagebar.focus();
    // Add message to messages
    messages.addMessage({
        text: mensaje,
        type: 'sent',
        name: '@' + usuario,
        avatar: sinRuta,
        textFooter: horaMensaje
    });
    nuevoMensaje(mensaje, "global");
    if (responseInProgress) return;
};
/**************************** FIN ENVIAR MENSAJE (FUNCION DE FRAMEWORK 7) *********************************************/



/*******************************************************************************************************************/
/*******************************************************************************************************************/
/********************************************FUNCIONES DE MAPAS*****************************************************/
/*******************************************************************************************************************/
/*******************************************************************************************************************/
/***************************** OBTENER LA DISTANCIA ENTRE DOS UBICACIONES ******************************************/
function getDistanciaMetros(lat1, lon1, lat2, lon2) { // Tomo dos ubicaciones y devuelvo la distancia
    console.log("entro a getDistanciaMetros")
    rad = function(x) {
        return x * Math.PI / 180;
    }
    var R = 6378.137; //Radio de la tierra en km
    var dLat = rad(lat2 - lat1);
    var dLong = rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(lat1)) *
        Math.cos(rad(lat2)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //aquí obtienes la distancia en metros por la conversion 1Km =1000m
    distancia = R * c * 1000;
    distancia = Math.round(distancia);
    return distancia;
    console.log(distancia);
};
/************************** FIN OBTENER LA DISTANCIA ENTRE DOS UBICACIONES *****************************************/
/******************************************** MAPA DE HERE CON UI **************************************************/
function mapaConUI(latitud, longitud) { // Toma parametros para centrar el mapa en la ubicacion actual
    // Aca: https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/map-controls-ui.html
    //Initialize the Platform object:
    var platform = new H.service.Platform({
        'apikey': '0RTLydGJnLLp5DlfAFU0ctJ3CUbIiBHqs4K-qMAxFlY' // ocultar para produccion
    });

    // Get the default map types from the Platform object:
    var defaultLayers = platform.createDefaultLayers();

    // Instantiate the map:
    map = new H.Map(
        document.getElementById('mapContainer'),
        defaultLayers.vector.normal.map, {
            zoom: 15,
            center: {
                lng: longitud,
                lat: latitud
            }, // las variables de parametro
            pixelRatio: window.devicePixelRatio || 1
        });
    // MapEvents enables the event system
    // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
    behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    // Create the default UI components
    var ui = H.ui.UI.createDefault(map, defaultLayers);

    var mapSettings = ui.getControl('mapsettings');
    var zoom = ui.getControl('zoom');
    var scalebar = ui.getControl('scalebar');

    mapSettings.setAlignment('top-left');
    zoom.setAlignment('top-left');
    scalebar.setVisibility(false);

    if (vistaMapa == 1 || vistaMapa == 4) {
        /*AGREGO UN CIRCULO EDITABLE SOBRE LA POSICION ACTUAL*/
        circuloModificable(latPuntero, lonPuntero, radioPuntero);
    } else if (vistaMapa == 0) {
        console.log(vistaMapa);
        $$('#geocodificamelo').on('click', function() {
            var busqueda = $$('#busquedaUbicacion').val();
            geocodificador(busqueda);
            console.log(busqueda);
        });
    } else if (vistaMapa == 2) {

        // https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/marker-objects.html

        // using a PNG icon with its natural size (which is 32x32 in this case)
        var pngIcon = "./img/iconos_logo/rojo.png";
        var icon = new H.map.Icon(pngIcon),
            coords = {
                lat: lat,
                lng: lon
            },
            marker = new H.map.Marker(coords, {
                icon: icon
            });
        // Add the marker to the map and center the map at the location of the marker:
        map.addObject(marker);
        map.setCenter(coords); // centrar el mapa en una coordenada.

        circuloModificable(lat, lon, radioAlerta);

    } else if (vistaMapa == 3) {
        console.log(vistaMapa);
        $$('#geocodificamelo').on('click', function() {
            var busqueda = $$('#busquedaUbicacion').val();
            geocodificador(busqueda);
            console.log(busqueda);
        });
        coordsG = {
            lat: latPuntero,
            lng: lonPuntero
        };
        addDraggableMarker(map, behavior);
    }

}
/************************************* FIN DE MAPA DE HERE CON UI **********************************************/
/************************************TRACKEAR EL CLICK SOBRE EL MAPA********************************************/
////////////////////////////////////////////// No integrado
//setUpClickListener(map);
function setUpClickListener(map) {
    // Attach an event listener to map display
    // obtain the coordinates and display in an alert box.
    map.addEventListener('click', function(evt) {
        var coord = map.screenToGeo(evt.currentPointer.viewportX,
            evt.currentPointer.viewportY);


        console.log('Clicked at ' + Math.abs(coord.lat.toFixed(4)) +
            ((coord.lat > 0) ? 'N' : 'S') +
            ' ' + Math.abs(coord.lng.toFixed(4)) +
            ((coord.lng > 0) ? 'E' : 'W'));

        /*
        coordsG = {lat: coord.lat, lng: coord.lng};
        // Add the click event listener.
        addDraggableMarker(map, behavior);

        */
    });
}
/*******************************FIN DE TRACKEAR EL CLICK SOBRE EL MAPA*******************************************/
/**********************************FUNCION INFO BUBBLES CON TEXTO ***********************************************/
function bubblesTexto() {

    // Create an info bubble object at a specific geographic location:
    var bubble = new H.ui.InfoBubble({
        lng: lon,
        lat: lat
    }, {
        content: '<b>Casa!</b>'
    });

    // Add info bubble to the UI:
    ui.addBubble(bubble);


    function openBubble(position, text) {
        if (!bubble) {
            bubble = new H.ui.InfoBubble(
                position,
                // The FO property holds the province name.
                {
                    content: '<small>' + text + '</small>'
                });
            ui.addBubble(bubble);
        } else {
            bubble.setPosition(position);
            bubble.setContent('<small>' + text + '</small>');
            bubble.open();
        }
    }

}

/************************************FIN INFO BUBBLES CON TEXTO*************************************************/
/*****************************************GEOCODIFICACION*******************************************************/
function geocodificador(busqueda) {

    // GEOCODER ES UN SERVICIO DE REST
    // Utilizar API Key de REST

    // https://developer.here.com/api-explorer/rest/geocoder
    url = 'https://geocoder.ls.hereapi.com/6.2/geocode.json';
    app.request.json(url, {
        searchtext: busqueda,
        apiKey: 'Gz-JLm7EYGkMQZ2XuuU8feRF-CQYjqVUDFqtICVtQwU', // ocultar para produccion
        gen: '9'
    }, function(data) {
        // hacer algo con data
        console.log(data);

        // POSICION GEOCODIFICADA de la direccion
        latitud = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
        longitud = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
        //alert(latitud + " / " + longitud);

        if (vistaMapa = 1) {
            latPuntero = latitud;
            lonPuntero = longitud;
            console.log("Se guardo desde la geolocalozacion " + latPuntero + " " + lonPuntero);
            coordsG = {
                lat: latPuntero,
                lng: lonPuntero
            };
        } else {
            coordsG = {
                lat: latitud,
                lng: longitud
            };
        }

        // Add the click event listener.

        addDraggableMarker(map, behavior);

        //   markerG = new H.map.Marker(coordsG);
        //   map.addObject(markerG);
        //     alert(JSON.stringify(data));


    }, function(xhr, status) {
        console.log("error geocodificador: " + status);
    });

};
/****************************************FIN GEOCODIFICACION****************************************************/
/****************************************PUNTERO ARRASTRABLE****************************************************/
// https://developer.here.com/documentation/examples/maps-js/markers/draggable-marker
function addDraggableMarker(map, behavior) {

    // Como quiero un solo puntero elimino el anterior
    map.removeObjects(map.getObjects(marker));

    marker = new H.map.Marker(coordsG, {
        // mark the object as volatile for the smooth dragging
        volatility: true
    });
    // Ensure that the marker can receive drag events
    marker.draggable = true;
    map.addObject(marker);

    // disable the default draggability of the underlying map
    // and calculate the offset between mouse and target's position
    // when starting to drag a marker object:
    map.addEventListener('dragstart', function(ev) {
        var target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
            var targetPosition = map.geoToScreen(target.getGeometry());
            target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
            behavior.disable();
        }
    }, false);


    // re-enable the default draggability of the underlying map
    // when dragging has completed
    map.addEventListener('dragend', function(ev) {
        var target = ev.target;
        if (target instanceof H.map.Marker) {
            behavior.enable();
        }

        if (marker.draggable === true) {
            latPuntero = target.b.lat;
            lonPuntero = target.b.lng;
        } else {
            console.log("The drag event listener has no power in this domains");
        }

        console.log("DESDE EL PUNTERO DRAGGABLE: " + latPuntero + " " + lonPuntero);
        geodecodificador(latPuntero, lonPuntero);

    }, false);

    // Listen to the drag event and move the position of the marker
    // as necessary
    map.addEventListener('drag', function(ev) {
        var target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
            target.setGeometry(
                map.screenToGeo(pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y));
        }
    }, false);
};

/***************************************PUNTERO ARRASTRABLE**************************************************/
/**********************************FUNCION INFO BUBBLES EN GRUPOS********************************************/
//Esto lo paso Jorge para que podamos agrupar los marcadores

function infoBubbles() {
    var lat2 = "-32.9456869";
    var lon2 = "-60.6445324";
    var lat3 = "-32.9456448";
    var lon3 = "-60.6445155";


    function addInfoBubble(map) {
        var group = new H.map.Group();
        map.addObject(group);
        addMarkerToGroup(group, {
            lat: lat,
            lng: lon
        });
        addMarkerToGroup(group, {
            lat: lat2,
            lng: lon2
        });
        addMarkerToGroup(group, {
            lat: lat3,
            lng: lon3
        });
    }

    function addMarkerToGroup(group, coordinate, html) {
        var marker = new H.map.Marker(coordinate);
        group.addObject(marker);
    }


    addInfoBubble(map);
}

/****************************************FIN INFO BUBBLES EN GRUPOS*******************************************/
/******************************************FUNCION CIRCULO COMUN *********************************************/
function circuloComun() {
    // https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/geo-shapes.html
    // Agregar el "radio"
    // Instantiate a circle object (using the default style):
    var circle = new H.map.Circle({
        lat: lat,
        lng: lon
    }, 300);
    // Add the circle to the map:
    map.addObject(circle);
}
/********************************************FIN CIRCULO COMUN ***********************************************/
/********************************************GEO DECODIFICADOR ***********************************************/
function geodecodificador(latit, longit) {
    //Documentac: https://developer.here.com/documentation/geocoding-search-api/dev_guide/topics-api/code-revgeocode.html
    // Ejemplo: https://developer.here.com/documentation/examples/rest/geocoder/reverse-geocode
    console.log("MOSTRAR DEL GEODECODIFICADOR " + latit + " - " + longit);
    url = 'https://reverse.geocoder.ls.hereapi.com/6.2/reversegeocode.json';
    app.request.json(url, {
        prox: latit + ',' + longit + ",57",
        mode: 'retrieveAddresses',
        maxresults: '1',
        gen: '9',
        apiKey: 'Gz-JLm7EYGkMQZ2XuuU8feRF-CQYjqVUDFqtICVtQwU' // ocultar para produccion
    }, function(data) {
        // hacer algo con data
        console.log(data);

        console.log(data.Response.View[0].Result[0].Location.Address.Label);

        var ubicacionGeodecodificada = data.Response.View[0].Result[0].Location.Address.Label;
        $$('.nombreUbicacion').text(ubicacionGeodecodificada);
        $$('#busquedaUbicacion').val(ubicacionGeodecodificada);
    }, function(xhr, status) {
        console.log("error geodecodificador: " + status);
    });


}
/********************************************GEO DECODIFICADOR ***********************************************/
/****************************************FUNCION DRAGGABLE CIRCLE ********************************************/
// Aca https://developer.here.com/documentation/examples/maps-js/resizable-geoshapes/resizable-circle
function circuloModificable(latCirculo, lonCirculo, radioCirculo) {
    /**
     * Adds resizable geo shapes to map
     *
     * @param {H.Map} map                      A HERE Map instance within the application
     */
    function createResizableCircle(map) {
        circle = new H.map.Circle({
                    lat: latCirculo,
                    lng: lonCirculo
                },
                radioCirculo, {
                    style: {
                        fillColor: 'rgba(120,184,230, 0.7)',
                        lineWidth: 0
                    }
                }
            ),
            circleOutline = new H.map.Polyline(
                circle.getGeometry().getExterior(), {
                    style: {
                        lineWidth: 10,
                        strokeColor: 'rgba(42,82,190, 0)'
                    }
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
                    strokeColor: 'rgb(42,82,190)'
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
                    strokeColor: 'rgba(42,82,190, 0)'
                }),
                timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

            circleTimeout = setTimeout(function() {
                circleOutline.setStyle(newStyle);
            }, timeout);
            document.body.style.cursor = 'default';
        }, true);

        // event listener for circle group to change the cursor if mouse position is over the outline polyline 
        //(resizing is allowed)
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

                if (radioCirculo >= 100 && radioCirculo <= 800) {

                    circle.setRadius(distanceFromCenterInMeters);

                    radioCirculo = round5(parseInt(circle.getRadius(distanceFromCenterInMeters)));
                    console.log(radioCirculo);
                    mostrarRadio(radioCirculo);

                    // use circle's updated geometry for outline polyline
                    var outlineLinestring = circle.getGeometry().getExterior();
                    // extract first point of the outline LineString and push it to the end, so the outline has a closed geometry
                    outlineLinestring.pushPoint(outlineLinestring.extractPoint(0));
                    circleOutline.setGeometry(outlineLinestring);

                    // prevent event from bubling, so map doesn't receive this event and doesn't pan
                    evt.stopPropagation();
                } else if (radioCirculo > 100) {
                    circle.setRadius(100);
                }

            }
        }, true);

    }

    createResizableCircle(map);

    // Una funcion que redondea a multiplos de 5 para el radio
    function round5(x) {
        return (x % 5) >= 2.5 ? parseInt(x / 5) * 5 + 5 : parseInt(x / 5) * 5;
    }

}
/**************************************FIN DE CIRCULO DRAGGABLE**********************************************/
/*************************************MAPA DE JORGE *********************************************************/
function mapaDeJorge() {
    // Inicio del mapa
    var lati = lat;
    var longi = lon;
    // https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/get-started.html
    // Initialize the platform object:
    var platform = new H.service.Platform({
        'apikey': '0RTLydGJnLLp5DlfAFU0ctJ3CUbIiBHqs4K-qMAxFlY' // ocultar para produccion
    });
    // Obtain the default map types from the platform object
    var maptypes = platform.createDefaultLayers();
    // Instantiate (and display) a map object:
    map = new H.Map(
        document.getElementById('mapContainer'),
        maptypes.vector.normal.map, {
            zoom: 13,
            center: {
                lat: lati,
                lng: longi
            }
        });
    // https://developer.here.com/documentation/maps/3.1.14.0/dev_guide/topics/marker-objects.html
    var svgMarkup = '<svg width="24" height="24" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<rect stroke="white" fill="#1b468d" x="1" y="1" width="22" ' +
        'height="22" /><text x="12" y="18" font-size="12pt" ' +
        'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
        'fill="white">H</text></svg>';
    var icon = new H.map.Icon(svgMarkup),
        coords = {
            lat: lati,
            lng: longi
        },
        marker = new H.map.Marker(coords, {
            icon: icon
        });
    // Add the marker to the map and center the map at the location of the marker:
    map.addObject(marker);
    map.setCenter(coords); // centrar el mapa en una coordenada.
    lati2 = -32.958;
    longi2 = -60.689;
    coords2 = {
            lat: lati2,
            lng: longi2
        },
        marker2 = new H.map.Marker(coords2);
    map.addObject(marker2);
    if (latUsuario != 0 && lonUsuario != 0) {
        coordsUsu = {
                lat: latUsuario,
                lng: lonUsuario
            },
            markerUsu = new H.map.Marker(coordsUsu);
        map.addObject(markerUsu);
    }
    // GEOCODER ES UN SERVICIO DE REST
    url = 'https://geocoder.ls.hereapi.com/6.2/geocode.json';
    app.request.json(url, {
        searchtext: 'Cordoba 3201, rosario, santa fe',
        apiKey: 'Gz-JLm7EYGkMQZ2XuuU8feRF-CQYjqVUDFqtICVtQwU', // ocultar para produccion
        gen: '9'
    }, function(data) {
        // hacer algo con data
        console.log("geo:" + JSON.stringify(data));
        // POSICION GEOCODIFICADA de la direccion
        latitud = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
        longitud = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
        //alert(latitud + " / " + longitud);
        coordsG = {
                lat: latitud,
                lng: longitud
            },
            markerG = new H.map.Marker(coordsG);
        map.addObject(markerG);
        //     alert(JSON.stringify(data));
    }, function(xhr, status) {
        console.log("error mapaDeJorge: " + status);
    });
}
/********************************FIN DEL MAPA DE JORGE ************************************************/
/*********************************** AGREGAR UBICACION PERSONALIZADA ***************************************************/
function agregarUbicacionPersonalizada(latU, lonU, nombreU, radioU) {
    var data = {
        nombre: nombreU,
        latitud: latU,
        longitud: lonU,
        radio: radioU
    };
    console.log(data);
    refUbicaciones.add(data);
};
/******************************** FIN AGREGAR UBICACION PERSONALIZADA **************************************************/
/****************************** FUNCION QUE MUESTRA EL TOAST DEL RADIO SOBRE EL MAPA ***********************************/
function mostrarRadio(radio) {
    var f7icon = "dot_radiowaves_left_right";
    var material = "wifi_tethering";
    console.log("Desde el toast: radio " + radio);
    // Create toast with icon
    var toastIcon = app.toast.create({
        icon: app.theme === 'ios' ? '<i class="f7-icons">' + f7icon + '</i>' : '<i class="material-icons">' + material + '</i>',
        text: radio + ' mts',
        position: 'center',
        closeTimeout: 2000,
    });
    toastIcon.open();
}
/**************************** FIN FUNCION QUE MUESTRA EL TOAST DEL RADIO SOBRE EL MAPA *********************************/


/*********************************************************************************************************************/
/*********************************************************************************************************************/
/****************************************FUNCIONES DE LOGIN Y USUARIO*************************************************/
/*********************************************************************************************************************/
/*********************************************************************************************************************/
/********************************************* AVATARES ****************************************************************/
// cuando abro el popup de los avatares creo las filas y los avatares de manera dinámica
function cargarAvatares() {
    console.log("CARGAR AVATARES");
    vaciarAv();
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
    vaciarAv();
    app.popup.close();
    console.log("avatar seleccionado: " + avatar);
};
/******************************************** FIN AVATARES *************************************************************/
/************************************** GUARDAR DATOS PERSONALES *******************************************************/
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
    login = 1;
    mainView.router.navigate('/chats/');
}
/************************************* FIN GUARDAR DATOS PERSONALES ****************************************************/
/******************************* INICIALIZADOR DE DATOS EN LA BASE DE DATOS ********************************************/
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
    refUsuarios.doc(email).set(data);
};
/******************************* FIN INICIALIZADOR DE DATOS EN LA BASE DE DATOS ****************************************/
/************************* HACER LA QUERY A LA BD Y CARGAR TODA LA INFO DE USUARIO AL PANEL ****************************/
function cargarDatosUsuario() {
    // REF: https://firebase.google.com/docs/firestore/query-data/get-data
    // TITULO: Obtén un documento
    refUsuarios.doc(email).get().then(function(doc) {
        if (doc.exists) {
            //console.log("Document data:", doc.data());
            //console.log("Tipo de Usuario: " + doc.data().tipo );
            var user = doc.data().usuario;
            var nombreUsuario = doc.data().nombre;
            var telUsuario = doc.data().telefono;
            $$('.nombreMenu').text("@" + user);
            $$('.menuAvatar').attr("src", doc.data().avatar);
            $$('.nickUsuario').val(user);
            $$('.nombreUsuario').val(nombreUsuario);
            $$('.telUsuario').val(telUsuario);
            var radioAlerta = doc.data().radioActual;
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
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
};
/*************************FIN DE HACER LA QUERY A LA BD Y CARGAR TODA LA INFO DE USUARIO AL PANEL***********************/
/********************************************ACTUALIZAR LA INFO DE USUARIO *********************************************/
function actualizarPerfil(clave) {
    refUsuarios.doc(email).get().then(function(doc) {
        if (doc.exists) {
            var nickModificado = $$('.nickUsuario').val();
            var nombreModificado = $$('.nombreUsuario').val();
            var telModificado = $$('.telUsuario').val();
            if (clave == "perfil") {
                if ($$('.avatarPerfil').hasClass('elegido')) {
                    var avatarLimpio = sinRuta[sinRuta.length - 1];
                    console.log("avatar limpio: " + avatarLimpio);
                    // clave: variable de datos
                    var data = {
                        nombre: nombreModificado,
                        telefono: telModificado,
                        usuario: nickModificado,
                        avatar: "img/min/" + avatarLimpio,
                    }
                } else {
                    var data = {
                        nombre: nombreModificado,
                        telefono: telModificado,
                        usuario: nickModificado,
                    }
                }
            } else if (clave = "radio") {
                var data = {
                    radioActual: radioAlerta,
                    latitud: lat,
                    longitud: lon,
                }
            };
            refUsuarios.doc(email).update(data)
                .then(function() {
                    console.log("actualizado ok");
                    cargarDatosUsuario();
                })
                .catch(function(error) {
                    console.log("Error: " + error);
                });
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}
/*************************************** FIN ACTUALIZAR LA INFO DE USUARIO *********************************************/
/**************************************** AUTO LOGIN CON SESSION STORAGE ***********************************************/
function consultarLocalStorage() {
    if (localStorage.getItem("us") === null) {
        /*no hago nada*/ } else {
        var usuarioGuardado = storage.getItem("us");
        usuarioGuardado = JSON.parse(usuarioGuardado);
        // convertimos el string en JSON

        if (usuarioGuardado.email == "") {
            console.log("no hay datos en el local");
        } else {
            console.log(" usuarioguardado.email: " + usuarioGuardado.email);
            console.log(" usuarioguardado.clave: " + usuarioGuardado.clave);
            //pasar los datos del json a dos variables independientes
            email = usuarioGuardado.email;
            password = usuarioGuardado.clave;
            console.log("usuariolocal + clavelocal: " + email + password)
            //si la variable tiene datos llamamos a una funcion de login pasandole las variables como parametros

            if (usuarioGuardado != null) {
                LoguearseConLocal(email, password);
                // Tambien voy a cargar la info basica del usuario en variables locales
            };
        };
    };
};

function LoguearseConLocal(u, c) {
    console.log("loguearseconlocal, u+c" + u + c)

    //Se declara la variable huboError (bandera)
    var huboError = 0;
    firebase.auth().signInWithEmailAndPassword(u, c)
        .catch(function(error) {
            //Si hubo algun error, ponemos un valor referenciable en la variable huboError
            huboError = 1;
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error(errorMessage);
            console.log(errorCode);


        })
        .then(function() {
            //En caso de que esté correcto el inicio de sesión y no haya errores, se dirige a la siguiente página
            if (huboError == 0) {
                console.log("te logueaste");
                cargarDatosUsuario();
                mainView.router.navigate('/chats/');

            }
        });

};

function cargarInfoUsuario(email) {
    refUsuarios.doc(email).get().then(function(doc) {
            usuario = doc.data().usuario;
            sinRuta = doc.data().avatar;
            tipoUsuario = doc.data().tipo;
        })
        .catch(function(error) {
            console.log("Error en la consulta: ", error);
        });

}

/**************************************** FIN AUTO LOGIN CON SESSION STORAGE *******************************************/
/****************************************** LOGIN CON EMAIL AUTENTICADO ************************************************/
function loginConEmail() {
    email = $$('#emailLogin').val();
    password = $$('#passwordLogin').val();
    //Se declara la variable huboError (bandera)
    var huboError = 0;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
        //Si hubo algun error, ponemos un valor referenciable en la variable huboError
        huboError = 1;
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error(errorMessage);
        console.log(errorCode);
    }).then(function() {
        //En caso de que esté correcto el inicio de sesión y no haya errores, se dirige a la siguiente página
        if (huboError == 0) {
            if ($$("#recuerdame").is(":checked")) {
                us = {
                    email: email,
                    clave: password
                };
                //storage.setItem("persona", persona); -> guardará [object Object]
                var usuarioAGuardar = JSON.stringify(us);
                // por eso convertimos el JSON en un string

                storage.setItem("us", usuarioAGuardar);
                console.log("usuarioAGuardar: " + usuarioAGuardar);
                console.log("usuario: " + us.email + "password: " + us.clave);
            }
            login = 1;
            mainView.router.navigate('/chats/');
        }
    });
}
/*********************************** FIN LOGIN CON EMAIL AUTENTICADO ***************************************************/
/********************************************* CREAR USUARIO ***********************************************************/
// toma los valores de email y contraseña y crea la conexión con firebase para almacenarla
function crearUsuario() {
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode == 'auth/weak-password') {
            alert('Clave muy débil.');
        } else {
            alert(errorMessage);
        }
        console.log(errorMessage);
    }).then(function() {

        if ($$("#recuerdame").is(":checked")) {
            us = {
                email: email,
                clave: password
            };
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
/******************************************* FIN CREAR USUARIO *********************************************************/
/********************************************* CERRAR SESION ***********************************************************/
function cerrarSesion() {
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
    login = 0;
    email = "";
    contraseña = "";
    app.panel.close();
    console.log("cerrar sesion");
}
/********************************************* FIN CERRAR SESION *******************************************************/
/********************************************** PANEL IZQUIERDO ********************************************************/
function panelIzq() {
    $$('.cerrarSesion').on('click', cerrarSesion);
    $$('.miPerfil,.nombreMenu,.menuAvatar').on('click', function() {
        mainView.router.navigate('/p-us/');
        app.panel.close();
    });
    $$('.panelUbicacion').on('click', function() {
        mainView.router.navigate('/chats/');
        // el app.accordion.open no funciona
        app.accordion.open('<li class="accordion-item celeste swipeout" id="abrirUbicaciones">');
        app.panel.close();
    });
    $$('.panelGrupos').on('click', function() {
        mainView.router.navigate('/chats/');
        app.panel.close();
    });
    $$('.panelFavoritos').on('click', function() {
        mainView.router.navigate('/chats/');
        app.panel.close();
    });
    $$('.panelBloqueos').on('click', function() {
        app.panel.close();
    });
    $$('.panelVincular').on('click', function() {
        app.panel.close();
    });
    $$('.panelConfiguracion').on('click', function() {
        app.panel.close();
    });
    $$('.panelAyuda').on('click', function() {
        mainView.router.navigate('/chats/');
        app.panel.close();
    });
}
/******************************************* FIN DEL PANEL IZQUIERDO ***************************************************/
/*********************************************** CARGAR LOS CHATS ******************************************************/
function cargarChats() {
    geodecodificador(lat, lon);
    refUbicaciones = refUsuarios.doc(email).collection('UBICACIONES');
    var hayUbicaciones = 0;
    refUbicaciones.get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                if (doc.id !== "GLOBAL") {
                    console.log("data: " + doc.data().nombre);
                    var idUbicacion = doc.id;
                    $$('#ubicacionesFirestore')
                        .append('<li class="swipeout ubicacionPersonalizada" id="' + idUbicacion + '"><div class="swipeout-content nombrePersonalizada">' +
                            doc.data().nombre +
                            '</div><h6 class="nuevoChatPersonalizado">+999</h6>' +
                            '<div class="swipeout-actions-right"><a href="#" class="open-more-actions configuracion"><img src="img/config.png"' +
                            ' class="config"></a><a href="#" data-confirm="¿Está seguro que quiere eliminar este chat?" class="swipeout-delete">Borrar</a></div></li>');
                    hayUbicaciones++;
                    quitarAlerta();
                }
            });
        })
        .catch(function(error) {
            console.log("Error en la consulta: ", error);
        });

    function quitarAlerta() {
        if (hayUbicaciones !== 0) {
            $$('.defaultUbicaciones').addClass('oculto');

        } else {
            if ($$('.defaultUbicaciones').hasClass('oculto')) {
                console.log("Clase oculto ya agregada");
            } else {
                console.log("NO HAY REGISTROS");
                $$('.defaultUbicaciones').removeClass('oculto');
            }
        };
    };
    quitarAlerta();
};
/**************************************** FIN CARGAR LOS CHATS *********************************************************/
/******************************************* FIREBASE STORAGE **********************************************************/
function getImage() { // FOTO DESDE CAMARA
    navigator.camera.getPicture(onSuccess, onError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA
    });
}


function selImage() { // SELECCIONA DESDE GALERIA
    navigator.camera.getPicture(onSuccess, onError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY
    });
}


function onError() {
    console.log("error camara");
}


function onSuccess(imageData) {
    var storageRef = firebase.storage().ref();
    var getFileBlob = function(url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.addEventListener('load', function() {
            cb(xhr.response);
        });
        xhr.send();
    };

    var blobToFile = function(blob, name) {
        blob.lastModifiedDate = new Date();
        blob.name = name;
        return blob;
    };

    var getFileObject = function(filePathOrUrl, cb) {
        getFileBlob(filePathOrUrl, function(blob) {
            cb(blobToFile(blob, 'test.jpg'));
        });
    };

    getFileObject(imageData, function(fileObject) {
        var uploadTask = storageRef.child('images/test.jpg').put(fileObject);

        uploadTask.on('state_changed', function(snapshot) {
            console.log(snapshot);
        }, function(error) {
            console.log(error);
        }, function() {
            var downloadURL = uploadTask.snapshot.downloadURL;
            console.log(downloadURL);
            // handle image here
        });
    });

}