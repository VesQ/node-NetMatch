/**
 * @fileOverview Viestien säilytykseen liittyvät toiminnot
 */

/**#nocode+*/
var NET = require('./Constants').NET
  , WPN = require('./Constants').WPN
  , log = require('./Utils').log
  , colors = require('colors');
/**#nocode-*/

/**
 * Alustaa uuden viestisäilön.
 * @class Viestien säilytys
 *
 * @param {Server} server  Tämän viestisäilön {@link Server}-instanssi
 */
function NetMessages(server) {
  this.server = server;
  /**
   * Sisältää clienteille lähetettävät viestit
   * @private
   */
  this.data = {};
}

/**
 * Luo uuden clientille lähetettävän viestin.
 *
 * @param {Byte}    toPlayer          Pelaajan ID kelle viesti lähetetään.
 * @param {Object}  data              Pelaajalle lähetettävä data
 * @param {Byte}    data.msgType      Viestityyppi, kts. {@link NET}
 * @param {String}  data.msgText      Viestin teksti
 * @param {Byte}    data.playerId     Kuka viestin lähetti
 * @param {Short}   data.bulletId     Ammuksen tunnus
 * @param {Byte}    data.itemId       Tavaran tunnus
 * @param {Byte}    data.itemType     Tavaran tyyppi
 * @param {Byte}    data.weapon       Ase
 * @param {Short}   data.x            Sijaintitietoa
 * @param {Short}   data.y            Sijaintitietoa
 * @param {Byte}    data.playerId2    Pelaajatunnus (kehen tapahtuma kohdistui)
 * @param {Boolean} data.sndPlay      Soitetaanko ääni
 * @param {Boolean} data.handShooted  Kumpi käsi ampui (pistooli) 0 = vasen, 1 = oikea
 */
NetMessages.prototype.add = function (toPlayer, data) {
  if ('undefined' === typeof this.data[toPlayer]) {
    this.data[toPlayer] = [];
  }
  this.data[toPlayer].push(data);
};

/**
 * Lähettää kaikille clienteille viestin.
 * @see NetMessages#add
 *
 * @param {Object} data      Pelaajalle lähetettävä data
 * @param {Byte} [butNotTo]  Pelaajan ID, kelle EI lähetetä tätä pakettia.
 */
NetMessages.prototype.addToAll = function (data, butNotTo) {
  var playerIds = Object.keys(this.server.players)
    , plr
    , iterator = playerIds.length;

  if ('number' !== typeof butNotTo) {
    butNotTo = 0;
  }

  while (iterator--) {
    plr = this.server.players[playerIds[iterator]];
    if (plr.active && !plr.zombie && (plr.playerId !== butNotTo)) {
      this.add(plr.playerId, data);
    }
  }
};

/**
 * Lähettää kaikille annetun joukkueen jäsenille.
 * @see NetMessages#add
 *
 * @param {Byte} team    Joukkue jonka jäsenille lähetetään viesti
 * @param {Object} data  Pelaajalle lähetettävä data
 */
NetMessages.prototype.addToTeam = function (team, data) {
  var playerIds = Object.keys(this.server.players)
    , plr
    , iterator = playerIds.length;

  while (iterator--) {
    plr = this.server.players[playerIds[iterator]];
    if (plr.active && !plr.zombie && (plr.team === team)) {
      this.add(plr.playerId, data);
    }
  }
};

/**
 * Lisää data-pakettiin yksittäiselle pelaajalle kuuluvat viestit oikein jäsenneltynä.
 * Kts. cbNetwork-node toteutus luokasta <a href="http://vesq.github.com/cbNetwork-node/doc/symbols/Packet.html">Packet</a>.
 *
 * @param {Byte} toPlayer  Kenen viestit haetaan
 * @param {Packet} data    Mihin pakettiin tiedot lisätään
 */
