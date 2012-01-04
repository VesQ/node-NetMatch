/**
 * @fileOverview Sisältää hyödyllisiä funktioita, eli {@link Utils}-nimiavaruuden toteutuksen.
 */
var argv = require('optimist')
  .default({d: false}).alias({'d' : 'debug'}).argv
  , colors = require('colors')
  , Logger = require('cbNetwork').Logger;

/**
 * @namespace Sisältää hyödyllisiä funktioita.
 */
var Utils = {
  /**
   * Yleinen funktio lokiin/konsoliin (stdout) kirjoittamista varteen. Tämä on instanssi cbNetwork-noden
   * <a href="http://vesq.github.com/cbNetwork-node/doc/symbols/Logger.html">Logger</a>-luokasta.
   * Voit käyttää tätä näin:
   * @example
   * var log = Utils.log;
   *
   * log.write('Perusviesti, tämä on ilman värejä.');
   * log.info('Jotain tiedotettavaa tapahtui. Tulostuu vihreänä.');
   * log.warn('Varoitus! Tulostuu keltaisena.');
   * log.notice('Ilmoitus! Tulostuu keltaisena.');
   * log.error('VIRHE! Tulostuu punaisena ja lihavoituna.');
   * log.fatal('KRIITTINEN VIRHE! Tulostuu punaisena ja lihavoituna.');
   */
  log: new Logger('[NetMatch %t] '.grey, (argv.d > 1) ? true : false),

  /**
   * Palauttaa nykyisen palvelimen ajan millisekunteina, toimii kuten CoolBasicin Timer().
   */
  timer: function () {
    return Date.now();
  },

  /**
   * Palauttaa satunnaisen luvun väliltä minVal...maxVal tarkkuudella floatVal
   * @param {Number} minVal      Pienin mahdollinen luku
   * @param {Number} maxVal      Suurin mahdollinen luku
   * @param {Number} [floatVal]  Palautettavan satunnaisen luvun tarkkuus. Mikäli tätä ei anneta,
   *                             palautetaan kokonaisluku.
   */
  rand: function (minVal, maxVal, floatVal) {
    var randVal = minVal + (Math.random() * (maxVal - minVal));
    return typeof floatVal === 'undefined' ? Math.round(randVal) : randVal.toFixed(floatVal);
  },

  /**
   * Pitää kulman välillä 0-360
   * @param {Number} angle  Kulma
   * @returns {Number}
   */
  wrapAngle: function (a) {
    a = a / 360;
    return (a - Math.floor(a)) * 360;
  },

  /**
   * Palauttaa kahden pisteen välisen etäisyyden
   * @param {Number} x1  Ensimmäisen pisteen x-koordinaatti
   * @param {Number} y1  Ensimmäisen pisteen y-koordinaatti
   * @param {Number} x2  Toisen pisteen x-koordinaatti
   * @param {Number} y2  Toisen pisteen y-koordinaatti
   * @returns {Number}   Pisteiden välinen etäisyys
   */
  distance: function (x1, y1, x2, y2) {
    var dx = x1 - x2; // Vaakasuuntainen etäisyys
    var dy = y1 - y2; // Pystysuuntainen etäisyys
    return Math.sqrt( dx*dx + dy*dy );
  },
  
  /** 
   * Palauttaa taulukon, jossa on merkkijono paloiteltuna sanoiksi, ottaa huomioon "merkki jonot"
   * @param {String} str  Merkkijono, joka paloitellaan
   * @returns {Array}  Paloiteltu jono
   */
  splitString: function (str) {
    var reg = /\ (?!\w+")/;
    return str.split(reg);
  }
};

exports = module.exports = Utils;
