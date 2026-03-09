const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');
const fs = require('fs');

console.log("--- 1. INICIANDO PROCESO (DEBUG) ---");

// Servidor para mantener el bot despierto en Render
http.createServer((req, res) => { res.end('Bot activo'); }).listen(3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ]
});

let jugadores = new Set();

function registrar(usuario, accion) {
    const fecha = new Date().toLocaleString();
    const linea = `${fecha} - Usuario: ${usuario} | Acción: ${accion}\n`;
    // Crea el archivo si no existe al intentar añadir la línea
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
    // Comando para mostrar el panel
    if (message.content === '!panel') {
        console.log("--- 📜 COMANDO !PANEL EJECUTADO ---");
        await message.channel.send(crearPanel());
        await message.delete().catch(() => {});
    }

    // Comando para ver logs (con aviso de error si no hay archivo)
    if (message.content === '!verlogs') {
        console.log("--- 📜 COMANDO !VERLOGS EJECUTADO ---");
        try {
            if (!fs.existsSync('historial.txt')) {
                await message.reply("Aún no hay registros.");
                return;
            }
            const logs = fs.readFileSync('historial.txt', 'utf8');
            // Enviar por privado (MD)
            await message.author.send("📜 **Historial de la banda:**\n```" + logs.slice(-1500) + "```");
            await message.delete().catch(() => {});
        } catch (err) { 
            console.error("--- ❌ ERROR AL ENVIAR LOGS ---", err);
            await message.reply("No pude enviarte el mensaje privado (revisa tu configuración de privacidad).");
        }
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

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
    console.error("--- ❌ ERROR CRÍTICO: NO SE ENCUENTRA LA VARIABLE 'TOKEN' EN RENDER ---");
} else {
    console.log("--- 4. INTENTANDO CONEXIÓN A DISCORD ---");
    client.login(TOKEN).catch(err => {
        console.error("--- ❌ ERROR CRÍTICO AL CONECTAR: ---", err);
    });
}
