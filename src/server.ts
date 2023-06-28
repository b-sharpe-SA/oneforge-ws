// TS or ES6
import ForgeClient from 'forex-quotes';
import { WebSocketServer } from 'isomorphic-ws';

var globalClients = new Map<string, any>;
var forgeClient = new ForgeClient('_your_key_here_');


function storeClient(currencyPairKey: any, websocketClient: any) {
    // Store a websocket client in the global array of clients
    if(currencyPairKey in globalClients) {
        globalClients.get(currencyPairKey).push(websocketClient)
        console.log("client pushed")
    }
    else {
        globalClients.set(currencyPairKey, [websocketClient])
    }
}

async function notifyClients(currencyPairKey: any, quote: any) {
    let clientsArray = globalClients.get(currencyPairKey)
    if(clientsArray) {
        for(let i=0; i<clientsArray.length; i++)
        {
            console.log("sending data to client")
            clientsArray[i].send(quote)
        }
    }
}

async function initForgeClient() {

    // Handle incoming price updates from the server
    forgeClient.onUpdate((symbol, data) => {
        console.log(symbol, data);
        notifyClients(symbol, data.p)
    });

    // Handle non-price update messages
    forgeClient.onMessage((message) => {
        console.log(message);
    });

    // Handle disconnection from the server
    forgeClient.onDisconnect(() => {
        console.log("Disconnected from server");
    });

    await forgeClient.connect();
}

initForgeClient()
forgeClient.onConnect(() => {
    console.log("forge connected")
})

const wss = new WebSocketServer({port : 8080});
wss.on('connection', function connection(ws)  {
    ws.on('error', console.error);
    console.log("connection opened")
    ws.on("message", function message(data) {
        let currencyPairKey = data.toString()
        console.log(currencyPairKey)
        storeClient(currencyPairKey, ws)
        forgeClient.subscribeTo(currencyPairKey)
    });
});
console.log("WebSocketServer initialised")