NetMessages.prototype.fetch = function (toPlayer, data) {
  var d, b;

  if ('undefined' === typeof this.data[toPlayer] || this.data[toPlayer].length === 0) {
    return false;
  }
  // Tämän viestin data laitetaan d-muuttujaan, jotta tarvitsisi kirjoittaa vähemmän.
  d = this.data[toPlayer][0];
  while (d) {
    if (!d.hasOwnProperty('msgType')) {
      log.error('Virheellistä dataa NetMessages-objektissa!');
      console.dir(d);
      continue;
    }

    // Lisätään dataa riippuen siitä minkälaista dataa pitää lähettää.
    switch (d.msgType) {
      case NET.LOGIN:
        // Joku on liittynyt peliin
        data.putByte(d.msgType);
        data.putByte(d.playerId);   // Kuka liittyi
        data.putString(d.msgText);  // Liittymisteksti
        data.putByte(d.playerId2);  // Kenen tilalle pelaaja tuli
        break;

      case NET.LOGOUT:
        // Joku on poistunut pelistä
        data.putByte(d.msgType);
        data.putByte(d.playerId);
        break;

      case NET.NEWBULLET:
        // Uusi ammus on ammuttu
        if (d.weapon === WPN.CHAINSAW) {
          // Moottorisahalla "ammutaan"
          data.putByte(d.msgType);
          data.putShort(d.bulletId);  // Ammuksen tunnus
          data.putByte(d.playerId);   // Kuka ampui

          // Tungetaan samaan tavuun useampi muuttuja:
          b = ((d.weapon % 16) << 0)
            + (d.sndPlay << 4);
          data.putByte(b);

          // Ammuksen sijainti
          data.putShort(d.x);
          data.putShort(d.y);
          data.putShort(0);  // Ammuksen kulma, mutta koska moottirisahalla ei ole kulmaa, on tämä 0
        } else {
          // Jokin muu kuin moottorisaha
          var bullet = this.server.bullets[d.bulletId];
          if ('undefined' !== typeof bullet) {
            data.putByte(d.msgType);
            data.putShort(d.bulletId);
            data.putByte(d.playerId);

            // Tungetaan samaan tavuun useampi muuttuja:
            b = ((d.weapon % 16) << 0)  // Millä aseella (mod 16 ettei vie yli 4 bittiä)
              + (d.sndPlay << 4)        // Soitetaanko ääni
              + (d.handShooted << 5);   // Kummalla kädellä ammuttiin
            data.putByte(b);

            // Ammuksen sijainti
            data.putShort(bullet.x);
            data.putShort(bullet.y);
            data.putShort(bullet.angle);
          }
        }
        break;

      case NET.TEXTMESSAGE:
        // Tsättiviesti
        data.putByte(d.msgType);
        data.putByte(d.playerId);
        data.putString(d.msgText);
        break;

      case NET.SERVERMSG:
        // Palvelimen generoima viesti
        data.putByte(d.msgType);
        data.putString(d.msgText);
        break;

      case NET.BULLETHIT:
        // Osumaviesti
        data.putByte(d.msgType);
        data.putShort(d.bulletId);  // Ammuksen tunnus
        data.putByte(d.playerId);   // Keneen osui
        data.putShort(d.x);         // Missä osui
        data.putShort(d.y);         // Missä osui
        data.putByte(d.weapon);     // Mistä aseesta ammus on
        break;

      case NET.ITEM:
        // Tavaraviesti
        data.putByte(d.msgType);
        data.putByte(d.itemId);     // Tavaran tunnus
        data.putByte(d.itemType);   // Tavaran tyyppi
        data.putShort(d.x);         // Missä tavara on
        data.putShort(d.y);         // Missä tavara on
        break;

      case NET.KILLMESSAGE:
        // Tappoviesti! Buahahahaaaa
        data.putByte(d.msgType);
        data.putByte(d.playerId);   // Tappaja
        data.putByte(d.playerId2);  // Tapettu
        data.putByte(d.weapon);     // Ase
        // UNIMPLEMENTED
        data.putShort(0);           // Tappajan tapot
        data.putShort(0);           // Tappajan kuolemat
        data.putShort(0);           // Uhrin tapot
        data.putShort(0);           // Uhrin kuolemat
        break;

      case NET.KICKED:
        // Pelaaja potkittiin
        data.putByte(d.msgType);
        data.putByte(d.playerId);   // Kuka potkaisi
        data.putByte(d.playerId2);  // Kenet potkittiin
        data.putString(d.msgText);  // Potkujen syy
        break;

      case NET.TEAMINFO:
        // Lähetetään pelaajan joukkue
        data.putByte(d.msgType);
        data.putByte(d.playerId);   // Pelaaja
        // UNIMPLEMENTED
        data.putByte(1);            // Pelaajan joukkue
        break;

      case NET.SPEEDHACK:
        // Tämä client on haxor!
        data.putByte(d.msgType);
        // UNIMPLEMENTED
        // Login( False, gCurrentPlayerId )
        break;

      default:
        log.error('VIRHE: Pelaajalle <'+toPlayer+'> oli osoitettu tuntematon paketti:');
        console.dir(d);
    }

    // Poistetaan viesti muistista
    this.data[toPlayer].splice(0, 1);

    // Siirrytään seuraavaan viestiin
    d = this.data[toPlayer][0];
  }
};


module.exports = NetMessages;
