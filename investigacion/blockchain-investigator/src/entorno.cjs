'use strict';
// ENTORNO REAL del agente: construye, para un expediente, todos los adaptadores de solo lectura con su transporte (lista cerrada de servidores), el registrador y las herramientas.
const path = require('node:path');
const { crearTransporte, crearHttpJson } = require('./transporte.cjs');
const { leerClaves } = require('./claves.cjs');
const { crearRpc } = require('./rpc.cjs');
const { crearTokens } = require('./tokens.cjs');
const { crearFondos } = require('./fondos.cjs');
const { crearLectorDocumentos } = require('./documentos.cjs');
const { crearRegistrador } = require('./registrador.cjs');
const { crearHerramientas } = require('./herramientas.cjs');
const { crearClienteChainscope } = require('../../objective-engine/onchain.cjs');

function crearFabricaEntorno({ cliente, puertoChainscope = 5720, fichaChainscope = path.join(__dirname, '..', '..', 'chainscope', 'data', 'servicio.token'), stateDir = undefined, claves = leerClaves(), ahora = () => new Date() } = {}) {
  const transporte = crearTransporte({ ahora }), http = crearHttpJson(transporte, { tronGridKey: claves.tronGridKey }), rpc = crearRpc({ http, ahora }), tokens = crearTokens({ rpc });
  const fondos = crearFondos({ transporte, claves, ...(stateDir !== undefined ? { stateDir } : {}), ahora }), lector = crearLectorDocumentos({ ahora });
  const chainscope = crearClienteChainscope({ ficheroFicha: fichaChainscope, puerto: puertoChainscope });
  const crearEntorno = async ({ expId, config }) => {
    const reg = crearRegistrador({ cliente, expId }), herr = crearHerramientas({ rpc, tokens, http, claves, fondos, lector, chainscope, reg, config });
    return { reg, herr, transporte, rpc, tokens };
  };
  return { crearEntorno, transporte, fondos, cerrar: () => fondos.close() };
}
module.exports = { crearFabricaEntorno };
