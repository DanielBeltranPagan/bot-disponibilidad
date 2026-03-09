const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');
const fs = require('fs');

console.log("--- 1. INICIANDO EL PROCESO ---");

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
  console.log(`--- 2. CONECTADO COMO: ${client.user.tag} ---`);
});

client.on('messageCreate', async message => {
    if (message.content === '!panel') {
        console.log("--- 3. PANEL SOLICITADO ---");
        await message.channel.send(crearPanel());
        await message.delete().catch(() => {});
    }
    if (message.content === '!verlogs') {
        try {
            const logs = fs.readFileSync('historial.txt', 'utf8');
            await message.author.send("📜 **Historial:**\n```" + logs.slice(-1500) + "```");
            await message.delete();
        } catch (err) { await message.reply("Aún no hay registros."); }
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
    console.error("--- ❌ ERROR: NO SE ENCUENTRA EL TOKEN EN RENDER ---");
} else {
    client.login(TOKEN).catch(err => {
        console.error("--- ❌ ERROR CRÍTICO AL CONECTAR: ---", err);
    });
}
