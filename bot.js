const http = require('http');
const fs = require('fs');

console.log("--- 1. INICIANDO PROCESO (DEBUG) ---");

// 1. Verificación de carga de Discord.js
let Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder;
try {
    const discord = require('discord.js');
    Client = discord.Client;
    GatewayIntentBits = discord.GatewayIntentBits;
    ActionRowBuilder = discord.ActionRowBuilder;
    ButtonBuilder = discord.ButtonBuilder;
    ButtonStyle = discord.ButtonStyle;
    EmbedBuilder = discord.EmbedBuilder;
    console.log("--- 2. LIBRERÍA DISCORD.JS CARGADA CORRECTAMENTE ---");
} catch (e) {
    console.error("--- ❌ ERROR AL CARGAR DISCORD.JS (Verifica package.json): ---", e);
}

// Servidor para Render
http.createServer((req, res) => { res.end('Bot activo'); }).listen(3000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let jugadores = new Set();

function registrar(usuario, accion) {
    const fecha = new Date().toLocaleString();
    const linea = `${fecha} - Usuario: ${usuario} | Acción: ${accion}\n`;
    fs.appendFileSync('historial.txt', linea);
}

const crearPanel = () => {
    const lista = jugadores.size > 0 
        ? [...jugadores].map(j => `🟢 **${j}**`).join("\n") 
        : "❌ No hay nadie en la ciudad.";
    
    const embed = new EmbedBuilder()
        .setTitle("🏢 PANEL DE DISPONIBILIDAD")
        .setDescription(`### Miembros conectados (${jugadores.size})\n${lista}`)
        .setColor(0x2F3136)
        .setTimestamp();

    const botones = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("entrar").setLabel("Entrar").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("salir").setLabel("Salir").setStyle(ButtonStyle.Danger)
        );

    return { embeds: [embed], components: [botones] };
};

client.on('ready', () => {
  console.log(`--- 3. CONECTADO COMO: ${client.user.tag} ---`);
});

client.on('messageCreate', async message => {
    if (message.content === '!panel') {
        await message.channel.send(crearPanel());
        await message.delete().catch(() => {});
    }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  const nombre = interaction.member.displayName;
  if (interaction.customId === "entrar") {
    jugadores.add(nombre);
    registrar(nombre, "ENTRÓ A CIUDAD");
  } else if (interaction.customId === "salir") {
    jugadores.delete(nombre);
    registrar(nombre, "SALIÓ DE CIUDAD");
  }
  await interaction.update(crearPanel());
});

// Login final
const TOKEN = process.env.TOKEN;
if (!TOKEN) {
    console.error("--- ❌ ERROR: NO SE ENCUENTRA LA VARIABLE 'TOKEN' EN RENDER ---");
} else {
    console.log("--- 4. INTENTANDO CONEXIÓN A DISCORD ---");
    client.login(TOKEN).catch(err => {
        console.error("--- ❌ ERROR CRÍTICO AL CONECTAR CON TOKEN: ---", err);
    });
}
