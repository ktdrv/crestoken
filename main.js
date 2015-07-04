function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function set_cookie(cname, cvalue, expires) {
    document.cookie = cname + '=' + cvalue + '; expires=' + expires.toUTCString();
} 

function get_cookie(cname) {
    var name = cname + '=';
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return null;
}

function delete_cookie(cname) {
  set_cookie(cname, '', moment().subtract(1, 'day').toDate());
} 

function get_hash_params() {
  var hash = top.location.hash.replace('#', '');
  if (hash.length == 0) {
    return {};
  }
  var params = hash.split('&');
  var result = {};
  for(var i = 0; i < params.length; i++){
     var propval = params[i].split('=');
     result[propval[0]] = propval[1];
  }
  return result;
}

var redirect_url = 'http://ktdrv.github.io/crestoken';
var default_client_id = '96a55d0beb45456c852b8c645645fd48'; // OAuth client id
var client_id = '';
var scope = 'publicData';
var api_url = 'https://crest-tq.eveonline.com';

function sso_login() {

  delete_cookie('client_id');
  set_cookie('client_id', client_id, moment().add(1, 'week').toDate());
  var state = guid();
  set_cookie('state', state, moment().add(1, 'minute').toDate());

  sso_url = 'https://login.eveonline.com/oauth/authorize/?' +
    'response_type=token' + '&' +
    'redirect_uri=' + encodeURIComponent(redirect_url) + '&' +
    'client_id=' + client_id + '&' +
    'scope=' + scope +'&' +
    'state=' + state;

  window.location = sso_url;
}

function new_auth() {
  delete_cookie('auth_token');
  delete_cookie('auth_expires');
  location.reload();
}

$(function() {

    var auth_token;
    var expiration;

    hash_params = get_hash_params();

    if (hash_params.hasOwnProperty('access_token') && 
    hash_params.hasOwnProperty('token_type') && 
    hash_params.hasOwnProperty('expires_in') &&
    (hash_params.hasOwnProperty('state') && hash_params['state'] == get_cookie('state'))) {

      auth_token = hash_params['access_token'];
      expiration = moment().add(+hash_params['expires_in'], 'seconds');

      delete_cookie('state');
      delete_cookie('auth_token');
      set_cookie('auth_token', auth_token, expiration.toDate());
      delete_cookie('auth_expires');
      set_cookie('auth_expires', expiration.format(), expiration.toDate());

      location.hash = '';

    } else {

      auth_token = get_cookie('auth_token');
      expiration = moment(get_cookie('auth_expires'));

    }

    if (auth_token && expiration) {

      $('#auth-token').attr('value', auth_token);
      $('#auth-token').focus(function() {$(this).select();} );
      $('#auth-expires').text('Expires ' + expiration.fromNow());

      $('#no-auth').addClass('hidden');
      $('#yes-auth').toggleClass('hidden');

      setInterval(function() {
        var expiration = moment(get_cookie('auth_expires'));
        if (expiration.isAfter()) {
          $('#auth-expires').text('Expires ' + expiration.fromNow());
        } else {
          $('#auth-token').prop('disabled', true);
          $('#auth-expires').text('Expired');
        }
      }, 10000);

    } else {

      client_id = get_cookie('client_id');
      if (!client_id) {
        client_id = default_client_id;
      }
      $('#client-id').attr('placeholder', client_id);
      
      $('#login-button').click(sso_login);

    }

    $('#new-auth').click(new_auth);


});