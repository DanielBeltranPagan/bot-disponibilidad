console.log("--- ¡EL BOT ESTÁ LEYENDO ESTE ARCHIVO! ---");
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');
const fs = require('fs');

// Servidor para mantener el bot despierto en Render
http.createServer((req, res) => {
    res.end('Bot activo');
}).listen(3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let jugadores = new Set();

// Función para guardar en historial
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

client.once('ready', () => {
  console.log("¡HOLA! SOY EL BOT QUE ESTÁ FUNCIONANDO");
});

client.on('messageCreate', async message => {
    // Comando !panel
    if (message.content === '!test') {
        await message.channel.send(crearPanel());
        await message.delete().catch(() => {});
    }
    // Comando !verlogs (te envía el registro por mensaje privado)
    if (message.content === '!verlogs') {
        try {
            const logs = fs.readFileSync('historial.txt', 'utf8');
            await message.author.send("📜 **Historial de la banda:**\n```" + logs.slice(-1500) + "```");
            await message.delete();
        } catch (err) {
            await message.reply("Aún no hay registros.");
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

// LOGIN (Usa variable de entorno TOKEN para Render)

client.login(process.env.TOKEN || "PEGA_AQUÍ_TU_TOKEN_PARA_PRUEBAS");



